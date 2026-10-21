"use server";

import { prisma } from "@repo/db/client";
import {
  getAppUrl,
  getSession,
  requireAdmin,
  sendInternshipAccessGrantedEmail,
  sendInternshipApplicationReceivedEmail,
} from "@repo/auth";
import { cacheDel, cacheGet, cacheSet } from "@repo/cache";
import { revalidatePath } from "next/cache";
import { type InternshipApplication } from "@/lib/internships";

/**
 * Persists a submitted internship application. This is this app's own copy of the
 * submission — the form also posts the same data to the client's Google Sheet (see
 * InternshipForm.tsx), independently of this. Linked to the signed-in user when there is
 * one, so an admin reviewing applications can cross-reference a studentId/email straight
 * to an account when deciding whether to grant course access.
 */
export async function submitInternshipApplication(data: InternshipApplication): Promise<void> {
  // linkedIn is intentionally not required — not every applicant has a LinkedIn
  // profile yet, and the form itself no longer requires it either.
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
    "resumeLink",
  ];
  for (const field of required) {
    if (!data[field]?.trim()) {
      throw new Error("Please fill in every field before submitting.");
    }
  }

  const session = await getSession();

  // Best-effort: resolve the chosen track title to its catalog row so the admin
  // panel can filter/scope by it. The text field above is always written
  // regardless — a miss (e.g. a track renamed/deleted between page load and
  // submit) just leaves this null, never a hard error.
  const matchedTrack = await prisma.internshipTrack.findFirst({
    where: { title: data.internshipTrack },
    select: { id: true },
  });

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
      internshipTrackId: matchedTrack?.id,
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
      phone: true,
      usn: true,
      internshipTrack: true,
      internshipTrackId: true,
      preferredDuration: true,
      preferredStartDate: true,
      resumeLink: true,
      createdAt: true,
      startDate: true,
      durationMonths: true,
      frozen: true,
    },
  });
}

/** Permanently removes an application. Idempotent, same reasoning as revokeCertificate. */
export async function deleteInternshipApplication(applicationId: string) {
  await requireAdmin();
  await prisma.internshipApplication.deleteMany({ where: { id: applicationId } });
}

/** Freezes or unfreezes an internship — a status flag only. It doesn't touch any
 * course access already granted through issueCertificate; see that function's own
 * comment for why access and the application record are kept independent. */
export async function setInternshipFrozen(applicationId: string, frozen: boolean) {
  await requireAdmin();
  await prisma.internshipApplication.update({
    where: { id: applicationId },
    data: { frozen },
  });
}

/** Sets (or clears, passing nulls) the admin-tracked start date and duration an
 * internship actually runs for — distinct from the student's own preferredDuration/
 * preferredStartDate, which stay as a record of what they originally asked for. */
export async function setInternshipDuration(
  applicationId: string,
  data: { startDate: Date | null; durationMonths: number | null }
) {
  await requireAdmin();
  if (data.durationMonths !== null && ![1, 2, 6].includes(data.durationMonths)) {
    throw new Error("Duration must be 1, 2, or 6 months.");
  }
  await prisma.internshipApplication.update({
    where: { id: applicationId },
    data: { startDate: data.startDate, durationMonths: data.durationMonths },
  });
}

// ── Certificates ───────────────────────────────────────────────────────────────

/**
 * Issues (or re-fetches, if one already exists for this student+track) an internship
 * certificate, and grants that track's linked courses (InternshipTrackCourse) in the same
 * action — the client's "course enrollment + Certificate, customised per track" request.
 * Both halves are idempotent: the course grant upserts UserPurchases (safe to repeat), and
 * the @@unique([userId, trackName]) constraint means a second click for the same
 * student/track returns the existing certificate rather than erroring or duplicating.
 *
 * The "access granted" email only fires when a certificate is genuinely newly created —
 * not on a repeat click for an already-issued track — so re-clicking Issue never
 * re-sends it.
 */
export async function issueCertificate(userId: string, internshipTrackId: string) {
  await requireAdmin();
  const track = await prisma.internshipTrack.findUnique({
    where: { id: internshipTrackId },
    include: { courses: { include: { course: { select: { id: true, title: true } } } } },
  });
  if (!track) throw new Error("Choose a track to issue a certificate for.");
  const trackName = track.title;

  const courses = track.courses.map((tc) => tc.course);
  let grantedCourseTitles: string[] = [];
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

  const existing = await prisma.internshipCertificate.findUnique({
    where: { userId_trackName: { userId, trackName } },
  });
  if (existing) return existing;

  const certificate = await prisma.internshipCertificate.create({
    data: { userId, trackName, internshipTrackId: track.id },
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

// Revokes a certificate — deletes the row, which is enough to invalidate its
// verification page (getCertificateByCode returns null, same as a code that never
// existed). Deliberately scoped to the certificate only: it does not touch the
// UserPurchases rows issueCertificate granted, since those may be the student's only
// access to courses they're actively using — revoking a certificate shouldn't
// silently take a course away. Idempotent: revoking an already-gone certificate is a
// no-op, not an error, so a stale admin UI can't fail double-clicking this.
export async function revokeCertificate(certificateId: string) {
  await requireAdmin();
  await prisma.internshipCertificate.deleteMany({ where: { id: certificateId } });
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

// ── Internship track catalog ─────────────────────────────────────────────────
// Admin-managed tracks, superseding the old hardcoded INTERNSHIP_TRACKS array.

const ACTIVE_TRACKS_KEY = "internship-tracks:active";

/** Admin: every track, including hidden ones — for the CRUD panel and the
 * cert-issue / manual-grant selects (an admin can still issue a cert for a
 * track they've since hidden from the public application form). */
export async function getInternshipTracks() {
  await requireAdmin();
  return prisma.internshipTrack.findMany({
    include: {
      courses: { include: { course: { select: { id: true, title: true, slug: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

function _fetchActiveInternshipTracks() {
  return prisma.internshipTrack.findMany({
    where: { hidden: false },
    select: { id: true, title: true, duration: true, description: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Public: visible tracks only — for InternshipForm's dropdown and the
 * internships page's "featured tracks" grid. */
export async function getActiveInternshipTracks() {
  const cached =
    await cacheGet<Awaited<ReturnType<typeof _fetchActiveInternshipTracks>>>(ACTIVE_TRACKS_KEY);
  if (cached) return cached;
  const data = await _fetchActiveInternshipTracks();
  await cacheSet(ACTIVE_TRACKS_KEY, data);
  return data;
}

export async function createInternshipTrack(data: {
  title: string;
  duration: string;
  description: string;
}) {
  await requireAdmin();
  const title = data.title.trim();
  if (!title) throw new Error("Track title is required.");
  const track = await prisma.internshipTrack.create({
    data: { title, duration: data.duration.trim(), description: data.description.trim() },
  });
  await cacheDel(ACTIVE_TRACKS_KEY);
  revalidatePath("/internships");
  revalidatePath("/admin");
  return track;
}

export async function updateInternshipTrack(
  id: string,
  data: { title: string; duration: string; description: string }
) {
  await requireAdmin();
  const title = data.title.trim();
  if (!title) throw new Error("Track title is required.");
  await prisma.internshipTrack.update({
    where: { id },
    data: { title, duration: data.duration.trim(), description: data.description.trim() },
  });
  await cacheDel(ACTIVE_TRACKS_KEY);
  revalidatePath("/internships");
  revalidatePath("/admin");
}

export async function toggleInternshipTrackHidden(id: string) {
  await requireAdmin();
  const track = await prisma.internshipTrack.findUnique({
    where: { id },
    select: { hidden: true },
  });
  if (!track) throw new Error("Track not found.");
  await prisma.internshipTrack.update({ where: { id }, data: { hidden: !track.hidden } });
  await cacheDel(ACTIVE_TRACKS_KEY);
  revalidatePath("/internships");
  revalidatePath("/admin");
}

// Replaces a track's whole linked-course set in one transaction — same
// reasoning as setTrackBundle (track-actions.ts), minus a price, since these
// grants ride on certificate issuance, not a purchase.
export async function setInternshipTrackCourses(trackId: string, courseIds: string[]) {
  await requireAdmin();
  const ids = [...new Set(courseIds)];
  await prisma.$transaction([
    prisma.internshipTrackCourse.deleteMany({ where: { trackId } }),
    ...ids.map((courseId) => prisma.internshipTrackCourse.create({ data: { trackId, courseId } })),
  ]);
  revalidatePath("/admin");
}

// Mirrors deleteNoteTrack's paid-order guard: blocked once certificates have
// been issued against this track, so deleting it can't silently orphan the
// record of what a student was actually granted courses for.
export async function deleteInternshipTrack(id: string) {
  await requireAdmin();
  const certCount = await prisma.internshipCertificate.count({ where: { internshipTrackId: id } });
  if (certCount > 0) {
    throw new Error(
      "This track has issued certificates and can't be deleted. Hide it instead to remove it from the application form."
    );
  }
  await prisma.$transaction([
    prisma.internshipTrackCourse.deleteMany({ where: { trackId: id } }),
    prisma.internshipTrack.delete({ where: { id } }),
  ]);
  await cacheDel(ACTIVE_TRACKS_KEY);
  revalidatePath("/internships");
  revalidatePath("/admin");
}
