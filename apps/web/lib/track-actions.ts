"use server";

import { prisma } from "@repo/db/client";
import { getSession, requireAdmin, requireAuth } from "@repo/auth";
import { cacheGet, cacheSet, cacheDel } from "@repo/cache";
import { revalidatePath } from "next/cache";
import { validateQuestion, type QuestionInput } from "@/lib/question-validation";

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
        include: {
          problem: { include: { _count: { select: { mcqQuestions: true } } } },
        },
        orderBy: { sortingOrder: "asc" },
      },
      course: { select: { id: true, slug: true, price: true, title: true } },
    },
  });
}

// ── Track entitlement (Phase 3) ─────────────────────────────────────────────────
// A track with no linked course is free/open. A bundled track requires the
// signed-in user to have a matching row in the shared UserPurchases table —
// the same database the course purchase flow writes to, so this is a direct
// query.

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
    include: { mcqQuestions: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
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
  revalidatePath("/notes");

  return track;
}

export async function toggleTrackHidden(trackId: string) {
  await requireAdmin();
  const track = await prisma.track.findUnique({ where: { id: trackId }, select: { hidden: true } });
  if (!track) throw new Error("Track not found.");
  await prisma.track.update({ where: { id: trackId }, data: { hidden: !track.hidden } });
  await cacheDel("tracks:all");
  revalidatePath("/notes");
  revalidatePath("/admin");
}

// ── Admin: sections ─────────────────────────────────────────────────────────────
// A "section" is one Problem row in a track. It can carry an uploaded
// presentation (pptUrl), practice MCQs, or both. `type` is kept in step with
// whether a presentation exists — PPT when there is a file, MCQ otherwise — so
// the sidebar icon and search keep working. Files themselves are uploaded
// through app/api/admin/upload-ppt (a Route Handler, to avoid the smaller
// body-size limit server actions have), which then calls these.

async function refreshTrack(trackId: string) {
  await cacheDel("tracks:all");
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
  await prisma.problem.update({
    where: { id: problemId },
    data: { pptUrl, type: pptUrl ? "PPT" : "MCQ" },
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
