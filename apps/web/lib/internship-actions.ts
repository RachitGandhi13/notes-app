"use server";

import { prisma } from "@repo/db/client";
import { getSession, requireAdmin } from "@repo/auth";
import { cacheDel } from "@repo/cache";
import { TRACK_COURSE_SLUGS, type InternshipApplication } from "@/lib/internships";

/**
 * Persists a submitted internship application. This is this app's own copy of the
 * submission — the form also posts the same data to the client's Google Sheet (see
 * InternshipForm.tsx), independently of this. Linked to the signed-in user when there is
 * one, so an admin reviewing applications can cross-reference a studentId/email straight
 * to an account when deciding whether to grant course access.
 */
export async function submitInternshipApplication(data: InternshipApplication): Promise<void> {
  const required: (keyof InternshipApplication)[] = [
    "fullName",
    "email",
    "phone",
    "usn",
    "college",
    "branch",
    "yearOfStudy",
    "internshipTrack",
    "preferredDuration",
    "preferredStartDate",
    "linkedIn",
    "resumeLink",
  ];
  for (const field of required) {
    if (!data[field]?.trim()) {
      throw new Error("Please fill in every field before submitting.");
    }
  }

  const session = await getSession();

  await prisma.internshipApplication.create({
    data: {
      userId: session?.user?.id,
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      usn: data.usn.trim(),
      college: data.college.trim(),
      branch: data.branch.trim(),
      yearOfStudy: data.yearOfStudy,
      internshipTrack: data.internshipTrack,
      preferredDuration: data.preferredDuration,
      preferredStartDate: data.preferredStartDate,
      linkedIn: data.linkedIn.trim(),
      resumeLink: data.resumeLink.trim(),
    },
  });
}

/** Recent applications, newest first — for the admin review list. */
export async function getInternshipApplications() {
  await requireAdmin();
  return prisma.internshipApplication.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      usn: true,
      internshipTrack: true,
      preferredDuration: true,
      preferredStartDate: true,
      createdAt: true,
    },
  });
}

// ── Certificates ───────────────────────────────────────────────────────────────

/**
 * Issues (or re-fetches, if one already exists for this student+track) an internship
 * certificate, and grants that track's mapped courses (TRACK_COURSE_SLUGS) in the same
 * action — the client's "course enrollment + Certificate, customised per track" request.
 * Both halves are idempotent: the course grant upserts UserPurchases (safe to repeat), and
 * the @@unique([userId, trackName]) constraint means a second click for the same
 * student/track returns the existing certificate rather than erroring or duplicating.
 */
export async function issueCertificate(userId: string, trackName: string) {
  await requireAdmin();
  if (!trackName.trim()) throw new Error("Choose a track to issue a certificate for.");

  const slugs = TRACK_COURSE_SLUGS[trackName] ?? [];
  if (slugs.length > 0) {
    const courses = await prisma.course.findMany({
      where: { slug: { in: slugs } },
      select: { id: true },
    });
    if (courses.length > 0) {
      await prisma.$transaction(
        courses.map((course) =>
          prisma.userPurchases.upsert({
            where: { userId_courseId: { userId, courseId: course.id } },
            update: {},
            create: { userId, courseId: course.id },
          })
        )
      );
      await cacheDel(`purchases:${userId}`, "courses:all");
    }
  }

  const existing = await prisma.internshipCertificate.findUnique({
    where: { userId_trackName: { userId, trackName } },
  });
  if (existing) return existing;

  return prisma.internshipCertificate.create({
    data: { userId, trackName },
  });
}

/** The signed-in user's own certificates — for the "My Certificates" profile section. */
export async function getMyCertificates() {
  const session = await getSession();
  if (!session?.user) return [];
  return prisma.internshipCertificate.findMany({
    where: { userId: session.user.id },
    orderBy: { issueDate: "desc" },
  });
}

/**
 * Looks a certificate up by its public certificateCode, with the holder's name — for the
 * public /verify/[certificateCode] page. No auth required: that page is the whole point
 * of the QR code, so anyone with the link or a scanner can confirm a certificate is real.
 */
export async function getCertificateByCode(certificateCode: string) {
  return prisma.internshipCertificate.findUnique({
    where: { certificateCode },
    include: { user: { select: { name: true } } },
  });
}
