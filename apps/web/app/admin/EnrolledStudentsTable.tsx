"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { getEnrolledStudents } from "@/lib/actions";

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

export function EnrolledStudentsTable({ courses }: { courses: CourseOption[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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

      <div className="bg-card overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase">
            <tr>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Student Name</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Email Address</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Enrolled Date</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-6 text-center">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
