"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play, Search, Trash2 } from "lucide-react";
import {
  deleteInternshipApplication,
  setInternshipDuration,
  setInternshipFrozen,
} from "@/lib/internship-actions";
import { FormSelect } from "@/components/FormSelect";

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  usn: string;
  internshipTrack: string;
  preferredDuration: string;
  preferredStartDate: string;
  resumeLink: string;
  createdAt: Date;
  startDate: Date | null;
  durationMonths: number | null;
  frozen: boolean;
}

const PAGE_SIZE = 10;

const DURATION_OPTIONS = [1, 2, 6];

function endDateOf(startDate: Date, durationMonths: number): Date {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + durationMonths);
  return d;
}

// Green while there's comfortably more than two weeks left, yellow inside that
// window, red once the end date has passed.
function DurationBadge({ startDate, durationMonths }: { startDate: Date; durationMonths: number }) {
  const end = endDateOf(startDate, durationMonths);
  const daysLeft = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const expired = daysLeft <= 0;
  const soon = !expired && daysLeft <= 14;

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        expired
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : soon
            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            : "bg-green-500/10 text-green-600 dark:text-green-400"
      }`}
    >
      {expired ? "Expired" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
    </span>
  );
}

function DurationEditor({ app }: { app: Application }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(
    app.startDate ? new Date(app.startDate).toISOString().slice(0, 10) : ""
  );
  const [durationMonths, setDurationMonths] = useState(app.durationMonths ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await setInternshipDuration(app.id, {
        startDate: startDate ? new Date(startDate) : null,
        durationMonths: startDate ? durationMonths : null,
      });
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save this.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {app.startDate && app.durationMonths ? (
          <>
            <span className="text-muted-foreground text-xs">
              {new Date(app.startDate).toLocaleDateString()} – {app.durationMonths}mo →{" "}
              {endDateOf(app.startDate, app.durationMonths).toLocaleDateString()}
            </span>
            <DurationBadge startDate={app.startDate} durationMonths={app.durationMonths} />
          </>
        ) : (
          <span className="text-muted-foreground text-xs">Not scheduled</span>
        )}
        <button
          onClick={() => setEditing(true)}
          className="text-primary ring-offset-background focus-visible:ring-ring rounded text-xs font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <p className="text-destructive w-full text-xs">{error}</p>}
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border-input bg-background focus:ring-ring h-8 rounded-md border px-2 text-xs focus:outline-none focus:ring-2"
      />
      <FormSelect
        value={durationMonths}
        onChange={(e) => setDurationMonths(Number(e.target.value))}
        className="h-8 text-xs"
      >
        {DURATION_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {m} {m === 1 ? "month" : "months"}
          </option>
        ))}
      </FormSelect>
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring rounded-md px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        onClick={() => setEditing(false)}
        disabled={saving}
        className="text-muted-foreground ring-offset-background focus-visible:ring-ring rounded text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}

function ApplicationRow({ app }: { app: Application }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");

  async function handleToggleFrozen() {
    setBusy(true);
    setError("");
    try {
      await setInternshipFrozen(app.id, !app.frozen);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't update this.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError("");
    try {
      await deleteInternshipApplication(app.id);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't delete this.");
      setBusy(false);
    }
  }

  return (
    <li className="hover:bg-muted/40 space-y-2 px-4 py-3 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="font-medium">{app.fullName}</p>
          {!app.startDate && (
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
              Pending
            </span>
          )}
          {app.frozen && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              Frozen
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-xs">
          Applied {new Date(app.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        {app.email} · {app.phone} · {app.usn}
      </p>
      <p className="text-xs">
        {app.internshipTrack} · requested {app.preferredDuration}, starting {app.preferredStartDate}
      </p>
      {app.resumeLink && (
        <a
          href={app.resumeLink.startsWith("http") ? app.resumeLink : `https://${app.resumeLink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary ring-offset-background focus-visible:ring-ring inline-flex items-center gap-1 rounded text-xs font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          View resume
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      <DurationEditor app={app} />

      {error && <p className="text-destructive text-xs">{error}</p>}

      <div className="flex items-center gap-3 border-t pt-2">
        <button
          onClick={handleToggleFrozen}
          disabled={busy}
          className="text-muted-foreground hover:text-foreground ring-offset-background focus-visible:ring-ring flex items-center gap-1.5 rounded text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {app.frozen ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {app.frozen ? "Unfreeze" : "Freeze"}
        </button>

        {confirmingDelete ? (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Delete this application?</span>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="text-destructive ring-offset-background focus-visible:ring-ring rounded font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
              className="ring-offset-background focus-visible:ring-ring rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
            className="text-destructive ring-offset-background focus-visible:ring-ring ml-auto flex items-center gap-1.5 rounded text-xs font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

export function InternshipApplicationsList({ applications }: { applications: Application[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (app) =>
        app.fullName.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.phone.toLowerCase().includes(q)
    );
  }, [applications, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamped rather than reset via effect — if a mutation (e.g. deleting the last
  // applicant on the last page) leaves `page` out of range, this just quietly shows
  // the new last page instead of an empty one.
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (applications.length === 0) {
    return <p className="text-muted-foreground text-sm">No applications yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          placeholder="Search by name, email, or phone…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border pl-9 pr-3 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No applications match &quot;{query}&quot;.</p>
      ) : (
        <ul className="border-border/60 divide-border/60 divide-y rounded-lg border text-sm">
          {paged.map((app) => (
            <ApplicationRow key={app.id} app={app} />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Page {safePage} of {totalPages} · {filtered.length}{" "}
            {filtered.length === 1 ? "applicant" : "applicants"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="hover:bg-accent ring-offset-background focus-visible:ring-ring flex items-center gap-1 rounded-md border px-2.5 py-1.5 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="hover:bg-accent ring-offset-background focus-visible:ring-ring flex items-center gap-1 rounded-md border px-2.5 py-1.5 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
