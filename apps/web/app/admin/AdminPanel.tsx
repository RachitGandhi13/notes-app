"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent } from "@repo/ui";
import { indexTrack, toggleTrackHidden, deleteNoteTrack, updateTrack } from "@/lib/track-actions";
import { CreateTrackForm } from "@/components/admin/CreateTrackForm";

interface Track {
  id: string;
  title: string;
  description: string;
  image: string;
  inSearch: boolean;
  hidden: boolean;
}

interface CourseSummary {
  id: string;
  title: string;
  linkedTrackId: string | null;
}

export function AdminPanel({
  tracks: initialTracks,
  courses,
}: {
  tracks: Track[];
  courses: CourseSummary[];
}) {
  const router = useRouter();
  const [tracks, setTracks] = useState(initialTracks);
  const [indexingId, setIndexingId] = useState<string | null>(null);
  const [indexResults, setIndexResults] = useState<Record<string, number>>({});
  const [indexErrors, setIndexErrors] = useState<Record<string, string>>({});
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  async function handleToggleHidden(track: Track) {
    await toggleTrackHidden(track.id);
    setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, hidden: !t.hidden } : t)));
    router.refresh();
  }

  async function handleSaveTrackEdit(trackId: string) {
    setEditSaving(true);
    setEditError("");
    try {
      await updateTrack(trackId, { title: editTitle, description: editDescription });
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? { ...t, title: editTitle.trim(), description: editDescription.trim() }
            : t
        )
      );
      setEditingTrackId(null);
      router.refresh();
    } catch (err: any) {
      setEditError(err?.message ?? "Couldn't save this.");
    } finally {
      setEditSaving(false);
    }
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
      {/* Courses — each gets its own notes track automatically, shown on /notes as its
          own card. Video lessons stay on the Courses tab; this is purely the notes side:
          sections, slide/image uploads, quizzes — independent of the video content. */}
      <div className="bg-card border-border/60 space-y-3 rounded-xl border p-6">
        <h2 className="font-semibold">Courses (shown automatically on /notes)</h2>
        <p className="text-muted-foreground text-sm">
          Every course gets a matching notes track automatically. Nothing to create here. Open one
          to add sections, upload slides/images, and write practice questions, same as any other
          track.
        </p>
        {courses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No courses yet.</p>
        ) : (
          <ul className="border-border/60 divide-border/60 divide-y rounded-lg border text-sm">
            {courses.map((course) => (
              <li
                key={course.id}
                className="hover:bg-muted/40 flex items-center justify-between gap-4 px-3 py-2.5 transition-colors"
              >
                <p className="min-w-0 truncate font-medium">{course.title}</p>
                {course.linkedTrackId ? (
                  <Link
                    href={`/tracks/${course.linkedTrackId}`}
                    className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                  >
                    Open &amp; edit
                  </Link>
                ) : (
                  <span className="text-muted-foreground shrink-0 text-xs">Notes pending…</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateTrackForm
        onCreated={(track) =>
          setTracks((prev) => [{ ...track, inSearch: false, hidden: false }, ...prev])
        }
      />

      {/* Existing tracks */}
      <div className="bg-card border-border/60 space-y-3 rounded-xl border p-6">
        <h2 className="font-semibold">Your tracks</h2>
        <p className="text-muted-foreground text-sm">
          Open a track to add sections, upload slides and write practice questions right on its
          page.
        </p>
        {tracks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tracks yet. Create one above.</p>
        ) : (
          <ul className="border-border/60 divide-border/60 divide-y rounded-lg border text-sm">
            {tracks.map((track) =>
              editingTrackId === track.id ? (
                <li key={track.id} className="space-y-2 px-3 py-2.5">
                  {editError && <p className="text-destructive text-xs">{editError}</p>}
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    aria-label="Track title"
                    className="border-input bg-background focus:ring-ring flex h-8 w-full rounded-md border px-2 text-sm focus:outline-none focus:ring-2"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    aria-label="Track description"
                    rows={2}
                    className="border-input bg-background focus:ring-ring w-full resize-none rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveTrackEdit(track.id)}
                      disabled={editSaving}
                      className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
                    >
                      {editSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingTrackId(null)}
                      disabled={editSaving}
                      className="hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md border px-3 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ) : (
                <li
                  key={track.id}
                  className="hover:bg-muted/40 flex items-center justify-between gap-4 px-3 py-2.5 transition-colors"
                >
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
                      onClick={() => {
                        setEditTitle(track.title);
                        setEditDescription(track.description);
                        setEditError("");
                        setEditingTrackId(track.id);
                      }}
                      className="text-muted-foreground hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                      aria-label="Rename track"
                      title="Rename track"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleHidden(track)}
                      className="text-muted-foreground hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                      aria-label={track.hidden ? "Show track" : "Hide track"}
                      title={track.hidden ? "Hidden. Click to show" : "Visible. Click to hide"}
                    >
                      {track.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <a
                      href={`/tracks/${track.id}`}
                      className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                    >
                      Open &amp; edit
                    </a>
                    <button
                      onClick={() => {
                        setDeleteError("");
                        setDeletingTrack(track);
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                      aria-label="Delete track"
                      title="Delete track"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            )}
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
              className="hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md border px-4 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground ring-offset-background focus-visible:ring-ring rounded-md px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete track"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Search Indexing */}
      {tracks.length > 0 && (
        <div className="bg-card border-border/60 space-y-3 rounded-xl border p-6">
          <h2 className="font-semibold">AI Search Indexing</h2>
          <p className="text-muted-foreground text-sm">
            Index tracks into Qdrant so they appear in semantic search results — this powers
            semantic Q&amp;A and search across the platform&apos;s notes. Nothing else changes for
            students; this just makes a track&apos;s content findable.
          </p>
          <ul className="border-border/60 divide-border/60 divide-y rounded-lg border text-sm">
            {tracks.map((track) => (
              <li
                key={track.id}
                className="hover:bg-muted/40 flex items-center justify-between gap-4 px-3 py-2.5 transition-colors"
              >
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
                  className="hover:bg-accent ring-offset-background focus-visible:ring-ring shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
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
