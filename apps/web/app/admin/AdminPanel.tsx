"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui";
import { indexTrack, toggleTrackHidden, deleteNoteTrack } from "@/lib/track-actions";
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
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleToggleHidden(track: Track) {
    await toggleTrackHidden(track.id);
    setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, hidden: !t.hidden } : t)));
    router.refresh();
  }

  async function handleDelete() {
    if (!deletingTrack) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteNoteTrack(deletingTrack.id);
      setTracks((prev) => prev.filter((t) => t.id !== deletingTrack.id));
      setDeletingTrack(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err?.message ?? "Failed to delete track.");
    } finally {
      setDeleting(false);
    }
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
          <p className="text-muted-foreground text-sm">No tracks yet. Create one above.</p>
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
                    title={track.hidden ? "Hidden. Click to show" : "Visible. Click to hide"}
                  >
                    {track.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <a
                    href={`/tracks/${track.id}`}
                    className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium"
                  >
                    Open &amp; edit
                  </a>
                  <button
                    onClick={() => {
                      setDeleteError("");
                      setDeletingTrack(track);
                    }}
                    className="text-muted-foreground hover:text-destructive hover:bg-accent rounded p-1.5"
                    aria-label="Delete track"
                    title="Delete track"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={!!deletingTrack}
        onOpenChange={(open) => !deleting && !open && setDeletingTrack(null)}
      >
        <DialogContent className="max-w-sm">
          <h3 className="text-lg font-semibold">Delete &quot;{deletingTrack?.title}&quot;?</h3>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete this track? This can&apos;t be undone. Uploaded slides
            and practice questions are kept in case another track uses them.
          </p>
          {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingTrack(null)}
              disabled={deleting}
              className="hover:bg-accent rounded-md border px-4 py-1.5 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete track"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
