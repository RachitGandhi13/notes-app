"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addSection } from "@/lib/track-actions";

const inputClass =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

// Lives at the bottom of the track sidebar (admins only): adds a new section and
// points it at its slides/image in one step. Practice questions are added afterwards
// from the section's own page.
export function AddSectionForm({ trackId }: { trackId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialPath, setMaterialPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const section = await addSection({
        trackId,
        title,
        description,
        pptUrl: materialPath.trim() || undefined,
      });

      setTitle("");
      setDescription("");
      setMaterialPath("");
      setOpen(false);
      router.push(`/tracks/${trackId}/${section.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't add the section.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-primary hover:bg-accent flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium lg:min-h-0"
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
        <label htmlFor="new-section-material" className="text-xs font-medium">
          Bunny Storage file path (PDF, JPG, JPEG or PNG, optional)
        </label>
        <input
          id="new-section-material"
          value={materialPath}
          onChange={(e) => setMaterialPath(e.target.value)}
          placeholder="devops-notes.pdf"
          aria-label="Bunny Storage file path"
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add section"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
