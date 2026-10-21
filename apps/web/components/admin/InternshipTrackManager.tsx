"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui";
import {
  createInternshipTrack,
  deleteInternshipTrack,
  setInternshipTrackCourses,
  toggleInternshipTrackHidden,
  updateInternshipTrack,
} from "@/lib/internship-actions";

interface LinkedCourse {
  course: { id: string; title: string; slug: string };
}

interface InternshipTrack {
  id: string;
  title: string;
  duration: string;
  description: string;
  hidden: boolean;
  courses: LinkedCourse[];
}

interface BundlableCourse {
  id: string;
  title: string;
  price: number;
  slug: string;
}

const inputClass =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

// Admin panel for the InternshipTrack catalog — create/edit/hide/delete a
// track and pick which courses issuing its certificate grants. Lives in
// Admin -> Internships, alongside StudentAccessPanel (cert issuing) and
// InternshipApplicationsList (reviewing applications), neither of which this
// replaces.
export function InternshipTrackManager({
  tracks: initialTracks,
  allCourses,
}: {
  tracks: InternshipTrack[];
  allCourses: BundlableCourse[];
}) {
  const router = useRouter();
  const [tracks, setTracks] = useState(initialTracks);

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState("");

  const [deletingTrack, setDeletingTrack] = useState<InternshipTrack | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const track = await createInternshipTrack({ title, duration, description });
      setTracks((prev) => [{ ...track, hidden: false, courses: [] }, ...prev]);
      setTitle("");
      setDuration("");
      setDescription("");
    } catch (err: any) {
      setCreateError(err?.message ?? "Couldn't create this track.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleHidden(track: InternshipTrack) {
    await toggleInternshipTrackHidden(track.id);
    setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, hidden: !t.hidden } : t)));
    router.refresh();
  }

  async function handleSaveEdit(trackId: string) {
    setEditSaving(true);
    setEditError("");
    try {
      await updateInternshipTrack(trackId, {
        title: editTitle,
        duration: editDuration,
        description: editDescription,
      });
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? {
                ...t,
                title: editTitle.trim(),
                duration: editDuration.trim(),
                description: editDescription.trim(),
              }
            : t
        )
      );
      setEditingId(null);
    } catch (err: any) {
      setEditError(err?.message ?? "Couldn't save this.");
    } finally {
      setEditSaving(false);
    }
  }

  function openLinker(track: InternshipTrack) {
    setLinkError("");
    setSelectedCourses(new Set(track.courses.map((tc) => tc.course.id)));
    setLinkingId(track.id);
  }

  function toggleCourse(courseId: string) {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  async function handleSaveLinks(trackId: string) {
    setLinkSaving(true);
    setLinkError("");
    try {
      const courseIds = [...selectedCourses];
      await setInternshipTrackCourses(trackId, courseIds);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? {
                ...t,
                courses: allCourses
                  .filter((c) => selectedCourses.has(c.id))
                  .map((c) => ({ course: { id: c.id, title: c.title, slug: c.slug } })),
              }
            : t
        )
      );
      setLinkingId(null);
    } catch (err: any) {
      setLinkError(err?.message ?? "Couldn't save linked courses.");
    } finally {
      setLinkSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingTrack) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteInternshipTrack(deletingTrack.id);
      setTracks((prev) => prev.filter((t) => t.id !== deletingTrack.id));
      setDeletingTrack(null);
    } catch (err: any) {
      setDeleteError(err?.message ?? "Failed to delete track.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-border/60 space-y-3 rounded-xl border p-6">
        <h3 className="font-semibold">Create an internship track</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          {createError && <p className="text-destructive text-sm">{createError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="it-title" className="text-sm font-medium">
                Title
              </label>
              <input
                id="it-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="it-duration" className="text-sm font-medium">
                Duration (advertised, e.g. &quot;6-8 weeks&quot;)
              </label>
              <input
                id="it-duration"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass}
              />
              <p className="text-muted-foreground text-xs">
                Shown to applicants as plain text only. It doesn&apos;t schedule anything or affect
                an individual application&apos;s dates.
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="it-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="it-description"
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-input bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring rounded-md px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create track"}
          </button>
        </form>
      </div>

      <div className="bg-card border-border/60 space-y-3 rounded-xl border p-6">
        <h3 className="font-semibold">Internship tracks</h3>
        {tracks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No internship tracks yet. Create one above.
          </p>
        ) : (
          <ul className="border-border/60 divide-border/60 divide-y rounded-lg border text-sm">
            {tracks.map((track) => (
              <li
                key={track.id}
                className="hover:bg-muted/40 space-y-2 px-4 py-3 transition-colors"
              >
                {editingId === track.id ? (
                  <div className="space-y-2">
                    {editError && <p className="text-destructive text-xs">{editError}</p>}
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      aria-label="Track title"
                      className="border-input bg-background flex h-8 w-full rounded border px-2 text-sm"
                    />
                    <input
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      aria-label="Track duration"
                      className="border-input bg-background flex h-8 w-full rounded border px-2 text-sm"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      aria-label="Track description"
                      rows={2}
                      className="border-input bg-background w-full resize-none rounded border px-2 py-1.5 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(track.id)}
                        disabled={editSaving}
                        className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
                      >
                        {editSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={editSaving}
                        className="hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md border px-3 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate font-medium ${track.hidden ? "text-muted-foreground line-through" : ""}`}
                        >
                          {track.title}
                        </p>
                        {track.hidden && (
                          <span className="bg-muted text-muted-foreground shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {track.duration} · {track.courses.length}{" "}
                        {track.courses.length === 1 ? "course" : "courses"} linked
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() =>
                          linkingId === track.id ? setLinkingId(null) : openLinker(track)
                        }
                        className="text-muted-foreground hover:bg-accent ring-offset-background focus-visible:ring-ring flex items-center gap-1 rounded-md p-2 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                        aria-label="Link courses"
                        title="Link courses granted by this track's certificate"
                      >
                        {linkingId === track.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        Courses
                      </button>
                      <button
                        onClick={() => {
                          setEditTitle(track.title);
                          setEditDuration(track.duration);
                          setEditDescription(track.description);
                          setEditError("");
                          setEditingId(track.id);
                        }}
                        className="text-muted-foreground hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                        aria-label="Edit track"
                        title="Edit track"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleHidden(track)}
                        className="text-muted-foreground hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                        aria-label={track.hidden ? "Show track" : "Hide track"}
                        title={
                          track.hidden
                            ? "Hidden from the application form. Click to show"
                            : "Visible on the application form. Click to hide"
                        }
                      >
                        {track.hidden ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError("");
                          setDeletingTrack(track);
                        }}
                        className="text-destructive hover:bg-destructive/10 ring-offset-background focus-visible:ring-ring rounded-md p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                        aria-label="Delete track"
                        title="Delete track"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {linkingId === track.id && (
                  <div className="bg-muted/30 space-y-2 rounded-md border p-3">
                    <p className="text-muted-foreground text-xs">
                      Courses granted when an admin issues a certificate for this track.
                    </p>
                    {allCourses.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No courses exist yet.</p>
                    ) : (
                      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                        {allCourses.map((course) => (
                          <li key={course.id}>
                            <label className="hover:bg-accent flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedCourses.has(course.id)}
                                onChange={() => toggleCourse(course.id)}
                                className="accent-primary h-4 w-4 shrink-0"
                              />
                              <span className="flex-1 truncate">{course.title}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                    {linkError && <p className="text-destructive text-xs">{linkError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveLinks(track.id)}
                        disabled={linkSaving}
                        className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
                      >
                        {linkSaving ? "Saving…" : "Save linked courses"}
                      </button>
                      <button
                        onClick={() => setLinkingId(null)}
                        disabled={linkSaving}
                        className="hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md border px-3 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
            Are you sure you want to delete this internship track? This can&apos;t be undone. A
            track that already has issued certificates can&apos;t be deleted. Hide it instead.
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
    </div>
  );
}
