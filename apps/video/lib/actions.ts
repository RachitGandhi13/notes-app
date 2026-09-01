"use server";

import { prisma } from "@repo/db/client";
import { getSession, requireAuth, requireAdmin } from "@repo/auth";
import { cacheGet, cacheSet, cacheDel } from "@repo/cache";
import { revalidatePath } from "next/cache";
import { extractYouTubeId, youtubeEmbedUrl, youtubeThumbnailUrl } from "./youtube";

// ── Courses ────────────────────────────────────────────────────────────────────

export async function getCourses() {
  const CACHE_KEY = "courses:all";
  const cached = await cacheGet<Awaited<ReturnType<typeof _fetchCourses>>>(CACHE_KEY);
  if (cached) return cached;

  const data = await _fetchCourses();
  await cacheSet(CACHE_KEY, data);
  return data;
}

function _fetchCourses() {
  return prisma.course.findMany({
    where: { hidden: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourse(slug: string) {
  const CACHE_KEY = `course:${slug}`;
  const cached = await cacheGet<Awaited<ReturnType<typeof _fetchCourse>>>(CACHE_KEY);
  if (cached) return cached;

  const data = await _fetchCourse(slug);
  if (data) await cacheSet(CACHE_KEY, data);
  return data;
}

function _fetchCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      content: {
        where: { content: { hidden: false } },
        include: {
          content: {
            include: {
              videoMetadata: true,
              notionMetadata: true,
              children: {
                where: { hidden: false },
                include: {
                  videoMetadata: true,
                  notionMetadata: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

// ── Content ────────────────────────────────────────────────────────────────────

export async function getContent(contentId: string) {
  return prisma.content.findUnique({
    where: { id: contentId },
    include: {
      videoMetadata: true,
      notionMetadata: true,
      parent: true,
    },
  });
}

// ── Purchases ──────────────────────────────────────────────────────────────────

export async function getUserPurchases() {
  const session = await getSession();
  if (!session?.user) return [];

  const CACHE_KEY = `purchases:${session.user.id}`;
  const cached = await cacheGet<Awaited<ReturnType<typeof _fetchPurchases>>>(CACHE_KEY);
  if (cached) return cached;

  const data = await _fetchPurchases(session.user.id);
  await cacheSet(CACHE_KEY, data, 300); // 5 min — purchases change more often
  return data;
}

function _fetchPurchases(userId: string) {
  return prisma.userPurchases.findMany({
    where: { userId },
    include: { course: true },
  });
}

export async function hasPurchased(courseId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  const purchase = await prisma.userPurchases.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  return !!purchase;
}

// Free-course direct enrollment (Razorpay handles paid courses via /api/razorpay/*)
export async function purchaseCourse(courseId: string) {
  const session = await requireAuth();
  const existing = await prisma.userPurchases.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (existing) return;

  await prisma.userPurchases.create({
    data: { userId: session.user.id, courseId },
  });

  await cacheDel(`purchases:${session.user.id}`, "courses:all");
  revalidatePath("/");
}

// ── Progress ───────────────────────────────────────────────────────────────────

export async function getCourseProgress(courseId: string) {
  const session = await getSession();
  if (!session?.user) return [];

  const courseContent = await prisma.courseContent.findMany({
    where: { courseId },
    select: { contentId: true },
  });
  const contentIds = courseContent.map((c) => c.contentId);

  return prisma.videoProgress.findMany({
    where: { userId: session.user.id, contentId: { in: contentIds } },
  });
}

export async function markProgress(contentId: string, markAsRead: boolean) {
  const session = await requireAuth();
  await prisma.videoProgress.upsert({
    where: { userId_contentId: { userId: session.user.id, contentId } },
    create: { userId: session.user.id, contentId, markAsRead },
    update: { markAsRead },
  });
  revalidatePath(`/courses`);
}

// ── Bookmarks ──────────────────────────────────────────────────────────────────

export async function getBookmarks() {
  const session = await getSession();
  if (!session?.user) return [];
  return prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: { content: { include: { videoMetadata: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleBookmark(contentId: string) {
  const session = await requireAuth();
  const existing = await prisma.bookmark.findUnique({
    where: { userId_contentId: { userId: session.user.id, contentId } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.bookmark.create({
    data: { userId: session.user.id, contentId },
  });
  return true;
}

// ── Certificate ────────────────────────────────────────────────────────────────

export async function getCertificate(courseId: string) {
  const session = await getSession();
  if (!session?.user) return null;
  return prisma.certificate.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
}

export async function claimCertificate(courseId: string) {
  const session = await requireAuth();
  return prisma.certificate.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    update: {},
    create: { userId: session.user.id, courseId },
  });
}

// ── Admin: Course / section / video management ────────────────────────────────

async function invalidateCourseCache(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });
  if (course) await cacheDel(`course:${course.slug}`, "courses:all");
}

export async function getAllCoursesForAdmin() {
  await requireAdmin();
  return prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      linkedTrack: { select: { id: true, title: true } },
      content: {
        include: {
          content: {
            include: {
              videoMetadata: true,
              children: { include: { videoMetadata: true }, orderBy: { createdAt: "asc" } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getLinkableTracks() {
  await requireAdmin();
  return prisma.track.findMany({
    select: { id: true, title: true, courseId: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCourse(data: {
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  slug: string;
  trackId?: string;
}) {
  await requireAdmin();

  const course = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl || null,
      price: data.price,
      slug: data.slug,
    },
  });

  if (data.trackId) {
    await prisma.track.update({ where: { id: data.trackId }, data: { courseId: course.id } });
    // "tracks:all" is the notes app's cache key — same Redis instance, shared keyspace
    await cacheDel("tracks:all");
  }

  await cacheDel("courses:all");
  revalidatePath("/");
  revalidatePath("/admin");
  return course;
}

export async function createSection(courseId: string, title: string) {
  await requireAdmin();
  if (!title.trim()) throw new Error("Section title is required.");

  const maxOrder = await prisma.courseContent.aggregate({
    where: { courseId },
    _max: { order: true },
  });

  const folder = await prisma.content.create({
    data: { type: "FOLDER", title: title.trim() },
  });

  await prisma.courseContent.create({
    data: { courseId, contentId: folder.id, order: (maxOrder._max.order ?? 0) + 1 },
  });

  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
}

export async function createVideo(data: {
  courseId: string;
  parentId?: string;
  title: string;
  description?: string;
  youtubeUrl: string;
}) {
  await requireAdmin();
  if (!data.title.trim()) throw new Error("Video title is required.");

  const videoId = extractYouTubeId(data.youtubeUrl);
  if (!videoId) throw new Error("Could not parse a YouTube video ID from that URL.");

  const content = await prisma.content.create({
    data: {
      type: "VIDEO",
      title: data.title.trim(),
      description: data.description?.trim() || null,
      parentId: data.parentId || null,
      thumbnail: youtubeThumbnailUrl(videoId),
      videoMetadata: {
        create: { videoUrl: youtubeEmbedUrl(videoId) },
      },
    },
  });

  // Only top-level items (standalone video, or a section folder) get a
  // CourseContent row — videos inside a section are reached via parentId.
  if (!data.parentId) {
    const maxOrder = await prisma.courseContent.aggregate({
      where: { courseId: data.courseId },
      _max: { order: true },
    });
    await prisma.courseContent.create({
      data: {
        courseId: data.courseId,
        contentId: content.id,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
  }

  await invalidateCourseCache(data.courseId);
  revalidatePath("/admin");
}

export async function updateCourse(
  courseId: string,
  data: { title: string; description: string; imageUrl?: string; price: number; slug: string }
) {
  await requireAdmin();
  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl || null,
      price: data.price,
      slug: data.slug,
    },
  });
  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
  revalidatePath("/");
}

// Courses aren't hard-deleted — a course can have purchases, payment orders,
// and certificates referencing it with no cascade delete configured, so a
// hard delete would fail once there's any real usage. "Hidden" (an existing
// schema field) removes it from public listings while keeping it directly
// reachable by URL for anyone who already purchased it — the same model
// already used for "Unlisted" YouTube videos.
export async function toggleCourseHidden(courseId: string) {
  await requireAdmin();
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { hidden: true },
  });
  if (!course) throw new Error("Course not found.");
  await prisma.course.update({ where: { id: courseId }, data: { hidden: !course.hidden } });
  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
  revalidatePath("/");
}

// Same reasoning as toggleCourseHidden — a Content node can have progress,
// bookmarks, comments, and questions referencing it, so it's hidden rather
// than deleted. _fetchCourse already filters hidden content out of the
// public course tree.
export async function toggleContentHidden(contentId: string, courseId: string) {
  await requireAdmin();
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { hidden: true },
  });
  if (!content) throw new Error("Content not found.");
  await prisma.content.update({ where: { id: contentId }, data: { hidden: !content.hidden } });
  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
}

// Swaps this top-level section/video's order with its adjacent sibling.
// Only applies to top-level CourseContent rows (sections and standalone
// videos) — videos nested inside a section aren't independently orderable
// (Content has no order field; they're read by parentId, orderBy createdAt).
export async function moveContentOrder(
  courseId: string,
  contentId: string,
  direction: "up" | "down"
) {
  await requireAdmin();

  const siblings = await prisma.courseContent.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });

  const index = siblings.findIndex((s) => s.contentId === contentId);
  if (index === -1) throw new Error("Content not found in this course.");

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return; // already at an edge, no-op

  const current = siblings[index]!;
  const swapWith = siblings[swapIndex]!;

  await prisma.$transaction([
    prisma.courseContent.update({
      where: { courseId_contentId: { courseId, contentId: current.contentId } },
      data: { order: swapWith.order },
    }),
    prisma.courseContent.update({
      where: { courseId_contentId: { courseId, contentId: swapWith.contentId } },
      data: { order: current.order },
    }),
  ]);

  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
}
