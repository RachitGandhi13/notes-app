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
    },
  });
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
  problems: { notionDocId: string; title: string }[];
}) {
  await requireAdmin();

  const category = await prisma.categories.upsert({
    where: { id: data.categoryName },
    update: {},
    create: { id: data.categoryName, category: data.categoryName },
  });

  await prisma.$transaction(async (tx) => {
    const track = await tx.track.create({
      data: {
        title: data.title,
        description: data.description,
        image: data.image,
        categories: { create: { categoryId: category.id } },
      },
    });

    for (let i = 0; i < data.problems.length; i++) {
      const p = data.problems[i]!;
      const problem = await tx.problem.create({
        data: {
          title: p.title,
          description: p.title,
          notionDocId: p.notionDocId,
          type: "Blog",
        },
      });
      await tx.trackProblems.create({
        data: { trackId: track.id, problemId: problem.id, sortingOrder: i + 1 },
      });
    }
  });

  await cacheDel("tracks:all");
  revalidatePath("/");
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
        include: { problem: true },
        orderBy: { sortingOrder: "asc" },
      },
    },
  });

  if (!track) throw new Error("Track not found");

  const { insertData } = await import("./search");

  const problems = track.problems.map((tp) => ({
    id: tp.problem.id,
    title: tp.problem.title,
    notionDocId: tp.problem.notionDocId,
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
