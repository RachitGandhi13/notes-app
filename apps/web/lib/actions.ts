"use server";

import { prisma } from "@repo/db/client";
import { AuthError, getSession, requireAuth, requireAdmin } from "@repo/auth";
import { cacheGet, cacheSet, cacheDel } from "@repo/cache";
import { revalidatePath } from "next/cache";
import { userCanAccessContent } from "@/lib/access";

// ── Courses ────────────────────────────────────────────────────────────────────

export async function getCourses(query?: string) {
  // Search results aren't cached — arbitrary query strings would pollute the
  // cache; a plain title filter is cheap enough to run straight against
  // Postgres every time.
  const search = query?.trim().slice(0, 200);
  if (search) {
    return prisma.course.findMany({
      where: { hidden: false, title: { contains: search, mode: "insensitive" } },
      include: { _count: { select: { purchases: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

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
    include: { _count: { select: { purchases: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// The course outline is public, so it carries no playable URLs. Video and
// Notion metadata come from getContent(), which checks purchase first. The
// cache key is versioned because older entries still hold the URLs.
export async function getCourse(slug: string) {
  const CACHE_KEY = `course:v2:${slug}`;
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
      _count: { select: { purchases: true } },
      content: {
        where: { content: { hidden: false } },
        include: {
          content: {
            include: {
              children: {
                where: { hidden: false },
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

// Returns the lesson with its playable URL, but only to someone who owns its
// course. Anyone else gets null, the same as an unknown ID, so the response
// doesn't reveal that the content exists.
export async function getContent(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      videoMetadata: true,
      notionMetadata: true,
      parent: true,
    },
  });
  if (!content) return null;
  if (content.hidden && !(await getSession())?.user?.admin) return null;
  if (!(await userCanAccessContent(contentId))) return null;
  return content;
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

// Free-course direct enrollment (Razorpay handles paid courses via /api/razorpay/*).
// The price is checked here, on the server: without that check, any signed-in
// user could enroll in a paid course by calling this action directly.
export async function purchaseCourse(courseId: string) {
  const session = await requireAuth();
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { price: true, hidden: true },
  });
  if (!course || course.hidden) throw new AuthError(403, "This course is not available.");
  if (course.price > 0) {
    throw new AuthError(403, "This course is paid. Use checkout to enroll.");
  }

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
  if (!(await userCanAccessContent(contentId))) {
    throw new AuthError(403, "Buy this course to track progress.");
  }
  await prisma.videoProgress.upsert({
    where: { userId_contentId: { userId: session.user.id, contentId } },
    create: { userId: session.user.id, contentId, markAsRead },
    update: { markAsRead },
  });
  revalidatePath(`/courses`);
}

// ── Bookmarks ──────────────────────────────────────────────────────────────────

// Titles and thumbnails only. The bookmark list never carries a playable URL.
export async function getBookmarks() {
  const session = await getSession();
  if (!session?.user) return [];
  return prisma.bookmark.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      contentId: true,
      createdAt: true,
      content: { select: { id: true, title: true, type: true, thumbnail: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleBookmark(contentId: string) {
  const session = await requireAuth();
  if (!(await userCanAccessContent(contentId))) {
    throw new AuthError(403, "Buy this course to bookmark its lessons.");
  }
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
    // Invalidate the notes track list, which caches under "tracks:all"
    await cacheDel("tracks:all");
  }

  await cacheDel("courses:all");
  revalidatePath("/");
  revalidatePath("/admin");
  return course;
}

export async function createSection(courseId: string, title: string, thumbnail?: string) {
  await requireAdmin();
  if (!title.trim()) throw new Error("Section title is required.");

  const maxOrder = await prisma.courseContent.aggregate({
    where: { courseId },
    _max: { order: true },
  });

  const folder = await prisma.content.create({
    data: { type: "FOLDER", title: title.trim(), thumbnail: thumbnail || null },
  });

  await prisma.courseContent.create({
    data: { courseId, contentId: folder.id, order: (maxOrder._max.order ?? 0) + 1 },
  });

  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
}

// Called by the upload route (app/api/admin/upload-video/route.ts) after it
// has already stored the file — this function only does the DB write, since
// the route needs to run before requireAdmin's normal server-action path
// (file uploads go through a Route Handler, not a server action, to avoid
// the smaller body-size limit Next.js applies to server actions).
export async function createUploadedVideo(data: {
  courseId: string;
  parentId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string;
}) {
  await requireAdmin();
  if (!data.title.trim()) throw new Error("Video title is required.");

  // The thumbnail is stored twice on purpose: Content.thumbnail feeds the
  // curriculum list, VideoMetadata.thumbnail1Url is the player's poster frame.
  const content = await prisma.content.create({
    data: {
      type: "VIDEO",
      title: data.title.trim(),
      description: data.description?.trim() || null,
      thumbnail: data.thumbnail || null,
      parentId: data.parentId || null,
      videoMetadata: {
        create: { videoUrl: data.videoUrl, thumbnail1Url: data.thumbnail || null },
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

// Set or clear the thumbnail of a section (playlist) or a video after creation.
export async function setContentThumbnail(
  contentId: string,
  courseId: string,
  thumbnail: string | null
) {
  await requireAdmin();

  const content = await prisma.content.update({
    where: { id: contentId },
    data: { thumbnail: thumbnail || null },
    select: { type: true },
  });
  // Keep the player's poster frame in step with the list thumbnail for videos.
  if (content.type === "VIDEO") {
    await prisma.videoMetadata.updateMany({
      where: { contentId },
      data: { thumbnail1Url: thumbnail || null },
    });
  }

  await invalidateCourseCache(courseId);
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
