"use server";

import { prisma } from "@repo/db/client";
import {
  getAppUrl,
  getSession,
  requireAdmin,
  sendInternshipAccessGrantedEmail,
  sendInternshipApplicationReceivedEmail,
} from "@repo/auth";
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

  try {
    await sendInternshipApplicationReceivedEmail({
      email: data.email.trim(),
      name: data.fullName.trim(),
      trackName: data.internshipTrack,
    });
  } catch (err) {
    // The application is already saved above — a confirmation-email failure must not
    // make the student think their application didn't go through.
    console.error(
      "[email] Application-received email failed:",
      err instanceof Error ? err.message : err
    );
  }
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
 *
 * The "access granted" email only fires when a certificate is genuinely newly created —
 * not on a repeat click for an already-issued track — so re-clicking Issue never
 * re-sends it.
 */
export async function issueCertificate(userId: string, trackName: string) {
  await requireAdmin();
  if (!trackName.trim()) throw new Error("Choose a track to issue a certificate for.");

  const slugs = TRACK_COURSE_SLUGS[trackName] ?? [];
  let grantedCourseTitles: string[] = [];
  if (slugs.length > 0) {
    const courses = await prisma.course.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, title: true },
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
      grantedCourseTitles = courses.map((course) => course.title);
    }
  }

  const existing = await prisma.internshipCertificate.findUnique({
    where: { userId_trackName: { userId, trackName } },
  });
  if (existing) return existing;

  const certificate = await prisma.internshipCertificate.create({
    data: { userId, trackName },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, studentId: true },
  });
  if (user?.email) {
    try {
      await sendInternshipAccessGrantedEmail({
        email: user.email,
        name: user.name ?? "there",
        trackName,
        studentId: user.studentId,
        grantedCourseTitles,
        appUrl: getAppUrl(),
      });
    } catch (err) {
      // The courses and certificate are already granted/created above — an email
      // failure must not make it look like the admin's action didn't take effect.
      console.error(
        "[email] Access-granted email failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return certificate;
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
