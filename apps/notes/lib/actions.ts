"use server";

import { prisma } from "@repo/db/client";
import { getSession, requireAdmin, requireAuth } from "@repo/auth";
import { cacheGet, cacheSet, cacheDel } from "@repo/cache";
import { revalidatePath } from "next/cache";

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
  return prisma.track.findMany({
    where: { hidden: false },
    include: {
      categories: { include: { category: true } },
      problems: { select: { problemId: true } },
      course: { select: { id: true, slug: true, price: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTrack(trackId: string) {
  return prisma.track.findUnique({
    where: { id: trackId },
    include: {
      categories: { include: { category: true } },
      problems: {
        include: { problem: true },
        orderBy: { sortingOrder: "asc" },
      },
      course: { select: { id: true, slug: true, price: true, title: true } },
    },
  });
}

// ── Cross-app entitlement (Phase 3) ─────────────────────────────────────────────
// A track with no linked course is free/open. A bundled track requires the
// signed-in user to have a matching row in the shared UserPurchases table —
// the same Postgres database the video app writes to, so this is a direct
// query, no cross-app API call needed.

export async function hasTrackAccess(track: { courseId: string | null }): Promise<boolean> {
  if (!track.courseId) return true;
  const session = await getSession();
  if (!session?.user) return false;
  const purchase = await prisma.userPurchases.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: track.courseId } },
  });
  return !!purchase;
}

// ── Problems ───────────────────────────────────────────────────────────────────

export async function getProblem(problemId: string) {
  return prisma.problem.findUnique({
    where: { id: problemId },
    include: { mcqQuestions: true },
  });
}

// ── Quiz scores ────────────────────────────────────────────────────────────────

export async function submitQuizScore(problemId: string, score: number) {
  const session = await requireAuth();
  await prisma.quizScore.create({
    data: { problemId, score, userId: session.user.id },
  });
}

export async function getUserQuizScores() {
  const session = await getSession();
  if (!session?.user) return [];
  return prisma.quizScore.findMany({
    where: { userId: session.user.id },
    include: { problem: { select: { title: true } } },
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
  revalidatePath("/");

  return track;
}

// ── Admin: manually-added lessons (uploaded PPTs + hand-written MCQ quizzes) ───

async function nextSortingOrder(trackId: string) {
  const count = await prisma.trackProblems.count({ where: { trackId } });
  return count + 1;
}

// Called by the upload route (app/api/admin/upload-ppt/route.ts) after it has
// already stored the file — this function only does the DB write, since the
// route needs to run before requireAdmin's normal server-action path (file
// uploads go through a Route Handler, not a server action, to avoid the
// smaller body-size limit Next.js applies to server actions).
export async function addPPTLesson(data: {
  trackId: string;
  title: string;
  description: string;
  pptUrl: string;
}) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    const problem = await tx.problem.create({
      data: {
        title: data.title,
        description: data.description,
        pptUrl: data.pptUrl,
        type: "PPT",
      },
    });
    await tx.trackProblems.create({
      data: {
        trackId: data.trackId,
        problemId: problem.id,
        sortingOrder: await nextSortingOrder(data.trackId),
      },
    });
  });

  await cacheDel("tracks:all");
  revalidatePath(`/tracks/${data.trackId}`);
}

export async function addMCQLesson(data: {
  trackId: string;
  title: string;
  description: string;
  questions: { question: string; options: string[]; correctOption: string }[];
}) {
  await requireAdmin();

  if (data.questions.length === 0) throw new Error("At least one question is required.");
  for (const q of data.questions) {
    if (!q.question.trim()) throw new Error("Every question needs question text.");
    const filledOptions = q.options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) throw new Error(`"${q.question}" needs at least 2 options.`);
    if (!filledOptions.includes(q.correctOption.trim())) {
      throw new Error(`"${q.question}"'s correct option must match one of its options.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    const problem = await tx.problem.create({
      data: {
        title: data.title,
        description: data.description,
        type: "MCQ",
        mcqQuestions: {
          create: data.questions.map((q) => ({
            question: q.question.trim(),
            options: q.options.map((o) => o.trim()).filter(Boolean),
            correctOption: q.correctOption.trim(),
          })),
        },
      },
    });
    await tx.trackProblems.create({
      data: {
        trackId: data.trackId,
        problemId: problem.id,
        sortingOrder: await nextSortingOrder(data.trackId),
      },
    });
  });

  await cacheDel("tracks:all");
  revalidatePath(`/tracks/${data.trackId}`);
}

export async function markTrackIndexed(trackId: string) {
  await requireAdmin();
  await prisma.track.update({ where: { id: trackId }, data: { inSearch: true } });
  await cacheDel("tracks:all");
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
