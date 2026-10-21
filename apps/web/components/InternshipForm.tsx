"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@repo/ui";
import {
  APPS_SCRIPT_URL,
  DURATION_OPTIONS,
  EMPTY_APPLICATION,
  YEAR_OF_STUDY_OPTIONS,
  type InternshipApplication,
} from "@/lib/internships";
import { submitInternshipApplication } from "@/lib/internship-actions";

interface InternshipTrackOption {
  id: string;
  title: string;
}

const fieldClass =
  "border-input bg-background focus:ring-ring flex h-11 w-full rounded-lg border px-3.5 text-sm focus:outline-none focus:ring-2";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export function InternshipForm({
  tracks,
  selectedTrack,
  onTrackChange,
}: {
  tracks: InternshipTrackOption[];
  /** Pre-fills the track dropdown when set from outside — e.g. a track card clicked on
   * the page above. Re-applies whenever this changes, so clicking a different card
   * always wins over whatever the dropdown currently shows. */
  selectedTrack?: string | null;
  /** Mirrors the dropdown's own changes back up, so an outside track card (if any) can
   * stay in sync when the student picks a track directly from the dropdown instead. */
  onTrackChange?: (title: string) => void;
}) {
  const { data: session } = useSession();
  const [data, setData] = useState<InternshipApplication>(EMPTY_APPLICATION);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Pre-fills the USN field with the signed-in student's ID, once, the first time it
  // becomes available — never overwrites a value the student already typed.
  useEffect(() => {
    if (session?.user?.studentId) {
      setData((prev) => (prev.usn ? prev : { ...prev, usn: session.user.studentId! }));
    }
  }, [session]);

  // Mirrors an externally-selected track (a card click) into the dropdown.
  useEffect(() => {
    if (selectedTrack) {
      setData((prev) =>
        prev.internshipTrack === selectedTrack ? prev : { ...prev, internshipTrack: selectedTrack }
      );
    }
  }, [selectedTrack]);

  function set<K extends keyof InternshipApplication>(key: K, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // This app's own copy — a real success/failure signal, unlike the Sheet mirror
      // below. If this throws, the student sees the error and nothing was silently lost.
      await submitInternshipApplication(data);

      // Best-effort mirror to the client's Google Sheet. mode: "no-cors" makes the
      // response opaque, so a script-side failure here is invisible to the browser —
      // that's why the DB write above, not this, is the real record now.
      //
      // Form-urlencoded, not JSON: Apps Script's doPost(e) reads submitted fields
      // from e.parameter, which only populates for a form-encoded (or multipart)
      // body — a raw JSON body leaves e.parameter empty on the script side.
      try {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, val]) => params.append(key, val || ""));
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
      } catch {
        // Non-fatal — the application is already saved above.
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <h3 className="text-xl font-bold">Application Submitted Successfully!</h3>
        <p className="text-muted-foreground max-w-sm text-sm">
          Thanks for applying to the CloudVidya Academy Internship Program. We&apos;ll reach out by
          email with next steps.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card space-y-5 rounded-2xl border p-6 sm:p-8">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="fullName">
          <input
            id="fullName"
            required
            value={data.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label="Phone Number" htmlFor="phone">
          <input
            id="phone"
            type="tel"
            required
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label="Student ID / USN" htmlFor="usn">
          <input
            id="usn"
            required
            value={data.usn}
            onChange={(e) => set("usn", e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label="College" htmlFor="college">
          <input
            id="college"
            required
            value={data.college}
            onChange={(e) => set("college", e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label="Branch / Degree" htmlFor="branch">
          <input
            id="branch"
            required
            value={data.branch}
            onChange={(e) => set("branch", e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label="Year of Study" htmlFor="yearOfStudy">
          <select
            id="yearOfStudy"
            required
            value={data.yearOfStudy}
            onChange={(e) => set("yearOfStudy", e.target.value)}
            className={fieldClass}
          >
            <option value="" disabled>
              Select year
            </option>
            {YEAR_OF_STUDY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Internship Track" htmlFor="internshipTrack">
          <select
            id="internshipTrack"
            required
            value={data.internshipTrack}
            onChange={(e) => {
              set("internshipTrack", e.target.value);
              onTrackChange?.(e.target.value);
            }}
            className={fieldClass}
          >
            <option value="" disabled>
              Select track
            </option>
            {tracks.map((track) => (
              <option key={track.id} value={track.title}>
                {track.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Preferred Duration" htmlFor="preferredDuration">
          <select
            id="preferredDuration"
            required
            value={data.preferredDuration}
            onChange={(e) => set("preferredDuration", e.target.value)}
            className={fieldClass}
          >
            <option value="" disabled>
              Select duration
            </option>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Preferred Start Date" htmlFor="preferredStartDate">
          <input
            id="preferredStartDate"
            type="date"
            required
            value={data.preferredStartDate}
            onChange={(e) => set("preferredStartDate", e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label="LinkedIn Profile (optional)" htmlFor="linkedIn">
          <input
            id="linkedIn"
            type="url"
            placeholder="https://linkedin.com/in/..."
            value={data.linkedIn}
            onChange={(e) => set("linkedIn", e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label="Resume Link" htmlFor="resumeLink">
          <input
            id="resumeLink"
            type="text"
            placeholder="https://drive.google.com/..."
            required
            value={data.resumeLink}
            onChange={(e) => set("resumeLink", e.target.value)}
            className={fieldClass}
          />
          <p className="text-muted-foreground text-xs">
            Provide a shareable Google Drive, Dropbox, or portfolio link.
          </p>
        </Field>
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit Application"
        )}
      </Button>
    </form>
  );
}
