"use client";

import { useState } from "react";
import { indexTrack } from "@/lib/actions";
import {
  CreateTrackForm,
  PPTLessonForm,
  MCQLessonForm,
} from "@/components/admin/ManualContentForms";

interface Track {
  id: string;
  title: string;
  image: string;
  inSearch: boolean;
}

export function AdminPanel({ tracks: initialTracks }: { tracks: Track[] }) {
  const [tracks, setTracks] = useState(initialTracks);
  const [indexingId, setIndexingId] = useState<string | null>(null);
  const [indexResults, setIndexResults] = useState<Record<string, number>>({});
  const [indexErrors, setIndexErrors] = useState<Record<string, string>>({});

  async function handleIndex(track: Track) {
    setIndexingId(track.id);
    setIndexErrors((prev) => {
      const next = { ...prev };
      delete next[track.id];
      return next;
    });
    try {
      const count = await indexTrack(track.id);
      setIndexResults((prev) => ({ ...prev, [track.id]: count }));
      setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, inSearch: true } : t)));
    } catch (err: any) {
      setIndexErrors((prev) => ({ ...prev, [track.id]: err?.message ?? "Indexing failed." }));
    } finally {
      setIndexingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <CreateTrackForm
        onCreated={(track) =>
          setTracks((prev) => [...prev, { ...track, image: "", inSearch: false }])
        }
      />
      <PPTLessonForm tracks={tracks} />
      <MCQLessonForm tracks={tracks} />

      {/* AI Search Indexing */}
      {tracks.length > 0 && (
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">AI Search Indexing</h2>
          <p className="text-muted-foreground text-sm">
            Index tracks into Qdrant so they appear in semantic search results.
          </p>
          <ul className="divide-y rounded border text-sm">
            {tracks.map((track) => (
              <li key={track.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{track.title}</p>
                  {indexResults[track.id] !== undefined && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Indexed {indexResults[track.id]} problems
                    </p>
                  )}
                  {indexErrors[track.id] && (
                    <p className="text-destructive text-xs">{indexErrors[track.id]}</p>
                  )}
                </div>
                <button
                  onClick={() => handleIndex(track)}
                  disabled={indexingId === track.id}
                  className="hover:bg-accent shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
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
