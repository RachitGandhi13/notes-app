"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search, UserX } from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui";
import { getEnrolledStudents, revokeCourseAccess } from "@/lib/actions";

interface CourseOption {
  id: string;
  title: string;
}

interface EnrolledStudent {
  userId: string;
  name: string;
  email: string;
  enrolledAt: string | Date;
  status: string;
}

const REMOVE_CONFIRM_WORD = "REMOVE";

export function EnrolledStudentsTable({ courses }: { courses: CourseOption[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Removal: a two-step confirmation (see renderRemovalDialog below) — step 1 is a plain
  // yes/no, step 2 requires typing REMOVE, since deleting a UserPurchases row is immediate
  // and has no undo in the UI (unlike every other delete in admin, which keeps the
  // underlying rows and only hides/unlinks them).
  const [removing, setRemoving] = useState<EnrolledStudent | null>(null);
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removeError, setRemoveError] = useState("");

  function closeRemoveDialog() {
    if (submitting) return;
    setRemoving(null);
    setConfirmStep(1);
    setConfirmText("");
    setRemoveError("");
  }

  async function handleConfirmRemove() {
    if (!removing) return;
    setSubmitting(true);
    setRemoveError("");
    try {
      await revokeCourseAccess(removing.userId, courseId);
      setStudents((prev) => prev.filter((s) => s.userId !== removing.userId));
      closeRemoveDialog();
    } catch (err: any) {
      setRemoveError(err?.message ?? "Couldn't remove this student.");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!courseId) {
      setStudents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getEnrolledStudents(courseId)
      .then((data) => {
        if (!cancelled) setStudents(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // Client-side only — the list for one course is small enough that a round trip
  // per keystroke would just be slower than filtering what's already in memory.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={courses.length === 0}
          className="border-input bg-background h-9 shrink-0 rounded-md border px-2 text-sm disabled:opacity-50"
        >
          {courses.length === 0 && <option value="">No courses yet</option>}
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <div className="relative min-w-[180px] flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="border-input bg-background h-9 w-full rounded-md border pl-8 pr-3 text-sm"
          />
        </div>

        <a
          href="/api/admin/export-students"
          className="hover:bg-accent flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Students (Excel)
        </a>
      </div>

      {/* Desktop/laptop: the dense table. The overflow wrapper lets a table that's
          still too wide for a tablet-ish viewport scroll horizontally without
          taking the whole page with it (the -mx-4 px-4 bleeds the scroll area to
          the card's edge so the scrollbar doesn't sit indented). */}
      <div className="bg-card hidden overflow-x-auto rounded-xl border sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase">
            <tr>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Student Name</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Email Address</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Enrolled Date</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              // Dimension-matched skeleton rows instead of a "Loading…" line, so the table
              // doesn't collapse to one short row and then jump to full height once data
              // arrives — same row height and column layout as a real row.
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5">
                    <div className="bg-muted h-4 w-28 animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="bg-muted h-4 w-40 animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="bg-muted h-5 w-24 animate-pulse rounded-full" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="bg-muted h-6 w-32 animate-pulse rounded-md" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-6 text-center">
                  {students.length === 0
                    ? "No students enrolled in this course yet."
                    : "No students match that search."}
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.userId}>
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="text-muted-foreground px-4 py-2.5">{s.email}</td>
                  <td className="text-muted-foreground whitespace-nowrap px-4 py-2.5">
                    {new Date(s.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status.startsWith("Paid")
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => {
                        setRemoving(s);
                        setConfirmStep(1);
                        setConfirmText("");
                        setRemoveError("");
                      }}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Remove Student
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phone: the same data as stacked cards instead of a table squeezed into
          a horizontal scroll — each card's remove button is a full 44px touch
          target instead of the table's small mouse-oriented one. */}
      <div className="space-y-3 sm:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card space-y-2 rounded-xl border p-4">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
              <div className="bg-muted h-3.5 w-40 animate-pulse rounded" />
              <div className="bg-muted h-5 w-24 animate-pulse rounded-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border px-4 py-6 text-center text-sm">
            {students.length === 0
              ? "No students enrolled in this course yet."
              : "No students match that search."}
          </p>
        ) : (
          filtered.map((s) => (
            <div key={s.userId} className="bg-card space-y-3 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-muted-foreground truncate text-sm">{s.email}</p>
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status.startsWith("Paid")
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Enrolled {new Date(s.enrolledAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => {
                  setRemoving(s);
                  setConfirmStep(1);
                  setConfirmText("");
                  setRemoveError("");
                }}
                className="border-destructive text-destructive active:bg-destructive active:text-destructive-foreground flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors"
              >
                <UserX className="h-4 w-4" />
                Remove Student
              </button>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!removing} onOpenChange={(open) => !open && closeRemoveDialog()}>
        <DialogContent className="max-w-sm">
          {confirmStep === 1 ? (
            <>
              <h3 className="text-lg font-semibold">Remove {removing?.name}?</h3>
              <p className="text-muted-foreground text-sm">
                Are you sure you want to remove {removing?.name} from this course? This will revoke
                their access immediately.
              </p>
              {removeError && <p className="text-destructive text-sm">{removeError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRemoveDialog}
                  className="hover:bg-accent rounded-md border px-4 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmStep(2)}
                  className="bg-destructive text-destructive-foreground rounded-md px-4 py-1.5 text-sm font-medium"
                >
                  Yes, proceed
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-destructive text-lg font-semibold">Final warning</h3>
              <p className="text-muted-foreground text-sm">
                This action cannot be undone. Type{" "}
                <strong className="text-foreground">{REMOVE_CONFIRM_WORD}</strong> to permanently
                delete {removing?.name}&apos;s enrollment and access.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={REMOVE_CONFIRM_WORD}
                aria-label={`Type ${REMOVE_CONFIRM_WORD} to confirm`}
                disabled={submitting}
                autoFocus
                className="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
              />
              {removeError && <p className="text-destructive text-sm">{removeError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRemoveDialog}
                  disabled={submitting}
                  className="hover:bg-accent rounded-md border px-4 py-1.5 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={submitting || confirmText !== REMOVE_CONFIRM_WORD}
                  className="bg-destructive text-destructive-foreground rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-150 enabled:hover:scale-[1.01] enabled:active:scale-[0.99] disabled:opacity-50"
                >
                  {submitting ? "Removing…" : "Permanently remove"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
