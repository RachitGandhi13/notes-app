"use server";

import { prisma } from "@repo/db/client";
import { getSession, requireAuth } from "@repo/auth";
import { cacheGet, cacheSet, cacheDel } from "@repo/cache";
import { revalidatePath } from "next/cache";

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
        include: {
          content: {
            include: {
              videoMetadata: true,
              notionMetadata: true,
              children: {
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

// Free-course direct enrollment (Stripe handles paid courses via webhook)
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
