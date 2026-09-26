"use client";

import { useRef, useState } from "react";
import { createTrack, addMCQLesson } from "@/lib/actions";

interface AdminTrack {
  id: string;
  title: string;
}

// ── Create a track ────────────────────────────────────────────────────────

export function CreateTrackForm({ onCreated }: { onCreated: (track: AdminTrack) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const track = await createTrack({ title, description, image, categoryName });
      onCreated({ id: track.id, title: track.title });
      setSuccess(true);
      setTitle("");
      setDescription("");
      setImage("");
      setCategoryName("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to create track.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">Create a track</h2>
      <p className="text-muted-foreground text-sm">
        Add uploaded PPT and MCQ lessons to it with the forms below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400">Track created.</p>}
        {[
          { id: "ct-title", label: "Title", value: title, setter: setTitle },
          {
            id: "ct-description",
            label: "Description",
            value: description,
            setter: setDescription,
          },
          { id: "ct-image", label: "Image URL", value: image, setter: setImage },
          { id: "ct-category", label: "Category", value: categoryName, setter: setCategoryName },
        ].map(({ id, label, value, setter }) => (
          <div key={id} className="space-y-1">
            <label htmlFor={id} className="text-sm font-medium">
              {label}
            </label>
            <input
              id={id}
              required
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={creating}
          className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create Track"}
        </button>
      </form>
    </div>
  );
}

// ── Add a PPT lesson — the client uploads the file directly, no links ──────

const MAX_PPT_SIZE = 100 * 1024 * 1024; // 100MB — soft client-side sanity cap

export function PPTLessonForm({ tracks }: { tracks: AdminTrack[] }) {
  const [trackId, setTrackId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a .ppt/.pptx file to upload.");
      return;
    }
    if (file.size > MAX_PPT_SIZE) {
      setError("File is too large (max 100MB).");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("trackId", trackId);
      formData.set("title", title);
      formData.set("description", description);

      const res = await fetch("/api/admin/upload-ppt", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upload PPT.");

      setSuccess(true);
      setTitle("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message ?? "Failed to add lesson.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">Add a PPT lesson</h2>
      <p className="text-muted-foreground text-sm">
        Upload the .ppt/.pptx file directly — no links needed.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400">Lesson added.</p>}
        <div className="space-y-1">
          <label htmlFor="ppt-track" className="text-sm font-medium">
            Track
          </label>
          <select
            id="ppt-track"
            required
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          >
            <option value="" disabled>
              Select a track…
            </option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="ppt-title" className="text-sm font-medium">
            Lesson title
          </label>
          <input
            id="ppt-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ppt-description" className="text-sm font-medium">
            Description
          </label>
          <input
            id="ppt-description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ppt-file" className="text-sm font-medium">
            PPT file
          </label>
          <input
            id="ppt-file"
            ref={fileInputRef}
            required
            type="file"
            accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="border-input bg-background file:bg-primary file:text-primary-foreground focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:px-2 file:py-1 file:text-xs focus:outline-none focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !trackId}
          className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Uploading…" : "Upload & Add Lesson"}
        </button>
      </form>
    </div>
  );
}

// ── Add a hand-written MCQ quiz lesson to a track ────────────────────────────

interface QuestionDraft {
  question: string;
  options: string[];
  correctIndex: number;
}

function blankQuestion(): QuestionDraft {
  return { question: "", options: ["", "", "", ""], correctIndex: 0 };
}

export function MCQLessonForm({ tracks }: { tracks: AdminTrack[] }) {
  const [trackId, setTrackId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([blankQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function updateQuestion(qi: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q
      )
    );
  }

  function addOption(qi: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi && q.options.length < 6 ? { ...q, options: [...q.options, ""] } : q
      )
    );
  }

  function removeOption(qi: number, oi: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oi);
        const correctIndex = q.correctIndex >= options.length ? 0 : q.correctIndex;
        return { ...q, options, correctIndex };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await addMCQLesson({
        trackId,
        title,
        description,
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctOption: q.options[q.correctIndex] ?? "",
        })),
      });
      setSuccess(true);
      setTitle("");
      setDescription("");
      setQuestions([blankQuestion()]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to add quiz.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">Add an MCQ quiz lesson</h2>
      <p className="text-muted-foreground text-sm">
        Write the questions directly — no Notion page needed.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400">Quiz added.</p>}
        <div className="space-y-1">
          <label htmlFor="mcq-track" className="text-sm font-medium">
            Track
          </label>
          <select
            id="mcq-track"
            required
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          >
            <option value="" disabled>
              Select a track…
            </option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="mcq-title" className="text-sm font-medium">
            Quiz title
          </label>
          <input
            id="mcq-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="mcq-description" className="text-sm font-medium">
            Description
          </label>
          <input
            id="mcq-description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>

        <div className="space-y-3">
          {questions.map((q, qi) => (
            <div key={qi} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">Question {qi + 1}</label>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                    className="text-destructive text-xs hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                required
                value={q.question}
                onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                placeholder="Question text"
                className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              />
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctIndex === oi}
                      onChange={() => updateQuestion(qi, { correctIndex: oi })}
                      aria-label={`Option ${oi + 1} is correct`}
                    />
                    <input
                      required
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="text-muted-foreground hover:text-destructive shrink-0 text-xs"
                        aria-label={`Remove option ${oi + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(qi)}
                    className="text-primary text-xs hover:underline"
                  >
                    + Add option
                  </button>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Select the radio next to the correct option.
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}
            className="text-primary text-sm hover:underline"
          >
            + Add another question
          </button>
        </div>

        <button
          type="submit"
          disabled={saving || !trackId}
          className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add Quiz"}
        </button>
      </form>
    </div>
  );
}
