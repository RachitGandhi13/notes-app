import { getSession } from "@repo/auth";
import { prisma } from "@repo/db/client";

// Paywall rules, shared by every server action that returns or changes paid
// content. The lesson and track pages also check access, but server actions are
// callable directly over HTTP, so each action has to enforce it itself.

// A lesson can sit under a section folder, so walk up at most a few levels to
// find the course it belongs to.
const MAX_DEPTH = 4;

/** The course a piece of content belongs to, or null if it isn't in any course. */
export async function courseIdForContent(contentId: string): Promise<string | null> {
  let currentId: string | null = contentId;
  for (let depth = 0; depth < MAX_DEPTH && currentId; depth++) {
    const link = await prisma.courseContent.findFirst({
      where: { contentId: currentId },
      select: { courseId: true },
    });
    if (link) return link.courseId;

    const content: { parentId: string | null } | null = await prisma.content.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = content?.parentId ?? null;
  }
  return null;
}

/** True when the signed-in user owns the course or is an admin. */
export async function userCanAccessCourse(courseId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  if (session.user.admin) return true;

  const purchase = await prisma.userPurchases.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  return !!purchase;
}

/** True when the user may see a lesson: they bought its course, or they're an admin. */
export async function userCanAccessContent(contentId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  if (session.user.admin) return true;

  const courseId = await courseIdForContent(contentId);
  return courseId ? userCanAccessCourse(courseId) : false;
}

/**
 * True when a section (problem) may be opened. A section is open if any track
 * it appears in is free, or the user has bought that track's course. Admins
 * always pass.
 */
export async function userCanAccessProblem(problemId: string): Promise<boolean> {
  const session = await getSession();
  if (session?.user?.admin) return true;

  const links = await prisma.trackProblems.findMany({
    where: { problemId },
    select: { track: { select: { courseId: true } } },
  });
  for (const link of links) {
    if (!link.track.courseId) return true;
    if (await userCanAccessCourse(link.track.courseId)) return true;
  }
  return false;
}
