"use client";

import { useState } from "react";
import { createTrack, indexTrack } from "@/lib/actions";

interface NotionBlock {
  notionDocId: string;
  title: string;
}

interface Track {
  id: string;
  title: string;
  image: string;
  inSearch: boolean;
}

export function AdminPanel({ tracks: initialTracks }: { tracks: Track[] }) {
  // Step 1: fetch blocks from Notion
  const [notionPageId, setNotionPageId] = useState("");
  const [fetchingBlocks, setFetchingBlocks] = useState(false);
  const [blocks, setBlocks] = useState<NotionBlock[] | null>(null);
  const [fetchError, setFetchError] = useState("");

  // Step 2: create track
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState("");

  // AI indexing
  const [tracks, setTracks] = useState(initialTracks);
  const [indexingId, setIndexingId] = useState<string | null>(null);
  const [indexResults, setIndexResults] = useState<Record<string, number>>({});
  const [indexErrors, setIndexErrors] = useState<Record<string, string>>({});

  async function fetchBlocks() {
    if (!notionPageId.trim()) return;
    setFetchingBlocks(true);
    setFetchError("");
    setBlocks(null);
    try {
      const res = await fetch("/api/AddTracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notionPageId: notionPageId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setFetchError(data.error ?? "Failed to fetch blocks.");
      else setBlocks(data.blocks);
    } catch {
      setFetchError("Network error.");
    } finally {
      setFetchingBlocks(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!blocks) return;
    setCreating(true);
    setCreateError("");
    try {
      await createTrack({ title, description, image, categoryName, problems: blocks });
      setCreateSuccess(true);
    } catch (err: any) {
      setCreateError(err?.message ?? "Failed to create track.");
    } finally {
      setCreating(false);
    }
  }

  async function handleIndex(track: Track) {
    setIndexingId(track.id);
    setIndexErrors((prev) => { const next = { ...prev }; delete next[track.id]; return next; });
    try {
      const count = await indexTrack(track.id);
      setIndexResults((prev) => ({ ...prev, [track.id]: count }));
      setTracks((prev) => prev.map((t) => t.id === track.id ? { ...t, inSearch: true } : t));
    } catch (err: any) {
      setIndexErrors((prev) => ({ ...prev, [track.id]: err?.message ?? "Indexing failed." }));
    } finally {
      setIndexingId(null);
    }
  }

  if (createSuccess) {
    return (
      <div className="rounded-lg border bg-green-50 p-6 text-center dark:bg-green-950">
        <p className="font-semibold text-green-700 dark:text-green-300">Track created successfully!</p>
        <button
          className="mt-3 text-sm underline"
          onClick={() => { setCreateSuccess(false); setBlocks(null); setNotionPageId(""); setTitle(""); setDescription(""); setImage(""); setCategoryName(""); }}
        >
          Add another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1 */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Step 1 — Fetch Notion page blocks</h2>
        <div className="flex gap-2">
          <input
            value={notionPageId}
            onChange={(e) => setNotionPageId(e.target.value)}
            placeholder="Notion page ID (e.g. abc123...)"
            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={fetchBlocks}
            disabled={fetchingBlocks || !notionPageId.trim()}
            className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {fetchingBlocks ? "Fetching…" : "Fetch"}
          </button>
        </div>
        {fetchError && <p className="text-sm text-destructive">{fetchError}</p>}
        {blocks && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Found <strong>{blocks.length}</strong> blocks (first &amp; last stripped):
            </p>
            <ul className="divide-y rounded border text-sm max-h-48 overflow-y-auto">
              {blocks.map((b, i) => (
                <li key={b.notionDocId} className="px-3 py-1.5 flex gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{b.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Step 2 */}
      {blocks && (
        <form onSubmit={handleCreate} className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">Step 2 — Create track</h2>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
          {[
            { id: "title", label: "Title", value: title, setter: setTitle },
            { id: "description", label: "Description", value: description, setter: setDescription },
            { id: "image", label: "Image URL", value: image, setter: setImage },
            { id: "category", label: "Category", value: categoryName, setter: setCategoryName },
          ].map(({ id, label, value, setter }) => (
            <div key={id} className="space-y-1">
              <label htmlFor={id} className="text-sm font-medium">{label}</label>
              <input
                id={id}
                required
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Track"}
          </button>
        </form>
      )}

      {/* AI Search Indexing */}
      {tracks.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold">AI Search Indexing</h2>
          <p className="text-sm text-muted-foreground">
            Index tracks into Qdrant so they appear in semantic search results.
          </p>
          <ul className="divide-y rounded border text-sm">
            {tracks.map((track) => (
              <li key={track.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  {indexResults[track.id] !== undefined && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Indexed {indexResults[track.id]} problems
                    </p>
                  )}
                  {indexErrors[track.id] && (
                    <p className="text-xs text-destructive">{indexErrors[track.id]}</p>
                  )}
                </div>
                <button
                  onClick={() => handleIndex(track)}
                  disabled={indexingId === track.id}
                  className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {indexingId === track.id
                    ? "Indexing…"
                    : track.inSearch
                    ? "Re-index"
                    : "Index for AI Search"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
