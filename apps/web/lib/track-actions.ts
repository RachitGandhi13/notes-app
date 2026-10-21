"use server";

import { prisma } from "@repo/db/client";
import { AuthError, getSession, requireAdmin, requireAuth } from "@repo/auth";
import { cacheGet, cacheSet, cacheDel } from "@repo/cache";
import { revalidatePath } from "next/cache";
import { validateQuestion, type QuestionInput } from "@/lib/question-validation";
import { sanitizeBunnyPath } from "@/lib/upload-types";
import { userCanAccessCourse, userCanAccessProblem } from "@/lib/access";
import { grantOrderAccess } from "@/lib/razorpay";

// ── Tracks ─────────────────────────────────────────────────────────────────────

export async function getTracks() {
  const CACHE_KEY = "tracks:all";
  const cached = await cacheGet<Awaited<ReturnType<typeof _fetchTracks>>>(CACHE_KEY);
  if (cached) return cached;

  const data = await _fetchTracks();
  await cacheSet(CACHE_KEY, data);
  return data;
}

function _fetchTracks() {
  // Excludes tracks auto-mirrored from a course (courseId set) — those are
  // surfaced on /notes as the course's own card, not a second entry here.
  return prisma.track.findMany({
    where: { hidden: false, courseId: null },
    include: {
      categories: { include: { category: true } },
      problems: { select: { problemId: true } },
      courses: {
        include: { course: { select: { id: true, slug: true, price: true, title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// One place builds the key, same reasoning as courseCacheKey in lib/actions.ts.
function trackCacheKey(trackId: string) {
  return `track:v1:${trackId}`;
}

function _fetchTrackById(trackId: string) {
  return prisma.track.findUnique({
    where: { id: trackId },
    include: {
      categories: { include: { category: true } },
      problems: {
        include: {
          problem: { include: { _count: { select: { mcqQuestions: true } } } },
        },
        orderBy: { sortingOrder: "asc" },
      },
      courses: {
        include: { course: { select: { id: true, slug: true, price: true, title: true } } },
      },
      // The course this track was auto-mirrored from (courseId), if any — distinct
      // from `courses` above (the many-to-many combo-bundle link). Only its slug is
      // needed, to link back to the course's own page from the locked state.
      course: { select: { slug: true } },
    },
  });
}

// The raw fetch is cached (it's the same for every caller), but the per-user
// locking below is applied on every call regardless of cache hit, so a
// cached entry never leaks a paid pptUrl to a user who hasn't bought it.
export async function getTrack(trackId: string) {
  const CACHE_KEY = trackCacheKey(trackId);
  let track = await cacheGet<Awaited<ReturnType<typeof _fetchTrackById>>>(CACHE_KEY);
  if (!track) {
    track = await _fetchTrackById(trackId);
    if (track) await cacheSet(CACHE_KEY, track);
  }
  if (!track) return null;

  const session = await getSession();
  if (session?.user?.admin || (await hasTrackAccess(track))) return track;

  // Locked: keep the outline (titles) for the paywall, but drop the slide URLs.
  return {
    ...track,
    problems: track.problems.map((tp) => ({
      ...tp,
      problem: { ...tp.problem, pptUrl: null },
    })),
  };
}

// ── Track entitlement (combo bundles) ───────────────────────────────────────────
// A track with no linked courses is free/open. A combo track requires the
// signed-in user to own (via the shared UserPurchases table) at least one of
// the courses it bundles — whichever course they bought it through, whether
// that was the combo itself or one of the courses individually.

export async function hasTrackAccess(track: {
  id: string;
  courseId?: string | null;
}): Promise<boolean> {
  // Auto-mirrored from a course (courseId set): access is simply "do you own
  // that course" — the same UserPurchases check as everywhere else, not the
  // combo-bundle purchase flow below, which doesn't apply to these at all.
  if (track.courseId) {
    const session = await getSession();
    if (!session?.user) return false;
    return userCanAccessCourse(track.courseId);
  }

  const links = await prisma.trackCourse.findMany({
    where: { trackId: track.id },
    select: { courseId: true },
  });
  if (links.length === 0) return true;

  const session = await getSession();
  if (!session?.user) return false;

  const owned = await prisma.userPurchases.findFirst({
    where: { userId: session.user.id, courseId: { in: links.map((l) => l.courseId) } },
  });
  return !!owned;
}

// ── Problems ───────────────────────────────────────────────────────────────────

// A section's slides and quiz are paid content for bundled tracks, so they are
// returned only to users who can open one of the tracks it appears in.
export async function getProblem(problemId: string) {
  if (!(await userCanAccessProblem(problemId))) return null;
  return prisma.problem.findUnique({
    where: { id: problemId },
    include: { mcqQuestions: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
}

// ── Quiz scores ────────────────────────────────────────────────────────────────

export async function submitQuizScore(problemId: string, score: number) {
  const session = await requireAuth();
  if (!(await userCanAccessProblem(problemId))) {
    throw new AuthError(403, "Buy this track to save quiz scores.");
  }
  // The score is computed in the browser, so check it is a plausible count of
  // correct answers before it is saved.
  const total = await prisma.mCQQuestion.count({ where: { problemId } });
  if (!Number.isInteger(score) || score < 0 || score > total) {
    throw new Error("Invalid score.");
  }
  await prisma.quizScore.create({
    data: { problemId, score, userId: session.user.id },
  });
}

export async function getUserQuizScores() {
  const session = await getSession();
  if (!session?.user) return [];
  return prisma.quizScore.findMany({
    where: { userId: session.user.id },
    include: {
      problem: {
        select: {
          title: true,
          // A problem's track, so the profile page can link a quiz score straight
          // back to /tracks/[trackId]/[problemId]. TrackProblems is many-to-many in
          // the schema, but every problem is created under a single track in practice.
          trackProblems: { take: 1, select: { trackId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ── Admin: create track ────────────────────────────────────────────────────────

export async function createTrack(data: {
  title: string;
  description: string;
  image: string;
  categoryName: string;
}) {
  await requireAdmin();

  const category = await prisma.categories.upsert({
    where: { id: data.categoryName },
    update: {},
    create: { id: data.categoryName, category: data.categoryName },
  });

  const track = await prisma.track.create({
    data: {
      title: data.title,
      description: data.description,
      image: data.image,
      categories: { create: { categoryId: category.id } },
    },
  });

  await cacheDel("tracks:all");
  revalidatePath("/notes");

  return track;
}

// ── Admin: combo bundles ─────────────────────────────────────────────────────

/** Every course, for the bundle checkbox list. */
export async function getCoursesForBundling() {
  await requireAdmin();
  return prisma.course.findMany({
    where: { hidden: false },
    select: { id: true, title: true, price: true, slug: true },
    orderBy: { title: "asc" },
  });
}

// Combo bundles currently on sale — a "paid, active bundle" is fully defined by
// bundlePrice being set (setTrackBundle only ever sets it alongside >=1 linked
// course) plus not hidden. Shared by the homepage ComboBanner and the admin
// Grant-Access modal's "grant a combo" list, rather than two near-identical
// queries.
export async function getActiveBundles() {
  const CACHE_KEY = "bundles:active";
  const cached = await cacheGet<Awaited<ReturnType<typeof _fetchActiveBundles>>>(CACHE_KEY);
  if (cached) return cached;
  const data = await _fetchActiveBundles();
  await cacheSet(CACHE_KEY, data);
  return data;
}

function _fetchActiveBundles() {
  return prisma.track.findMany({
    where: { hidden: false, bundlePrice: { not: null } },
    include: {
      courses: {
        include: { course: { select: { id: true, slug: true, title: true, price: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Grants every course a combo bundle links in one click — reuses the exact
// same grantOrderAccess() a real Razorpay combo purchase uses, so a manually
// granted combo is indistinguishable from a bought one (including the
// enrollment email per newly-granted course), same reasoning as
// grantCourseAccess for a single course.
export async function grantComboAccess(userId: string, trackId: string) {
  await requireAdmin();
  await grantOrderAccess({ userId, courseId: null, trackId });
  revalidatePath("/admin");
}

// Revokes every course a combo bundle links, for one student — the inverse of
// grantComboAccess, used when "Remove Student" is clicked while a combo
// (rather than a single course) is selected in the Students tab.
export async function revokeComboAccess(userId: string, trackId: string) {
  await requireAdmin();
  const links = await prisma.trackCourse.findMany({
    where: { trackId },
    select: { courseId: true },
  });
  await prisma.userPurchases.deleteMany({
    where: { userId, courseId: { in: links.map((l) => l.courseId) } },
  });
  await cacheDel(`purchases:${userId}`, "courses:all");
  revalidatePath("/admin");
}

// One-step combo creation for the Admin -> Courses shortcut: creates the
// underlying Track and its TrackCourse links/bundlePrice together, instead of
// making the admin create a track from Notes first and then open it to bundle
// courses. No category is attached — this track exists to be sold as a combo,
// not browsed by topic, so skipping it avoids asking for an input that
// wouldn't mean anything here (the Notes -> "Create a track" flow still asks
// for one, unchanged).
export async function createComboBundle(data: {
  title: string;
  description: string;
  courseIds: string[];
  bundlePrice: number;
}) {
  await requireAdmin();
  const title = data.title.trim();
  if (!title) throw new Error("Give the combo a name.");
  const courseIds = [...new Set(data.courseIds)];
  if (courseIds.length < 2) throw new Error("Pick at least 2 courses to combine.");
  if (!data.bundlePrice || data.bundlePrice <= 0) throw new Error("Set a combo price.");

  const track = await prisma.$transaction(async (tx) => {
    const track = await tx.track.create({
      data: {
        title,
        description: data.description.trim(),
        image: "",
        bundlePrice: data.bundlePrice,
      },
    });
    await tx.trackCourse.createMany({
      data: courseIds.map((courseId) => ({ trackId: track.id, courseId })),
    });
    return track;
  });

  await cacheDel("tracks:all", "bundles:active");
  revalidatePath("/notes");
  revalidatePath("/admin");
  revalidatePath("/");
  return track;
}

/** Every combo bundle, including hidden ones — for the Admin -> Courses list
 * (an admin should see everything they've created, not just what's publicly
 * on sale; getActiveBundles() stays the public-facing, hidden-filtered one
 * the homepage banner uses). */
export async function getAllBundlesForAdmin() {
  await requireAdmin();
  return prisma.track.findMany({
    where: { bundlePrice: { not: null } },
    include: {
      courses: {
        include: { course: { select: { id: true, slug: true, title: true, price: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Every student who owns at least one of a combo's linked courses — the same
// "owns any" semantics hasTrackAccess() already uses, so this list matches
// exactly who the public site currently treats as having the combo. Status is
// "Paid (combo)" only when they have an actual PAID order for this trackId;
// otherwise they reached this list via a free/manual/individual grant on one
// of the linked courses, same distinction getEnrolledStudents() draws for a
// single course.
export async function getEnrolledStudentsForBundle(trackId: string) {
  await requireAdmin();

  const links = await prisma.trackCourse.findMany({
    where: { trackId },
    select: { courseId: true },
  });
  const courseIds = links.map((l) => l.courseId);
  if (courseIds.length === 0) return [];

  const [purchases, paidOrders] = await Promise.all([
    prisma.userPurchases.findMany({
      where: { courseId: { in: courseIds } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.paymentOrder.findMany({ where: { trackId, status: "PAID" } }),
  ]);

  const paidUserIds = new Set(paidOrders.map((o) => o.userId));
  const amountByUser = new Map(paidOrders.map((o) => [o.userId, o.amount]));

  // One row per student — the earliest of their linked-course purchases is
  // the enrollment date, since that's when they first got combo-equivalent access.
  const earliestByUser = new Map<string, (typeof purchases)[number]>();
  for (const p of purchases) {
    if (!earliestByUser.has(p.userId)) earliestByUser.set(p.userId, p);
  }

  return [...earliestByUser.values()].map((p) => ({
    userId: p.userId,
    name: p.user.name ?? "N/A",
    email: p.user.email ?? "N/A",
    enrolledAt: p.createdAt,
    status: paidUserIds.has(p.userId)
      ? `Paid (₹${amountByUser.get(p.userId)} combo)`
      : "Free enrollment",
  }));
}

// Replaces a track's whole set of bundled courses and its bundle price in one
// transaction, rather than adding/removing incrementally — simpler to reason
// about from a checkbox-list UI, and the set is small enough that a full
// replace is cheap. An empty courseIds list (or omitting bundlePrice) turns
// the track back into a free track.
export async function setTrackBundle(
  trackId: string,
  data: { courseIds: string[]; bundlePrice: number | null }
) {
  await requireAdmin();

  const courseIds = [...new Set(data.courseIds)];
  if (courseIds.length > 0 && (!data.bundlePrice || data.bundlePrice <= 0)) {
    throw new Error("Set a bundle price to link courses to this track.");
  }

  await prisma.$transaction([
    prisma.trackCourse.deleteMany({ where: { trackId } }),
    ...courseIds.map((courseId) => prisma.trackCourse.create({ data: { trackId, courseId } })),
    prisma.track.update({
      where: { id: trackId },
      data: { bundlePrice: courseIds.length > 0 ? data.bundlePrice : null },
    }),
  ]);

  await cacheDel("tracks:all", "bundles:active", trackCacheKey(trackId));
  revalidatePath("/notes");
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/admin");
  revalidatePath("/");
}

// Renames a track and/or updates its description — previously only settable at
// creation, the same gap renameContent (Courses tab) already closed for sections.
export async function updateTrack(trackId: string, data: { title: string; description: string }) {
  await requireAdmin();
  const title = data.title.trim();
  if (!title) throw new Error("Track title is required.");

  await prisma.track.update({
    where: { id: trackId },
    data: { title, description: data.description.trim() },
  });
  await cacheDel("tracks:all", trackCacheKey(trackId));
  revalidatePath("/notes");
  revalidatePath("/admin");
}

export async function toggleTrackHidden(trackId: string) {
  await requireAdmin();
  const track = await prisma.track.findUnique({ where: { id: trackId }, select: { hidden: true } });
  if (!track) throw new Error("Track not found.");
  await prisma.track.update({ where: { id: trackId }, data: { hidden: !track.hidden } });
  await cacheDel("tracks:all", "bundles:active", trackCacheKey(trackId));
  revalidatePath("/notes");
  revalidatePath("/admin");
  revalidatePath("/");
}

// Permanently removes a track and its section/category links. Problem rows
// (sections) are NOT deleted — TrackProblems is many-to-many (no trackId on
// Problem itself), so a section can be shared across tracks; only this
// track's membership in it goes away, same as removing one entry from a
// playlist without touching the song.
export async function deleteNoteTrack(trackId: string) {
  await requireAdmin();

  const track = await prisma.track.findUnique({ where: { id: trackId }, select: { id: true } });
  if (!track) throw new Error("Track not found.");

  const paidOrders = await prisma.paymentOrder.count({ where: { trackId, status: "PAID" } });
  if (paidOrders > 0) {
    throw new Error(
      "This track has paid combo-bundle purchases and can't be deleted. Hide it instead to keep the payment record."
    );
  }

  await prisma.$transaction([
    prisma.trackCategory.deleteMany({ where: { trackId } }),
    prisma.trackProblems.deleteMany({ where: { trackId } }),
    prisma.trackCourse.deleteMany({ where: { trackId } }),
    prisma.track.delete({ where: { id: trackId } }),
  ]);

  await cacheDel("tracks:all", trackCacheKey(trackId));
  revalidatePath("/notes");
  revalidatePath("/admin");
}

// ── Admin: sections ─────────────────────────────────────────────────────────────
// A "section" is one Problem row in a track. It can carry a slide/material (pptUrl —
// a Bunny Storage file path, served through /api/notes/[id] the same way a course's
// materials are), practice MCQs, or both. `type` is kept in step with whether a
// material is set — PPT when it is, MCQ otherwise — so the sidebar icon and search
// keep working.

async function refreshTrack(trackId: string) {
  await cacheDel("tracks:all", trackCacheKey(trackId));
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/notes");
}

async function trackIdOfProblem(problemId: string) {
  const link = await prisma.trackProblems.findFirst({
    where: { problemId },
    select: { trackId: true },
  });
  return link?.trackId ?? null;
}

export async function addSection(data: {
  trackId: string;
  title: string;
  description?: string;
  pptUrl?: string;
}) {
  await requireAdmin();
  const title = data.title.trim();
  if (!title) throw new Error("Section title is required.");

  const problem = await prisma.$transaction(async (tx) => {
    const created = await tx.problem.create({
      data: {
        title,
        description: data.description?.trim() ?? "",
        pptUrl: data.pptUrl || null,
        type: data.pptUrl ? "PPT" : "MCQ",
      },
    });
    const count = await tx.trackProblems.count({ where: { trackId: data.trackId } });
    await tx.trackProblems.create({
      data: { trackId: data.trackId, problemId: created.id, sortingOrder: count + 1 },
    });
    return created;
  });

  await refreshTrack(data.trackId);
  return { id: problem.id };
}

export async function updateSection(
  problemId: string,
  data: { title: string; description: string }
) {
  await requireAdmin();
  const title = data.title.trim();
  if (!title) throw new Error("Section title is required.");

  await prisma.problem.update({
    where: { id: problemId },
    data: { title, description: data.description.trim() },
  });
  const trackId = await trackIdOfProblem(problemId);
  if (trackId) await refreshTrack(trackId);
}

// Called by the upload route after it has stored a replacement file, or with
// null to remove the presentation from a section.
export async function setSectionPPT(problemId: string, pptUrl: string | null) {
  await requireAdmin();
  const clean = pptUrl ? sanitizeBunnyPath(pptUrl) : null;
  await prisma.problem.update({
    where: { id: problemId },
    data: { pptUrl: clean, type: clean ? "PPT" : "MCQ" },
  });
  const trackId = await trackIdOfProblem(problemId);
  if (trackId) await refreshTrack(trackId);
}

// Removes the section, its practice questions and students' scores for it.
export async function deleteSection(problemId: string) {
  await requireAdmin();
  const trackId = await trackIdOfProblem(problemId);

  await prisma.$transaction(async (tx) => {
    await tx.quizScore.deleteMany({ where: { problemId } });
    await tx.mCQQuestion.deleteMany({ where: { problemId } });
    await tx.trackProblems.deleteMany({ where: { problemId } });
    await tx.problem.delete({ where: { id: problemId } });

    // Close the gap so the sidebar numbering stays 1, 2, 3…
    if (trackId) {
      const rest = await tx.trackProblems.findMany({
        where: { trackId },
        orderBy: { sortingOrder: "asc" },
      });
      for (const [i, tp] of rest.entries()) {
        if (tp.sortingOrder !== i + 1) {
          await tx.trackProblems.update({
            where: { trackId_problemId: { trackId, problemId: tp.problemId } },
            data: { sortingOrder: i + 1 },
          });
        }
      }
    }
  });

  if (trackId) await refreshTrack(trackId);
  return { trackId };
}

export async function moveSection(trackId: string, problemId: string, direction: "up" | "down") {
  await requireAdmin();
  const list = await prisma.trackProblems.findMany({
    where: { trackId },
    orderBy: { sortingOrder: "asc" },
  });
  const i = list.findIndex((tp) => tp.problemId === problemId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= list.length) return;

  // Renumber the whole list rather than swapping two values, so a track whose
  // numbering already has gaps or ties still ends up strictly ordered.
  const moving = list[i];
  const neighbour = list[j];
  if (!moving || !neighbour) return;
  const reordered = [...list];
  reordered[i] = neighbour;
  reordered[j] = moving;
  await prisma.$transaction(
    reordered.map((tp, k) =>
      prisma.trackProblems.update({
        where: { trackId_problemId: { trackId, problemId: tp.problemId } },
        data: { sortingOrder: k + 1 },
      })
    )
  );
  await refreshTrack(trackId);
}

// ── Admin: practice questions ───────────────────────────────────────────────────

function cleanQuestion(q: QuestionInput): QuestionInput {
  const result = validateQuestion(q);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

export async function addQuestion(problemId: string, input: QuestionInput) {
  await requireAdmin();
  const data = cleanQuestion(input);
  await prisma.mCQQuestion.create({ data: { ...data, problemId } });
  const trackId = await trackIdOfProblem(problemId);
  if (trackId) await refreshTrack(trackId);
}

export async function updateQuestion(questionId: string, input: QuestionInput) {
  await requireAdmin();
  const data = cleanQuestion(input);
  const q = await prisma.mCQQuestion.update({ where: { id: questionId }, data });
  const trackId = await trackIdOfProblem(q.problemId);
  if (trackId) await refreshTrack(trackId);
}

export async function deleteQuestion(questionId: string) {
  await requireAdmin();
  const q = await prisma.mCQQuestion.delete({ where: { id: questionId } });
  const trackId = await trackIdOfProblem(q.problemId);
  if (trackId) await refreshTrack(trackId);
}

// ── AI Semantic Search ─────────────────────────────────────────────────────────

export async function indexTrack(trackId: string) {
  await requireAdmin();

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      problems: {
        include: { problem: { include: { mcqQuestions: true } } },
        orderBy: { sortingOrder: "asc" },
      },
    },
  });

  if (!track) throw new Error("Track not found");

  const { insertData } = await import("./search");

  const problems = track.problems.map((tp) => ({
    id: tp.problem.id,
    title: tp.problem.title,
    description: tp.problem.description,
    questions: tp.problem.mcqQuestions.map((q) => q.question),
  }));

  const count = await insertData(track.id, track.title, track.image, problems);

  await prisma.track.update({ where: { id: trackId }, data: { inSearch: true } });
  await cacheDel("tracks:all");

  return count;
}

export async function semanticSearch(query: string) {
  if (!query.trim()) return [];

  const { getSearchResults } = await import("./search");
  return getSearchResults(query);
}
