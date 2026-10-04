"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { UploadBar, postFormWithProgress } from "./upload";

const inputClass =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

// Lives at the bottom of the track sidebar (admins only): adds a new section
// and uploads its slides in one step. Practice questions are added afterwards
// from the section's own page.
export function AddSectionForm({ trackId }: { trackId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPercent(0);
    try {
      const formData = new FormData();
      formData.set("trackId", trackId);
      formData.set("title", title);
      formData.set("description", description);
      const file = fileRef.current?.files?.[0];
      if (file) formData.set("file", file);

      const data = await postFormWithProgress<{ problemId: string }>(
        "/api/admin/upload-ppt",
        formData,
        setPercent
      );

      setTitle("");
      setDescription("");
      setOpen(false);
      router.push(`/tracks/${trackId}/${data.problemId}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't add the section.");
    } finally {
      setPercent(null);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-primary hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
      >
        <Plus className="h-4 w-4" /> Add section
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 space-y-2.5 rounded-lg border p-3">
      <p className="text-sm font-semibold">New section</p>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <input
        required
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Section title"
        aria-label="Section title"
        className={inputClass}
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        aria-label="Section description"
        className={inputClass}
      />
      <div className="space-y-1">
        <label htmlFor="new-section-file" className="text-xs font-medium">
          Slides — PPT, PPTX or PDF (optional)
        </label>
        <input
          id="new-section-file"
          ref={fileRef}
          type="file"
          accept=".ppt,.pptx,.pdf,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="border-input bg-background file:bg-primary file:text-primary-foreground flex h-9 w-full items-center rounded-md border px-2 text-xs file:mr-2 file:rounded file:border-0 file:px-2 file:py-1 file:text-xs"
        />
      </div>
      {percent !== null ? (
        <UploadBar percent={percent} />
      ) : (
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium"
          >
            Add section
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}
