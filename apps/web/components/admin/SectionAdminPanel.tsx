"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import {
  addQuestion,
  deleteQuestion,
  deleteSection,
  moveSection,
  setSectionPPT,
  updateQuestion,
  updateSection,
} from "@/lib/track-actions";
import { QuestionForm, draftFromQuestion, type QuestionValue } from "./QuestionForm";

interface SectionProblem {
  id: string;
  title: string;
  description: string;
  pptUrl: string | null;
}

interface SectionQuestion extends QuestionValue {
  id: string;
}

const inputClass =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

// ── Title + description ────────────────────────────────────────────────────

function DetailsEditor({ problem }: { problem: SectionProblem }) {
  const router = useRouter();
  const [title, setTitle] = useState(problem.title);
  const [description, setDescription] = useState(problem.description);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateSection(problem.id, { title, description });
      setMessage({ ok: true, text: "Saved." });
      router.refresh();
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message ?? "Couldn't save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold">Section details</h3>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Section title"
        placeholder="Section title"
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        aria-label="Section description"
        placeholder="Short description shown above the slides (optional)"
        rows={2}
        className="border-input bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save details"}
        </button>
        {message && (
          <span className={`text-xs ${message.ok ? "text-green-600" : "text-destructive"}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}

// ── The uploaded slides ────────────────────────────────────────────────────

function PresentationEditor({ problem }: { problem: SectionProblem }) {
  const router = useRouter();
  const [path, setPath] = useState(problem.pptUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await setSectionPPT(problem.id, path.trim() || null);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save this.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Slide / material — Bunny Storage file path</h3>
      <p className="text-muted-foreground text-sm">
        PDF, JPG, JPEG or PNG from the <code>cloudvidya-notes</code> storage zone (e.g.{" "}
        <code>devops-notes.pdf</code>). Leave blank to remove it.
      </p>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="devops-notes.pdf"
          aria-label="Bunny Storage file path"
          className="border-input bg-background flex h-9 w-full max-w-xs rounded-md border px-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Practice questions ─────────────────────────────────────────────────────

function QuestionsEditor({
  problemId,
  questions,
}: {
  problemId: string;
  questions: SectionQuestion[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(id: string) {
    setError("");
    try {
      await deleteQuestion(id);
      setConfirmingId(null);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't delete the question.");
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">
        Practice questions{" "}
        <span className="text-muted-foreground font-normal">({questions.length})</span>
      </h3>
      {error && <p className="text-destructive text-sm">{error}</p>}

      <ul className="space-y-2">
        {questions.map((q, qi) =>
          editingId === q.id ? (
            <li key={q.id}>
              <QuestionForm
                initial={draftFromQuestion(q)}
                submitLabel="Save question"
                onCancel={() => setEditingId(null)}
                onSubmit={async (value) => {
                  await updateQuestion(q.id, value);
                  setEditingId(null);
                  router.refresh();
                }}
              />
            </li>
          ) : (
            <li key={q.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">
                  {qi + 1}. {q.question}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  {confirmingId === q.id ? (
                    <>
                      <span className="text-muted-foreground text-xs">Delete?</span>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-destructive rounded px-1.5 py-0.5 text-xs font-medium hover:underline"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="rounded px-1.5 py-0.5 text-xs hover:underline"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(q.id);
                          setAdding(false);
                        }}
                        className="text-muted-foreground hover:bg-accent rounded p-1"
                        aria-label={`Edit question ${qi + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmingId(q.id)}
                        className="text-muted-foreground hover:bg-accent hover:text-destructive rounded p-1"
                        aria-label={`Delete question ${qi + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                {q.options.map((opt) => (
                  <li key={opt} className="flex items-center gap-2">
                    {opt === q.correctOption ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className={opt === q.correctOption ? "text-foreground font-medium" : ""}>
                      {opt}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          )
        )}
      </ul>

      {adding ? (
        <QuestionForm
          submitLabel="Add question"
          onCancel={() => setAdding(false)}
          onSubmit={async (value) => {
            await addQuestion(problemId, value);
            setAdding(false);
            router.refresh();
          }}
        />
      ) : (
        <button
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
          className="text-primary flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <Plus className="h-4 w-4" /> Add a question
        </button>
      )}
    </div>
  );
}

// ── Order + delete ─────────────────────────────────────────────────────────

function ManageSection({
  trackId,
  problemId,
  isFirst,
  isLast,
}: {
  trackId: string;
  problemId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function handleMove(direction: "up" | "down") {
    setBusy(true);
    setError("");
    try {
      await moveSection(trackId, problemId, direction);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't move the section.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError("");
    try {
      await deleteSection(problemId);
      router.push(`/tracks/${trackId}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't delete the section.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-t pt-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleMove("up")}
          disabled={busy || isFirst}
          className="hover:bg-accent flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          <ArrowUp className="h-3.5 w-3.5" /> Move up
        </button>
        <button
          onClick={() => handleMove("down")}
          disabled={busy || isLast}
          className="hover:bg-accent flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          <ArrowDown className="h-3.5 w-3.5" /> Move down
        </button>

        <div className="ml-auto flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-muted-foreground text-xs">
                Delete this section, its questions and students&apos; scores for it?
              </span>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="bg-destructive text-destructive-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-destructive hover:bg-destructive/10 flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete section
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── The panel ──────────────────────────────────────────────────────────────

export function SectionAdminPanel({
  trackId,
  problem,
  questions,
  isFirst,
  isLast,
}: {
  trackId: string;
  problem: SectionProblem;
  questions: SectionQuestion[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-12 rounded-xl border border-dashed">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium"
      >
        <Settings className="h-4 w-4" />
        Edit this section
        <span className="text-muted-foreground text-xs font-normal">
          : slides, practice questions, order (admins only)
        </span>
      </button>
      {open && (
        <div className="space-y-8 border-t p-4">
          <DetailsEditor problem={problem} />
          <PresentationEditor problem={problem} />
          <QuestionsEditor problemId={problem.id} questions={questions} />
          <ManageSection
            trackId={trackId}
            problemId={problem.id}
            isFirst={isFirst}
            isLast={isLast}
          />
        </div>
      )}
    </div>
  );
}
