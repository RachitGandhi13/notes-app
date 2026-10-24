"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Folder,
  ImageIcon,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui";
import {
  createCourse,
  createSection,
  createUploadedVideo,
  updateCourse,
  toggleCourseHidden,
  deleteCourse,
  toggleContentHidden,
  deleteContent,
  moveContentOrder,
  setContentThumbnail,
  setContentMaterial,
  renameContent,
} from "@/lib/actions";
import { ThumbnailPicker } from "@/components/admin/ThumbnailPicker";
import {
  UploadBar,
  isDirectUploadEnabled,
  postFormWithProgress,
  postJson,
  uploadToBlob,
} from "@/components/admin/upload";

interface ContentNode {
  id: string;
  type: string;
  title: string;
  hidden: boolean;
  thumbnail: string | null;
  materialPath: string | null;
  videoMetadata: {
    videoUrl: string | null;
    bunnyVideoId: string | null;
    bunnyPdfPath: string | null;
  } | null;
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
  _count: { purchases: number; paymentOrders: number; certificate: number };
}

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB — soft client-side sanity cap

function AddVideoForm({ courseId, parentId }: { courseId: string; parentId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [bunnyVideoId, setBunnyVideoId] = useState("");
  const [bunnyPdfPath, setBunnyPdfPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file && !bunnyVideoId.trim()) {
      setError("Choose a video file to upload, or paste a Bunny video ID.");
      return;
    }
    if (file && file.size > MAX_VIDEO_SIZE) {
      setError("File is too large (max 500MB).");
      return;
    }
    // Checked before a large upload starts. The server would reject a blank title only after
    // the file had been uploaded.
    if (!title.trim()) {
      setError("Enter a title for the video.");
      return;
    }

    setSubmitting(true);
    setPercent(file ? 0 : null);
    setError("");
    try {
      if (!file) {
        // Bunny-only: no file to upload, so this is a plain server-action call rather than
        // going through either upload route (both of those exist only to handle a file).
        await createUploadedVideo({
          courseId,
          parentId,
          title,
          description,
          thumbnail: thumbnail || undefined,
          bunnyVideoId: bunnyVideoId.trim(),
          bunnyPdfPath: bunnyPdfPath.trim() || undefined,
        });
      } else if (await isDirectUploadEnabled()) {
        // Production: the file goes straight to Vercel Blob. The server then checks it and
        // saves the record.
        const videoUrl = await uploadToBlob("video", file, setPercent);
        await postJson(
          "/api/admin/videos",
          {
            courseId,
            parentId,
            title,
            description,
            videoUrl,
            thumbnail: thumbnail || undefined,
            bunnyVideoId: bunnyVideoId.trim() || undefined,
            bunnyPdfPath: bunnyPdfPath.trim() || undefined,
          },
          2
        );
      } else {
        // Development: the local-disk route.
        const formData = new FormData();
        formData.set("file", file);
        formData.set("courseId", courseId);
        if (parentId) formData.set("parentId", parentId);
        formData.set("title", title);
        formData.set("description", description);
        if (thumbnail) formData.set("thumbnail", thumbnail);
        if (bunnyVideoId.trim()) formData.set("bunnyVideoId", bunnyVideoId.trim());
        if (bunnyPdfPath.trim()) formData.set("bunnyPdfPath", bunnyPdfPath.trim());

        await postFormWithProgress("/api/admin/upload-video", formData, setPercent);
      }

      setTitle("");
      setDescription("");
      setThumbnail("");
      setBunnyVideoId("");
      setBunnyPdfPath("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add video.");
    } finally {
      setSubmitting(false);
      setPercent(null);
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
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="border-input bg-background w-full resize-none rounded border px-2 py-1 text-xs"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="border-input bg-background file:bg-primary file:text-primary-foreground flex h-8 w-full rounded border px-2 text-xs file:mr-2 file:rounded file:border-0 file:px-2 file:py-0.5 file:text-xs"
      />
      <p className="text-muted-foreground text-center text-[10px]">Or, instead of a file</p>
      <input
        placeholder="Bunny video ID (optional, skips the file above)"
        value={bunnyVideoId}
        onChange={(e) => setBunnyVideoId(e.target.value)}
        className="border-input bg-background flex h-8 w-full rounded border px-2 text-xs"
      />
      <input
        placeholder="Bunny file path (PDF, JPG or PNG, optional)"
        value={bunnyPdfPath}
        onChange={(e) => setBunnyPdfPath(e.target.value)}
        className="border-input bg-background flex h-8 w-full rounded border px-2 text-xs"
      />
      <ThumbnailPicker
        compact
        label="Video thumbnail (optional)"
        value={thumbnail}
        onChange={setThumbnail}
      />
      {percent !== null ? (
        <UploadBar percent={percent} />
      ) : (
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground rounded px-3 py-1 text-xs font-medium disabled:opacity-50"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="hover:bg-accent rounded border px-3 py-1 text-xs"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}

function AddSectionForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createSection(courseId, title, thumbnail || undefined);
      setTitle("");
      setThumbnail("");
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
    <form onSubmit={handleSubmit} className="bg-muted/30 w-full space-y-3 rounded-md border p-3">
      {error && <p className="text-destructive text-xs">{error}</p>}
      <input
        required
        autoFocus
        placeholder="Playlist / section title, e.g. Week 1"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-input bg-background flex h-8 w-full rounded border px-2 text-xs"
      />
      <ThumbnailPicker
        label="Playlist thumbnail (optional)"
        value={thumbnail}
        onChange={setThumbnail}
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
  const [editingThumb, setEditingThumb] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.title);
  const [renameError, setRenameError] = useState("");
  const [editingMaterial, setEditingMaterial] = useState(false);
  const [materialInput, setMaterialInput] = useState(node.materialPath ?? "");
  const [materialError, setMaterialError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const isFolder = node.type === "FOLDER";

  async function handleThumbnailChange(url: string) {
    setBusy(true);
    try {
      await setContentThumbnail(node.id, courseId, url || null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleMaterialSave() {
    setBusy(true);
    setMaterialError("");
    try {
      await setContentMaterial(node.id, courseId, materialInput || null);
      setEditingMaterial(false);
      router.refresh();
    } catch (err: any) {
      setMaterialError(err?.message ?? "Couldn't save this.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRename() {
    setBusy(true);
    setRenameError("");
    try {
      await renameContent(node.id, courseId, titleInput);
      setEditingTitle(false);
      router.refresh();
    } catch (err: any) {
      setRenameError(err?.message ?? "Couldn't rename this.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleHidden() {
    setBusy(true);
    try {
      await toggleContentHidden(node.id, courseId);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setDeleteError("");
    try {
      await deleteContent(node.id, courseId);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err?.message ?? "Couldn't delete this.");
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
        {node.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.thumbnail} alt="" className="h-7 w-12 shrink-0 rounded object-cover" />
        )}
        {editingTitle ? (
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setTitleInput(node.title);
                  setEditingTitle(false);
                  setRenameError("");
                }
              }}
              autoFocus
              disabled={busy}
              className="bg-background min-w-0 flex-1 rounded border px-2 py-1 text-sm"
            />
            <button
              onClick={handleRename}
              disabled={busy}
              className="text-primary shrink-0 text-xs font-medium hover:underline disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTitleInput(node.title);
                setEditingTitle(false);
                setRenameError("");
              }}
              disabled={busy}
              className="text-muted-foreground shrink-0 text-xs hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
          </span>
        ) : (
          <span
            className={`text-sm font-medium ${node.hidden ? "text-muted-foreground line-through" : ""}`}
          >
            {node.title}
          </span>
        )}
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
            onClick={() => {
              setTitleInput(node.title);
              setRenameError("");
              setEditingTitle((v) => !v);
            }}
            disabled={busy}
            className="text-muted-foreground hover:bg-accent rounded p-1 disabled:opacity-50"
            aria-label={isFolder ? "Rename playlist" : "Rename video"}
            title={isFolder ? "Rename playlist" : "Rename video"}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setEditingThumb((v) => !v)}
            className="text-muted-foreground hover:bg-accent rounded p-1"
            aria-label="Change thumbnail"
            title={node.thumbnail ? "Change thumbnail" : "Add thumbnail"}
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          {isFolder && (
            <button
              onClick={() => {
                setMaterialInput(node.materialPath ?? "");
                setMaterialError("");
                setEditingMaterial((v) => !v);
              }}
              disabled={busy}
              className={`hover:bg-accent rounded p-1 disabled:opacity-50 ${node.materialPath ? "text-primary" : "text-muted-foreground"}`}
              aria-label={node.materialPath ? "Change attached material" : "Attach material"}
              title={
                node.materialPath
                  ? "Change this section's attached material (PDF/image)"
                  : "Attach a section material (PDF/image): a cheatsheet for the whole section"
              }
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleToggleHidden}
            disabled={busy}
            className="text-muted-foreground hover:bg-accent rounded p-1 disabled:opacity-50"
            aria-label={node.hidden ? "Unhide" : "Hide"}
            title={node.hidden ? "Hidden. Click to show" : "Visible. Click to hide"}
          >
            {node.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          {confirmingDelete ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {isFolder
                  ? `Delete this playlist and its ${node.children.length} video${node.children.length === 1 ? "" : "s"}?`
                  : "Delete this video?"}
              </span>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="text-destructive font-medium hover:underline disabled:opacity-50"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                className="text-muted-foreground hover:underline disabled:opacity-50"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
              className="text-muted-foreground hover:text-destructive hover:bg-accent rounded p-1 disabled:opacity-50"
              aria-label={isFolder ? "Delete playlist" : "Delete video"}
              title={isFolder ? "Delete playlist and its videos" : "Delete video"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {renameError && <p className="text-destructive mt-2 text-xs">{renameError}</p>}
      {materialError && <p className="text-destructive mt-2 text-xs">{materialError}</p>}
      {deleteError && <p className="text-destructive mt-2 text-xs">{deleteError}</p>}

      {editingMaterial && (
        <div className="mt-3 space-y-1.5 border-t pt-3">
          <label className="text-muted-foreground text-xs font-medium">
            Section material: Bunny file path (PDF, JPG, JPEG or PNG), or leave blank to remove
          </label>
          <div className="flex gap-2">
            <input
              value={materialInput}
              onChange={(e) => setMaterialInput(e.target.value)}
              placeholder="notes/aws-cheatsheet.pdf"
              disabled={busy}
              className="border-input bg-background flex h-8 w-full rounded border px-2 text-xs"
            />
            <button
              onClick={handleMaterialSave}
              disabled={busy}
              className="bg-primary text-primary-foreground shrink-0 rounded px-3 text-xs font-medium disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {editingThumb && (
        <div className="mt-3 border-t pt-3">
          <ThumbnailPicker
            compact
            label={isFolder ? "Playlist thumbnail" : "Video thumbnail"}
            value={node.thumbnail ?? ""}
            onChange={handleThumbnailChange}
          />
        </div>
      )}

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
      <input
        type="number"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price (₹)"
        className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm sm:w-48"
      />
      <ThumbnailPicker label="Course thumbnail" value={imageUrl} onChange={setImageUrl} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring rounded-md px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="hover:bg-accent ring-offset-background focus-visible:ring-ring rounded-md border px-4 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const activity =
    course._count.purchases + course._count.paymentOrders + course._count.certificate;
  const canDelete = activity === 0;

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCourse(course.id);
      setConfirmingDelete(false);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err?.message ?? "Failed to delete course.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="bg-card border-border/60 rounded-xl border">
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
            className="text-muted-foreground hover:bg-accent ring-offset-background focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 lg:h-auto lg:w-auto lg:p-1.5"
            aria-label="Edit course"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggleHidden}
            disabled={busy}
            className="text-muted-foreground hover:bg-accent ring-offset-background focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 lg:h-auto lg:w-auto lg:p-1.5"
            aria-label={course.hidden ? "Unhide course" : "Hide course"}
            title={course.hidden ? "Hidden. Click to show" : "Visible. Click to hide"}
          >
            {course.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError("");
              setConfirmingDelete(true);
            }}
            disabled={!canDelete}
            className="text-destructive hover:bg-destructive/10 disabled:text-muted-foreground ring-offset-background focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 lg:h-auto lg:w-auto lg:p-1.5"
            aria-label="Delete course"
            title={
              canDelete
                ? "Delete course"
                : "Can't delete: this course has purchase, payment or certificate records. Hide it instead."
            }
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-muted-foreground hover:bg-accent ring-offset-background focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 lg:h-auto lg:w-auto lg:p-1.5"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {editing && <EditCourseForm course={course} onDone={() => setEditing(false)} />}

      <Dialog
        open={confirmingDelete}
        onOpenChange={(open) => !deleting && setConfirmingDelete(open)}
      >
        <DialogContent className="max-w-sm">
          <h3 className="text-lg font-semibold">Delete &quot;{course.title}&quot;?</h3>
          <p className="text-muted-foreground text-sm">
            This permanently removes the course, its sections and videos, and any comments or
            questions on them. This can&apos;t be undone.
          </p>
          {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
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
              {deleting ? "Deleting…" : "Delete course"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

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

// "cloud architecture 101" -> "cloud-architecture-101".
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CreateCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  // Once the admin types into the slug field directly, auto-generation stops so it
  // never clobbers a deliberate edit — flips back to auto on the next course (reset
  // alongside every other field after a successful submit).
  const [slugTouched, setSlugTouched] = useState(false);
  const [price, setPrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
      });
      setTitle("");
      setDescription("");
      setSlug("");
      setSlugTouched(false);
      setPrice("0");
      setImageUrl("");
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
    <form
      onSubmit={handleSubmit}
      className="bg-card border-border/60 space-y-4 rounded-xl border p-6"
    >
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
            onChange={(e) => {
              const value = e.target.value;
              setTitle(value);
              if (!slugTouched) setSlug(slugify(value));
            }}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Slug (URL path)</label>
          <input
            required
            placeholder="e.g. react-fundamentals"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
          />
          <p className="text-muted-foreground text-xs">
            Auto-generated from the title. Edit anytime before creating.
          </p>
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

      <div className="space-y-1 sm:w-48">
        <label className="text-xs font-medium">Price (₹, 0 = free)</label>
        <input
          type="number"
          min="0"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2"
        />
        <p className="text-muted-foreground text-xs">
          What a student pays via Razorpay checkout to enroll. Enter 0 for a free course.
        </p>
      </div>

      <ThumbnailPicker
        label="Course thumbnail (optional)"
        value={imageUrl}
        onChange={setImageUrl}
      />

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring min-h-11 w-full rounded-md px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Course"}
      </button>
    </form>
  );
}

export function CourseManager({ courses }: { courses: AdminCourse[] }) {
  return (
    <div className="space-y-6">
      <CreateCourseForm />

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
