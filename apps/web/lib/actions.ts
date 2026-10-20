"use server";

import { prisma } from "@repo/db/client";
import { AuthError, getSession, requireAuth, requireAdmin } from "@repo/auth";
import { cacheGet, cacheSet, cacheDel } from "@repo/cache";
import { revalidatePath } from "next/cache";
import { userCanAccessContent } from "@/lib/access";
import { sanitizeBunnyPath } from "@/lib/upload-types";

// ── Courses ────────────────────────────────────────────────────────────────────

export async function getCourses(query?: string) {
  // Search results aren't cached — arbitrary query strings would pollute the
  // cache; a plain title filter is cheap enough to run straight against
  // Postgres every time.
  const search = query?.trim().slice(0, 200);
  if (search) {
    return prisma.course.findMany({
      where: { hidden: false, title: { contains: search, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      include: { linkedTrack: { select: { id: true } } },
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
    orderBy: { createdAt: "desc" },
    // The track this course was auto-mirrored into (see createCourse) — /notes
    // links a course's card straight to its dedicated notes/track editor.
    include: { linkedTrack: { select: { id: true } } },
  });
}

// The course outline is public, so it carries no playable URLs. Video and
// Notion metadata come from getContent(), which checks purchase first. The
// cache key is versioned because older entries still hold the URLs.
// One place builds the key, so the reader and the admin invalidation can't drift apart.
// (They did before: the reader used "course:v2:<slug>" while invalidation cleared
// "course:<slug>", so an edited price or new video stayed cached for up to an hour.)
function courseCacheKey(slug: string) {
  return `course:v2:${slug}`;
}

export async function getCourse(slug: string) {
  const CACHE_KEY = courseCacheKey(slug);
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

// Clears the cached course page and the course list. `previousSlug` is passed when the slug
// changed, so the old URL's cache entry is cleared too.
async function invalidateCourseCache(courseId: string, previousSlug?: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });
  const slugs = new Set([course?.slug, previousSlug].filter((s): s is string => !!s));
  await cacheDel(...[...slugs].map(courseCacheKey), "courses:all");
}

export async function getAllCoursesForAdmin() {
  await requireAdmin();
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      linkedTrack: { select: { id: true, title: true } },
      // Lets the admin UI grey out / explain "Delete" before the admin even tries it,
      // rather than only finding out from the error deleteCourse() throws.
      _count: { select: { purchases: true, paymentOrders: true, certificate: true } },
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

  // Self-healing: a course created before every-course-gets-a-track shipped has no
  // linkedTrack yet. Rather than a one-off migration script, it's backfilled right
  // here the first time an admin loads this list — after which it's identical to a
  // course created going forward, so this only ever does real work once per course.
  const missing = courses.filter((c) => !c.linkedTrack);
  if (missing.length > 0) {
    await prisma.$transaction(
      missing.map((c) =>
        prisma.track.create({
          data: {
            title: c.title,
            description: c.description,
            image: c.imageUrl ?? "",
            courseId: c.id,
          },
          select: { id: true },
        })
      )
    );
    await cacheDel("tracks:all");
    const createdTracks = await prisma.track.findMany({
      where: { courseId: { in: missing.map((c) => c.id) } },
      select: { id: true, title: true, courseId: true },
    });
    const trackByCourseId = new Map(createdTracks.map((t) => [t.courseId as string, t]));
    for (const course of courses) {
      const created = trackByCourseId.get(course.id);
      if (created) course.linkedTrack = created;
    }
  }

  return courses;
}

// Students enrolled in one course, for the admin's Students tab. Same "most recent
// PAID order per user" pattern as the Excel export route, just scoped to one
// course instead of every purchase, since the UI only ever shows one at a time.
export async function getEnrolledStudents(courseId: string) {
  await requireAdmin();

  const [purchases, paidOrders] = await Promise.all([
    prisma.userPurchases.findMany({
      where: { courseId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentOrder.findMany({
      where: { courseId, status: "PAID" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const orderByUser = new Map<string, (typeof paidOrders)[number]>();
  for (const order of paidOrders) {
    if (!orderByUser.has(order.userId)) orderByUser.set(order.userId, order);
  }

  return purchases.map((p) => {
    const order = orderByUser.get(p.userId);
    return {
      userId: p.userId,
      name: p.user.name ?? "N/A",
      email: p.user.email ?? "N/A",
      enrolledAt: p.createdAt,
      status: order ? `Paid (₹${order.amount})` : "Free enrollment",
    };
  });
}

// Linking a course into a combo bundle now happens from the track side
// (lib/track-actions.ts's setTrackBundle) rather than here, so a new course
// doesn't need a track at creation time — it can be added to any bundle
// afterwards.
export async function createCourse(data: {
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  slug: string;
}) {
  await requireAdmin();

  // Every course gets a paired Notes track automatically, inheriting its title and
  // thumbnail at creation time — Track.courseId is the existing 1:1 link (already
  // read by userCanAccessProblem), reused here rather than adding a new column.
  // Beyond the initial name/image, the track is fully independent: its own
  // sections, slide uploads and quizzes, never touching the course's video lessons.
  // Track.image has no default, so a course created without a thumbnail falls back
  // to an empty string, same as a manually created track with none set.
  const course = await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || null,
        price: data.price,
        slug: data.slug,
      },
    });
    await tx.track.create({
      data: {
        title: course.title,
        description: course.description,
        image: course.imageUrl ?? "",
        courseId: course.id,
      },
    });
    return course;
  });

  await cacheDel("courses:all");
  await cacheDel("tracks:all");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/notes");
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
  videoUrl?: string;
  thumbnail?: string;
  bunnyVideoId?: string;
  bunnyPdfPath?: string;
}) {
  await requireAdmin();
  if (!data.title.trim()) throw new Error("Video title is required.");
  if (!data.videoUrl && !data.bunnyVideoId) {
    throw new Error("Upload a video file or paste a Bunny video ID.");
  }
  const bunnyPdfPath = data.bunnyPdfPath?.trim() ? sanitizeBunnyPath(data.bunnyPdfPath) : null;

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
        create: {
          videoUrl: data.videoUrl || null,
          thumbnail1Url: data.thumbnail || null,
          bunnyVideoId: data.bunnyVideoId || null,
          bunnyPdfPath,
        },
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

// Attaches (or clears) a Bunny Storage file path directly to a section (FOLDER) —
// a cheatsheet or reference doc for the whole section, not tied to one video. A video
// lesson's own material is still set through VideoMetadata.bunnyPdfPath at upload time;
// this covers the FOLDER case, which has no VideoMetadata row to hang it off of.
export async function setContentMaterial(
  contentId: string,
  courseId: string,
  materialPath: string | null
) {
  await requireAdmin();
  const clean = materialPath?.trim() ? sanitizeBunnyPath(materialPath) : null;

  await prisma.content.update({
    where: { id: contentId },
    data: { materialPath: clean },
  });

  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
  revalidatePath("/courses");
}

// Renames a section (playlist) or a video after creation — the title was previously
// only ever set once, at creation, with no way to fix a typo short of deleting it.
export async function renameContent(contentId: string, courseId: string, title: string) {
  await requireAdmin();
  if (!title.trim()) throw new Error("Title is required.");

  await prisma.content.update({
    where: { id: contentId },
    data: { title: title.trim() },
  });

  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateCourse(
  courseId: string,
  data: { title: string; description: string; imageUrl?: string; price: number; slug: string }
) {
  await requireAdmin();
  const before = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });
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
  await invalidateCourseCache(courseId, before?.slug);
  revalidatePath("/admin");
  revalidatePath("/");
}

// Hiding is the default way to retire a course — it removes it from public
// listings while keeping it directly reachable by URL for anyone who already
// purchased it, the same model already used for "Unlisted" YouTube videos.
// See deleteCourse() below for the one case where a hard delete is also
// allowed.
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

// Hard-deletes a course, but only when nothing of real consequence
// references it yet. A course with any purchase, payment order or
// certificate is left alone — deleting those rows would corrupt the
// client's own payment history and the Excel export, so toggleCourseHidden()
// above is the only option once a course has real activity. A brand new
// course with none of those has nothing stopping a clean delete: this walks
// its whole content tree (the same cascade deleteContent() uses, just seeded
// from every top-level section/video instead of one) and removes it, the
// course's own CourseContent rows, any bundled Track's link to it (the track
// itself is kept — only the paid bundle is undone), and finally the course
// row, all in one transaction.
export async function deleteCourse(courseId: string) {
  await requireAdmin();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      slug: true,
      _count: {
        select: {
          purchases: true,
          paymentOrders: true,
          certificate: true,
          trackBundles: true,
          internshipBundles: true,
        },
      },
    },
  });
  if (!course) throw new Error("Course not found.");

  const { purchases, paymentOrders, certificate, trackBundles, internshipBundles } = course._count;
  if (purchases > 0 || paymentOrders > 0 || certificate > 0) {
    throw new Error(
      "This course has purchase, payment or certificate records and can't be deleted. Hide it instead to remove it from listings without losing them."
    );
  }
  // Both TrackCourse and InternshipTrackCourse have an ON DELETE RESTRICT FK to
  // Course, so deleting a bundled course would otherwise fail with a raw
  // Postgres error instead of this friendly message.
  if (trackBundles > 0 || internshipBundles > 0) {
    throw new Error(
      "This course is linked into a combo bundle or internship track and can't be deleted. Unlink it there first, or hide it instead."
    );
  }

  const topLevel = await prisma.courseContent.findMany({
    where: { courseId },
    select: { contentId: true },
  });
  const ids = topLevel.map((c) => c.contentId);
  let frontier = [...ids];
  while (frontier.length > 0) {
    const children = await prisma.content.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    frontier = children.map((c) => c.id);
    ids.push(...frontier);
  }

  await prisma.$transaction(async (tx) => {
    if (ids.length > 0) {
      await tx.vote.deleteMany({
        where: {
          OR: [
            { comment: { is: { contentId: { in: ids } } } },
            { question: { is: { contentId: { in: ids } } } },
            { answer: { is: { question: { contentId: { in: ids } } } } },
          ],
        },
      });
      await tx.answer.deleteMany({ where: { question: { contentId: { in: ids } } } });
      await tx.question.deleteMany({ where: { contentId: { in: ids } } });
      await tx.comment.deleteMany({ where: { contentId: { in: ids } } });
      await tx.videoProgress.deleteMany({ where: { contentId: { in: ids } } });
      await tx.bookmark.deleteMany({ where: { contentId: { in: ids } } });
    }
    await tx.courseContent.deleteMany({ where: { courseId } });
    if (ids.length > 0) {
      await tx.videoMetadata.deleteMany({ where: { contentId: { in: ids } } });
      await tx.notionMetadata.deleteMany({ where: { contentId: { in: ids } } });
      await tx.content.deleteMany({ where: { id: { in: ids } } });
    }
    await tx.track.updateMany({ where: { courseId }, data: { courseId: null } });
    await tx.course.delete({ where: { id: courseId } });
  });

  await cacheDel(courseCacheKey(course.slug), "courses:all", "tracks:all");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/notes");
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

// Deletes a video or a playlist (section) and, for a playlist, every video inside it.
// Dependent rows go first: comments, questions, answers and their votes, watch progress,
// bookmarks, course links and video metadata. Purchases belong to the course, so they are kept.
export async function deleteContent(contentId: string, courseId: string) {
  await requireAdmin();
  const root = await prisma.content.findUnique({ where: { id: contentId }, select: { id: true } });
  if (!root) throw new Error("Content not found.");

  // The item plus all descendants. Playlists hold videos, so this is normally one extra level.
  const ids = [contentId];
  let frontier = [contentId];
  while (frontier.length > 0) {
    const children = await prisma.content.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    frontier = children.map((c) => c.id);
    ids.push(...frontier);
  }

  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany({
      where: {
        OR: [
          { comment: { is: { contentId: { in: ids } } } },
          { question: { is: { contentId: { in: ids } } } },
          { answer: { is: { question: { contentId: { in: ids } } } } },
        ],
      },
    });
    await tx.answer.deleteMany({ where: { question: { contentId: { in: ids } } } });
    await tx.question.deleteMany({ where: { contentId: { in: ids } } });
    await tx.comment.deleteMany({ where: { contentId: { in: ids } } });
    await tx.videoProgress.deleteMany({ where: { contentId: { in: ids } } });
    await tx.bookmark.deleteMany({ where: { contentId: { in: ids } } });
    await tx.courseContent.deleteMany({ where: { contentId: { in: ids } } });
    await tx.videoMetadata.deleteMany({ where: { contentId: { in: ids } } });
    await tx.notionMetadata.deleteMany({ where: { contentId: { in: ids } } });
    await tx.content.deleteMany({ where: { id: { in: ids } } });
  });

  await invalidateCourseCache(courseId);
  revalidatePath("/admin");
  revalidatePath("/");
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

// ── Admin: student access management ────────────────────────────────────────────
// "Option B": access is never granted automatically (e.g. by an internship
// application) — an admin looks a student up and grants/revokes each course
// individually. Reuses UserPurchases, the same table Razorpay purchases write to, so a
// manually granted course behaves identically to a bought one everywhere else in the app.

/**
 * Finds a user by exact email or studentId match, with their current course access —
 * for the admin access-management tool. Returns null when nothing matches.
 */
export async function findStudentByIdentifier(identifier: string) {
  await requireAdmin();
  const value = identifier.trim();
  if (!value) return null;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: value }, { studentId: value }] },
    select: { id: true, name: true, email: true, studentId: true },
  });
  if (!user) return null;

  const [purchases, certificates] = await Promise.all([
    prisma.userPurchases.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    }),
    prisma.internshipCertificate.findMany({
      where: { userId: user.id },
      select: { id: true, trackName: true, certificateCode: true, issueDate: true },
    }),
  ]);
  return {
    ...user,
    purchasedCourseIds: purchases.map((p) => p.courseId),
    certificates,
  };
}

export async function grantCourseAccess(userId: string, courseId: string) {
  await requireAdmin();
  await prisma.userPurchases.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
  await cacheDel(`purchases:${userId}`, "courses:all");
  revalidatePath("/admin");
}

export async function revokeCourseAccess(userId: string, courseId: string) {
  await requireAdmin();
  await prisma.userPurchases.deleteMany({ where: { userId, courseId } });
  await cacheDel(`purchases:${userId}`, "courses:all");
  revalidatePath("/admin");
}
