"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { indexTrack, toggleTrackHidden } from "@/lib/track-actions";
import { CreateTrackForm } from "@/components/admin/CreateTrackForm";

interface Track {
  id: string;
  title: string;
  image: string;
  inSearch: boolean;
  hidden: boolean;
}

export function AdminPanel({ tracks: initialTracks }: { tracks: Track[] }) {
  const router = useRouter();
  const [tracks, setTracks] = useState(initialTracks);
  const [indexingId, setIndexingId] = useState<string | null>(null);
  const [indexResults, setIndexResults] = useState<Record<string, number>>({});
  const [indexErrors, setIndexErrors] = useState<Record<string, string>>({});

  async function handleToggleHidden(track: Track) {
    await toggleTrackHidden(track.id);
    setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, hidden: !t.hidden } : t)));
    router.refresh();
  }

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
          setTracks((prev) => [{ ...track, inSearch: false, hidden: false }, ...prev])
        }
      />

      {/* Existing tracks */}
      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Your tracks</h2>
        <p className="text-muted-foreground text-sm">
          Open a track to add sections, upload slides and write practice questions right on its
          page.
        </p>
        {tracks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tracks yet — create one above.</p>
        ) : (
          <ul className="divide-y rounded border text-sm">
            {tracks.map((track) => (
              <li key={track.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <p
                  className={`min-w-0 truncate font-medium ${track.hidden ? "text-muted-foreground line-through" : ""}`}
                >
                  {track.title}
                  {track.hidden && (
                    <span className="ml-2 text-xs font-normal no-underline">(hidden)</span>
                  )}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleToggleHidden(track)}
                    className="text-muted-foreground hover:bg-accent rounded p-1.5"
                    aria-label={track.hidden ? "Show track" : "Hide track"}
                    title={track.hidden ? "Hidden — click to show" : "Visible — click to hide"}
                  >
                    {track.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <a
                    href={`/tracks/${track.id}`}
                    className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium"
                  >
                    Open &amp; edit
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
