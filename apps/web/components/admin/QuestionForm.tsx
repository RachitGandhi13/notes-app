"use client";

import { useState } from "react";
import { validateQuestion } from "@/lib/question-validation";

export interface QuestionDraft {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuestionValue {
  question: string;
  options: string[];
  correctOption: string;
}

export function blankQuestion(): QuestionDraft {
  return { question: "", options: ["", "", "", ""], correctIndex: 0 };
}

export function draftFromQuestion(q: QuestionValue): QuestionDraft {
  const idx = q.options.indexOf(q.correctOption);
  return { question: q.question, options: [...q.options], correctIndex: idx === -1 ? 0 : idx };
}

const inputClass =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

// One multiple-choice question: the text, 2–6 options, and which one is right.
// Used both to add a question and to edit an existing one.
export function QuestionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: QuestionDraft;
  submitLabel: string;
  onSubmit: (q: QuestionValue) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<QuestionDraft>(initial ?? blankQuestion());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setOption(i: number, value: string) {
    setDraft((d) => ({ ...d, options: d.options.map((o, j) => (j === i ? value : o)) }));
  }

  function removeOption(i: number) {
    setDraft((d) => {
      if (d.options.length <= 2) return d;
      const options = d.options.filter((_, j) => j !== i);
      // Keep the "correct" marker on the same option, or fall back to the first.
      const correctIndex =
        d.correctIndex === i ? 0 : d.correctIndex > i ? d.correctIndex - 1 : d.correctIndex;
      return { ...d, options, correctIndex };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const correct = draft.options[draft.correctIndex]?.trim() ?? "";
    if (!correct) {
      setError("The option marked correct can't be empty.");
      return;
    }
    // Same rules the server enforces — checked here first so the message is
    // shown even in a production build, where server errors are anonymised.
    const check = validateQuestion({
      question: draft.question,
      options: draft.options,
      correctOption: correct,
    });
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(check.value);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save the question.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 space-y-3 rounded-lg border p-3">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <input
        required
        autoFocus
        value={draft.question}
        onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
        placeholder="Question"
        aria-label="Question"
        className={inputClass}
      />
      <div className="space-y-1.5">
        {draft.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct-option"
              checked={draft.correctIndex === i}
              onChange={() => setDraft((d) => ({ ...d, correctIndex: i }))}
              aria-label={`Option ${i + 1} is the correct answer`}
            />
            <input
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              aria-label={`Option ${i + 1}`}
              className={inputClass}
            />
            {draft.options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-muted-foreground hover:text-destructive shrink-0 px-1 text-xs"
                aria-label={`Remove option ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {draft.options.length < 6 && (
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, options: [...d.options, ""] }))}
            className="text-primary text-xs hover:underline"
          >
            + Add option
          </button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Select the round button next to the correct answer. Empty options are ignored.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
