"use client";

import { useState } from "react";
import { findStudentByIdentifier, grantCourseAccess, revokeCourseAccess } from "@/lib/actions";
import { issueCertificate, revokeCertificate } from "@/lib/internship-actions";
import { INTERNSHIP_TRACK_OPTIONS, TRACK_COURSE_SLUGS } from "@/lib/internships";

interface AdminCourseOption {
  id: string;
  title: string;
  slug: string;
}

interface FoundStudentCertificate {
  id: string;
  trackName: string;
  certificateCode: string;
  issueDate: Date;
}

interface FoundStudent {
  id: string;
  name: string | null;
  email: string | null;
  studentId: string | null;
  purchasedCourseIds: string[];
  certificates: FoundStudentCertificate[];
}

// "Option B" access management: look a student up by email or Student ID, then grant or
// revoke individual courses. Writes straight to UserPurchases — the same table Razorpay
// purchases land in — so a manually granted course is indistinguishable from a bought one.
export function StudentAccessPanel({ courses }: { courses: AdminCourseOption[] }) {
  const [identifier, setIdentifier] = useState("");
  const [looking, setLooking] = useState(false);
  const [student, setStudent] = useState<FoundStudent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [certTrack, setCertTrack] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [certError, setCertError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmingRevokeId, setConfirmingRevokeId] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLooking(true);
    setError("");
    setNotFound(false);
    setStudent(null);
    try {
      const result = await findStudentByIdentifier(identifier);
      if (!result) setNotFound(true);
      else setStudent(result);
    } catch (err: any) {
      setError(err?.message ?? "Lookup failed.");
    } finally {
      setLooking(false);
    }
  }

  async function handleToggle(courseId: string, hasAccess: boolean) {
    if (!student) return;
    setBusyCourseId(courseId);
    try {
      if (hasAccess) {
        await revokeCourseAccess(student.id, courseId);
        setStudent({
          ...student,
          purchasedCourseIds: student.purchasedCourseIds.filter((id) => id !== courseId),
        });
      } else {
        await grantCourseAccess(student.id, courseId);
        setStudent({ ...student, purchasedCourseIds: [...student.purchasedCourseIds, courseId] });
      }
    } finally {
      setBusyCourseId(null);
    }
  }

  async function handleIssueCertificate() {
    if (!student || !certTrack) return;
    setIssuing(true);
    setCertError("");
    try {
      await issueCertificate(student.id, certTrack);
      // Re-fetch full state rather than reconstructing it here: issuing can also grant
      // this track's mapped courses, so this is what keeps the course checklist above
      // accurate (showing "Revoke" instead of "Grant") without duplicating that logic.
      const refreshed = student.email ? await findStudentByIdentifier(student.email) : null;
      if (refreshed) setStudent(refreshed);
      setCertTrack("");
    } catch (err: any) {
      setCertError(err?.message ?? "Couldn't issue the certificate.");
    } finally {
      setIssuing(false);
    }
  }

  async function handleRevokeCertificate(certificateId: string) {
    if (!student) return;
    setRevokingId(certificateId);
    setCertError("");
    try {
      await revokeCertificate(certificateId);
      setStudent({
        ...student,
        certificates: student.certificates.filter((c) => c.id !== certificateId),
      });
      setConfirmingRevokeId(null);
    } catch (err: any) {
      setCertError(err?.message ?? "Couldn't revoke the certificate.");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Student access</h2>
      <p className="text-muted-foreground text-sm">
        Look a student up by email or Student ID, then grant or revoke access to any course.
      </p>

      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          required
          placeholder="Email or Student ID (e.g. CVA-2026-1234)"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
        />
        <button
          type="submit"
          disabled={looking}
          className="bg-primary text-primary-foreground shrink-0 rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {looking ? "Looking up…" : "Look up"}
        </button>
      </form>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {notFound && (
        <p className="text-muted-foreground text-sm">
          No student matches that email or Student ID.
        </p>
      )}

      {student && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="text-sm">
            <p className="font-medium">{student.name ?? "Unnamed"}</p>
            <p className="text-muted-foreground text-xs">{student.email}</p>
            {student.studentId && (
              <p className="text-muted-foreground text-xs">ID: {student.studentId}</p>
            )}
          </div>

          {courses.length === 0 ? (
            <p className="text-muted-foreground text-xs">No courses exist yet.</p>
          ) : (
            <ul className="divide-y rounded border text-sm">
              {courses.map((course) => {
                const hasAccess = student.purchasedCourseIds.includes(course.id);
                return (
                  <li key={course.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="truncate">{course.title}</span>
                    <button
                      onClick={() => handleToggle(course.id, hasAccess)}
                      disabled={busyCourseId === course.id}
                      className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                        hasAccess
                          ? "text-destructive hover:bg-destructive/10"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {busyCourseId === course.id ? "…" : hasAccess ? "Revoke" : "Grant"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold">Internship certificates</p>
            {student.certificates.length > 0 && (
              <ul className="space-y-1.5 text-xs">
                {student.certificates.map((cert) => (
                  <li key={cert.id} className="text-muted-foreground flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate">
                      {cert.trackName} —{" "}
                      <a
                        href={`/verify/${cert.certificateCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        view
                      </a>
                    </span>
                    {confirmingRevokeId === cert.id ? (
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span>Revoke?</span>
                        <button
                          onClick={() => handleRevokeCertificate(cert.id)}
                          disabled={revokingId === cert.id}
                          className="text-destructive font-medium hover:underline disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmingRevokeId(null)}
                          disabled={revokingId === cert.id}
                          className="hover:underline disabled:opacity-50"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmingRevokeId(cert.id)}
                        className="text-destructive shrink-0 hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {certTrack && (
              <p className="text-muted-foreground text-xs">
                {(() => {
                  const slugs = TRACK_COURSE_SLUGS[certTrack] ?? [];
                  const titles = courses.filter((c) => slugs.includes(c.slug)).map((c) => c.title);
                  return titles.length > 0
                    ? `Also grants: ${titles.join(", ")}`
                    : "Grants no courses automatically for this track.";
                })()}
              </p>
            )}
            {certError && <p className="text-destructive text-xs">{certError}</p>}
            <div className="flex gap-2">
              <select
                value={certTrack}
                onChange={(e) => setCertTrack(e.target.value)}
                className="border-input bg-background flex h-9 w-full rounded-md border px-2 text-xs"
              >
                <option value="">Choose a track…</option>
                {INTERNSHIP_TRACK_OPTIONS.filter(
                  (track) => !student.certificates.some((c) => c.trackName === track)
                ).map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
              <button
                onClick={handleIssueCertificate}
                disabled={!certTrack || issuing}
                className="bg-primary text-primary-foreground shrink-0 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                {issuing ? "Issuing…" : "Issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
