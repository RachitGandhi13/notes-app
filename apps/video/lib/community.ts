"use server";

import { prisma } from "@repo/db/client";
import { getSession, requireAuth, requireAdmin } from "@repo/auth";
import { revalidatePath } from "next/cache";

// ── Comments ───────────────────────────────────────────────────────────────────

export async function getComments(contentId: string) {
  return prisma.comment.findMany({
    where: { contentId, approved: true },
    include: {
      author: { select: { id: true, name: true, image: true } },
      votes: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addComment(contentId: string, body: string) {
  const session = await requireAuth();
  if (!body.trim()) throw new Error("Comment body is required.");

  await prisma.comment.create({
    data: {
      contentId,
      authorId: session.user.id,
      body: body.trim(),
      approved: false, // requires admin approval
    },
  });
  revalidatePath(`/courses`);
}

export async function voteOnComment(commentId: string, voteType: "UPVOTE" | "DOWNVOTE") {
  const session = await requireAuth();

  // Toggle: remove if same vote already exists
  const existing = await prisma.vote.findFirst({
    where: { commentId, userId: session.user.id },
  });
  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    if (existing.voteType === voteType) return; // toggled off
  }

  await prisma.vote.create({
    data: { commentId, userId: session.user.id, voteType },
  });
  revalidatePath(`/courses`);
}

// ── Admin comment moderation ───────────────────────────────────────────────────

export async function getPendingComments() {
  await requireAdmin();
  return prisma.comment.findMany({
    where: { approved: false },
    include: {
      author: { select: { name: true, email: true } },
      content: { select: { title: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function approveComment(commentId: string) {
  await requireAdmin();
  await prisma.comment.update({ where: { id: commentId }, data: { approved: true } });
  revalidatePath(`/admin`);
}

export async function deleteComment(commentId: string) {
  await requireAdmin();
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/admin`);
}

// ── Questions ──────────────────────────────────────────────────────────────────

export async function getQuestions(contentId: string) {
  return prisma.question.findMany({
    where: { contentId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      votes: true,
      answers: {
        include: {
          author: { select: { id: true, name: true, image: true } },
          votes: true,
        },
        orderBy: [{ accepted: "desc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addQuestion(contentId: string, title: string, body: string) {
  const session = await requireAuth();
  if (!title.trim() || !body.trim()) throw new Error("Title and body are required.");

  await prisma.question.create({
    data: {
      contentId,
      authorId: session.user.id,
      title: title.trim(),
      body: body.trim(),
    },
  });
  revalidatePath(`/courses`);
}

export async function voteOnQuestion(questionId: string, voteType: "UPVOTE" | "DOWNVOTE") {
  const session = await requireAuth();

  const existing = await prisma.vote.findFirst({
    where: { questionId, userId: session.user.id },
  });
  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    if (existing.voteType === voteType) return;
  }

  await prisma.vote.create({
    data: { questionId, userId: session.user.id, voteType },
  });
  revalidatePath(`/courses`);
}

// ── Answers ────────────────────────────────────────────────────────────────────

export async function addAnswer(questionId: string, body: string) {
  const session = await requireAuth();
  if (!body.trim()) throw new Error("Answer body is required.");

  await prisma.answer.create({
    data: {
      questionId,
      authorId: session.user.id,
      body: body.trim(),
    },
  });
  revalidatePath(`/courses`);
}

export async function acceptAnswer(answerId: string) {
  const session = await requireAuth();

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: { question: true },
  });
  if (!answer) throw new Error("Answer not found.");

  // Only question author or admin can accept
  const isAdmin = session.user.admin;
  const isAuthor = answer.question.authorId === session.user.id;
  if (!isAuthor && !isAdmin) throw new Error("Forbidden.");

  // Unaccept all other answers for this question, then accept this one
  await prisma.answer.updateMany({
    where: { questionId: answer.questionId },
    data: { accepted: false },
  });
  await prisma.answer.update({ where: { id: answerId }, data: { accepted: true } });
  revalidatePath(`/courses`);
}

export async function voteOnAnswer(answerId: string, voteType: "UPVOTE" | "DOWNVOTE") {
  const session = await requireAuth();

  const existing = await prisma.vote.findFirst({
    where: { answerId, userId: session.user.id },
  });
  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    if (existing.voteType === voteType) return;
  }

  await prisma.vote.create({
    data: { answerId, userId: session.user.id, voteType },
  });
  revalidatePath(`/courses`);
}
