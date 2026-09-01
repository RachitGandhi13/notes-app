"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  Pencil,
  PlayCircle,
  Plus,
} from "lucide-react";
import {
  createCourse,
  createSection,
  createVideo,
  updateCourse,
  toggleCourseHidden,
  toggleContentHidden,
  moveContentOrder,
} from "@/lib/actions";

interface ContentNode {
  id: string;
  type: string;
  title: string;
  hidden: boolean;
  videoMetadata: { videoUrl: string } | null;
  children: ContentNode[];
}

interface CourseContentRow {
  order: number;
  content: ContentNode;
}

interface AdminCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  slug: string;
  imageUrl: string | null;
  hidden: boolean;
  linkedTrack: { id: string; title: string } | null;
  content: CourseContentRow[];
}

interface LinkableTrack {
  id: string;
  title: string;
  courseId: string | null;
}

function AddVideoForm({ courseId, parentId }: { courseId: string; parentId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createVideo({ courseId, parentId, title, youtubeUrl, description });
      setTitle("");
      setYoutubeUrl("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add video.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-primary flex items-center gap-1.5 text-xs hover:underline"
      >
        <Plus className="h-3 w-3" /> Add video
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 space-y-2 rounded-md border p-3">
      {error && <p className="text-destructive text-xs">{error}</p>}
      <input
        required
        placeholder="Video title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-input bg-background flex h-8 w-full rounded border px-2 text-xs"
      />
      <input
        required
        placeholder="YouTube URL (Unlisted) or video ID"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        className="border-input bg-background flex h-8 w-full rounded border px-2 text-xs"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="border-input bg-background w-full resize-none rounded border px-2 py-1 text-xs"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-primary-foreground rounded px-3 py-1 text-xs font-medium disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="hover:bg-accent rounded border px-3 py-1 text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddSectionForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createSection(courseId, title);
      setTitle("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add section.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-primary flex items-center gap-1.5 text-xs font-medium hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add section (playlist)
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {error && <p className="text-destructive text-xs">{error}</p>}
      <input
        required
        autoFocus
        placeholder="Section title, e.g. Week 1"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-input bg-background flex h-8 flex-1 rounded border px-2 text-xs"
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground rounded px-3 py-1 text-xs font-medium disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="hover:bg-accent rounded border px-3 py-1 text-xs"
      >
        Cancel
      </button>
    </form>
  );
}

function ContentNodeRow({
  node,
  courseId,
  topLevel,
  isFirst,
  isLast,
}: {
  node: ContentNode;
  courseId: string;
  topLevel?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [busy, setBusy] = useState(false);
  const isFolder = node.type === "FOLDER";

  async function handleToggleHidden() {
    setBusy(true);
    try {
      await toggleContentHidden(node.id, courseId);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(direction: "up" | "down") {
    setBusy(true);
    try {
      await moveContentOrder(courseId, node.id, direction);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="bg-card rounded-md border p-3">
      <div className="flex items-center gap-2">
        {isFolder ? (
          <button onClick={() => setExpanded((e) => !e)} className="shrink-0">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
        {isFolder ? (
          <Folder className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        ) : (
          <PlayCircle className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        )}
        <span
          className={`text-sm font-medium ${node.hidden ? "text-muted-foreground line-through" : ""}`}
        >
          {node.title}
        </span>
        {!isFolder && !node.videoMetadata && (
          <span className="text-destructive text-xs">(no video attached)</span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {topLevel && (
            <>
              <button
                onClick={() => handleMove("up")}
                disabled={busy || isFirst}
                className="text-muted-foreground hover:bg-accent rounded p-1 disabled:opacity-30"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => handleMove("down")}
                disabled={busy || isLast}
                className="text-muted-foreground hover:bg-accent rounded p-1 disabled:opacity-30"
                aria-label="Move down"
              >
                ↓
              </button>
            </>
          )}
          <button
            onClick={handleToggleHidden}
            disabled={busy}
            className="text-muted-foreground hover:bg-accent rounded p-1 disabled:opacity-50"
            aria-label={node.hidden ? "Unhide" : "Hide"}
            title={node.hidden ? "Hidden — click to show" : "Visible — click to hide"}
          >
            {node.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {isFolder && expanded && (
        <div className="mt-3 space-y-2 pl-6">
          {node.children.length > 0 && (
            <ul className="space-y-2">
              {node.children.map((child) => (
                <ContentNodeRow key={child.id} node={child} courseId={courseId} />
              ))}
            </ul>
          )}
          <AddVideoForm courseId={courseId} parentId={node.id} />
        </div>
      )}
    </li>
  );
}

function EditCourseForm({ course, onDone }: { course: AdminCourse; onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [slug, setSlug] = useState(course.slug);
  const [price, setPrice] = useState(String(course.price));
  const [imageUrl, setImageUrl] = useState(course.imageUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await updateCourse(course.id, {
        title,
        description,
        slug,
        price: Number(price) || 0,
        imageUrl: imageUrl || undefined,
      });
      router.refresh();
      onDone();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update course.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 space-y-3 border-t p-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
        />
        <input
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug"
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
        />
      </div>
      <textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="border-input bg-background w-full resize-none rounded-md border px-3 py-2 text-sm"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (₹)"
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
        />
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL"
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm sm:col-span-2"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-primary-foreground rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="hover:bg-accent rounded-md border px-4 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CourseRow({ course }: { course: AdminCourse }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleToggleHidden(e: React.MouseEvent) {
    e.stopPropagation();
    setBusy(true);
    try {
      await toggleCourseHidden(course.id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="bg-card rounded-xl border">
      <div className="flex w-full items-center justify-between gap-3 p-4">
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left">
          <p
            className={`font-semibold ${course.hidden ? "text-muted-foreground line-through" : ""}`}
          >
            {course.title}
          </p>
          <p className="text-muted-foreground text-xs">
            /{course.slug} · {course.price === 0 ? "Free" : `₹${course.price}`}
            {course.hidden && " · Hidden from listing"}
            {course.linkedTrack && (
              <> · Bundled with notes track &quot;{course.linkedTrack.title}&quot;</>
            )}
          </p>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing((v) => !v);
              setExpanded(true);
            }}
            className="text-muted-foreground hover:bg-accent rounded p-1.5"
            aria-label="Edit course"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggleHidden}
            disabled={busy}
            className="text-muted-foreground hover:bg-accent rounded p-1.5 disabled:opacity-50"
            aria-label={course.hidden ? "Unhide course" : "Hide course"}
            title={course.hidden ? "Hidden — click to show" : "Visible — click to hide"}
          >
            {course.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-muted-foreground hover:bg-accent rounded p-1.5"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {editing && <EditCourseForm course={course} onDone={() => setEditing(false)} />}

      {expanded && !editing && (
        <div className="space-y-3 border-t p-4">
          {course.content.length === 0 ? (
            <p className="text-muted-foreground text-sm">No content yet.</p>
          ) : (
            <ul className="space-y-2">
              {course.content.map((cc, i) => (
                <ContentNodeRow
                  key={cc.content.id}
                  node={cc.content}
                  courseId={course.id}
                  topLevel
                  isFirst={i === 0}
                  isLast={i === course.content.length - 1}
                />
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-4 border-t pt-3">
            <AddSectionForm courseId={course.id} />
            <AddVideoForm courseId={course.id} />
          </div>
        </div>
      )}
    </li>
  );
}

function CreateCourseForm({ tracks }: { tracks: LinkableTrack[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [trackId, setTrackId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const unlinkedTracks = tracks.filter((t) => !t.courseId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createCourse({
        title,
        description,
        slug,
        price: Number(price) || 0,
        imageUrl: imageUrl || undefined,
        trackId: trackId || undefined,
      });
      setTitle("");
      setDescription("");
      setSlug("");
      setPrice("0");
      setImageUrl("");
      setTrackId("");
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create course.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Create a course</h2>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">Course created below.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Slug (URL path)</label>
          <input
            required
            placeholder="e.g. react-fundamentals"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Description</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="border-input bg-background w-full resize-none rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Price (₹, 0 = free)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium">Image URL (optional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Link to a notes track (optional — one purchase unlocks both)
        </label>
        <select
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="">None</option>
          {unlinkedTracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        {unlinkedTracks.length === 0 && (
          <p className="text-muted-foreground text-xs">
            No unlinked tracks available in the notes app.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Course"}
      </button>
    </form>
  );
}

export function CourseManager({
  courses,
  tracks,
}: {
  courses: AdminCourse[];
  tracks: LinkableTrack[];
}) {
  return (
    <div className="space-y-6">
      <CreateCourseForm tracks={tracks} />

      {courses.length === 0 ? (
        <p className="text-muted-foreground text-sm">No courses yet.</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <CourseRow key={course.id} course={course} />
          ))}
        </ul>
      )}
    </div>
  );
}
