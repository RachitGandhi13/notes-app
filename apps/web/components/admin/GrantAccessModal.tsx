"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui";
import { findStudentByIdentifier, grantCourseAccess, revokeCourseAccess } from "@/lib/actions";
import { grantComboAccess } from "@/lib/track-actions";
import { issueCertificate } from "@/lib/internship-actions";

interface CourseOption {
  id: string;
  title: string;
}

interface BundleOption {
  id: string;
  title: string;
  bundlePrice: number;
  courses: { id: string; title: string }[];
}

interface InternshipTrackOption {
  id: string;
  title: string;
  courses: { id: string; title: string }[];
}

interface FoundStudent {
  id: string;
  name: string | null;
  email: string | null;
  studentId: string | null;
  purchasedCourseIds: string[];
  certificates: { id: string; trackName: string; certificateCode: string; issueDate: Date }[];
}

// A second, deliberately separate surface from StudentAccessPanel (Internships
// tab, cert-issuing-focused) — this one lives on the Students tab per the
// client's explicit "Grant Manual Access modal on Admin -> Students" ask, and
// additionally lets the admin grant a whole combo or internship track in one
// click instead of checking courses off individually.
export function GrantAccessModal({
  courses,
  bundles,
  internshipTracks,
}: {
  courses: CourseOption[];
  bundles: BundleOption[];
  internshipTracks: InternshipTrackOption[];
}) {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [looking, setLooking] = useState(false);
  const [student, setStudent] = useState<FoundStudent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function closeModal() {
    setOpen(false);
    setIdentifier("");
    setStudent(null);
    setNotFound(false);
    setError("");
  }

  async function refresh() {
    if (!student?.email) return;
    const refreshed = await findStudentByIdentifier(student.email);
    if (refreshed) setStudent(refreshed);
  }

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

  async function handleToggleCourse(courseId: string, hasAccess: boolean) {
    if (!student) return;
    setBusyKey(`course:${courseId}`);
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
    } catch (err: any) {
      setError(err?.message ?? "Couldn't update course access.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleGrantCombo(bundleId: string) {
    if (!student) return;
    setBusyKey(`combo:${bundleId}`);
    setError("");
    try {
      await grantComboAccess(student.id, bundleId);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't grant this combo.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleIssueCertificate(trackId: string) {
    if (!student) return;
    setBusyKey(`internship:${trackId}`);
    setError("");
    try {
      await issueCertificate(student.id, trackId);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't issue this certificate.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
      >
        <UserPlus className="h-4 w-4" />
        Grant Manual Access
      </button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeModal())}>
        <DialogContent className="max-w-lg">
          <h3 className="text-lg font-semibold">Grant manual access</h3>
          <p className="text-muted-foreground text-sm">
            Look a student up by email or Student ID, bypassing Razorpay entirely. Writes straight
            to the same tables a real purchase or certificate would.
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
            <div className="max-h-[60vh] space-y-4 overflow-y-auto">
              <div className="text-sm">
                <p className="font-medium">{student.name ?? "Unnamed"}</p>
                <p className="text-muted-foreground text-xs">{student.email}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Individual courses</p>
                {courses.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No courses exist yet.</p>
                ) : (
                  <ul className="divide-y rounded border text-sm">
                    {courses.map((course) => {
                      const hasAccess = student.purchasedCourseIds.includes(course.id);
                      return (
                        <li
                          key={course.id}
                          className="flex items-center justify-between gap-3 px-3 py-2"
                        >
                          <span className="truncate">{course.title}</span>
                          <button
                            onClick={() => handleToggleCourse(course.id, hasAccess)}
                            disabled={busyKey === `course:${course.id}`}
                            className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                              hasAccess
                                ? "text-destructive hover:bg-destructive/10"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {busyKey === `course:${course.id}`
                              ? "…"
                              : hasAccess
                                ? "Revoke"
                                : "Grant"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {bundles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold">Combo bundles</p>
                  <ul className="divide-y rounded border text-sm">
                    {bundles.map((bundle) => {
                      const ownsAll = bundle.courses.every((c) =>
                        student.purchasedCourseIds.includes(c.id)
                      );
                      return (
                        <li
                          key={bundle.id}
                          className="flex items-center justify-between gap-3 px-3 py-2"
                        >
                          <span className="min-w-0 truncate">
                            {bundle.title}{" "}
                            <span className="text-muted-foreground">(₹{bundle.bundlePrice})</span>
                          </span>
                          <button
                            onClick={() => handleGrantCombo(bundle.id)}
                            disabled={busyKey === `combo:${bundle.id}` || ownsAll}
                            className="bg-primary text-primary-foreground shrink-0 rounded-md px-3 py-1 text-xs font-medium disabled:opacity-50"
                          >
                            {busyKey === `combo:${bundle.id}`
                              ? "…"
                              : ownsAll
                                ? "Already granted"
                                : "Grant combo"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {internshipTracks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold">Internship certificates</p>
                  <ul className="divide-y rounded border text-sm">
                    {internshipTracks.map((track) => {
                      const alreadyIssued = student.certificates.some(
                        (c) => c.trackName === track.title
                      );
                      return (
                        <li
                          key={track.id}
                          className="flex items-center justify-between gap-3 px-3 py-2"
                        >
                          <span className="min-w-0 truncate">{track.title}</span>
                          <button
                            onClick={() => handleIssueCertificate(track.id)}
                            disabled={busyKey === `internship:${track.id}` || alreadyIssued}
                            className="bg-primary text-primary-foreground shrink-0 rounded-md px-3 py-1 text-xs font-medium disabled:opacity-50"
                          >
                            {busyKey === `internship:${track.id}`
                              ? "…"
                              : alreadyIssued
                                ? "Already issued"
                                : "Issue certificate"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
