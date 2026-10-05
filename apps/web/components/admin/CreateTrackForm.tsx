"use client";

import { useState } from "react";
import { createTrack } from "@/lib/track-actions";
import { ThumbnailPicker } from "./ThumbnailPicker";

interface CreatedTrack {
  id: string;
  title: string;
  image: string;
}

const inputClass =
  "border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2";

// A track is a topic (e.g. "AWS Basics") that holds sections. Sections — the
// slides and practice questions — are added on the track's own page.
export function CreateTrackForm({ onCreated }: { onCreated: (track: CreatedTrack) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedTrack | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setCreated(null);
    try {
      const track = await createTrack({ title, description, image, categoryName });
      const result = { id: track.id, title: track.title, image: track.image };
      onCreated(result);
      setCreated(result);
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
        A track is a topic. After creating it, open it to add sections, each with its slides and
        practice questions.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {created && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Track created.{" "}
            <a href={`/tracks/${created.id}`} className="underline">
              Open it to add sections →
            </a>
          </p>
        )}
        <div className="space-y-1">
          <label htmlFor="ct-title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="ct-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ct-description" className="text-sm font-medium">
            Description
          </label>
          <input
            id="ct-description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ct-category" className="text-sm font-medium">
            Category
          </label>
          <input
            id="ct-category"
            required
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className={inputClass}
          />
        </div>
        <ThumbnailPicker label="Track thumbnail (optional)" value={image} onChange={setImage} />
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
