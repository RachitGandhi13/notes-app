"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface ThumbnailPickerProps {
  /** URL of the current thumbnail, or "" for none. */
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Smaller preview, for use inside dense lists. */
  compact?: boolean;
}

// Uploads the chosen image right away (to /api/admin/upload-image) and hands
// the resulting URL to the parent form, so the parent only ever deals with a
// plain string — the same shape the old "Image URL" text boxes had.
export function ThumbnailPicker({
  value,
  onChange,
  label = "Thumbnail",
  compact,
}: ThumbnailPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image is too large (max 4 MB).");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upload image.");
      onChange(data.url);
    } catch (err: any) {
      setError(err?.message ?? "Failed to upload image.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewWidth = compact ? "w-28" : "w-44";

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label={value ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
          className={`bg-muted/40 hover:bg-muted text-muted-foreground relative flex aspect-video shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors disabled:opacity-60 ${previewWidth}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus className="h-5 w-5" />
              Upload image
            </span>
          )}
          {value && uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </span>
          )}
        </button>

        <div className="space-y-1 text-xs">
          <p className="text-muted-foreground">
            16:9 works best (e.g. 1280×720). JPG, PNG or WebP, up to 4 MB.
          </p>
          {value && !uploading && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-primary hover:underline"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
