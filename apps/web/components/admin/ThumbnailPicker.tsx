"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Upload } from "lucide-react";
import { isDirectUploadEnabled, postFormWithProgress, postJson, uploadToBlob } from "./upload";
import { MAX_IMAGE_BYTES } from "@/lib/upload-types";

const MAX_IMAGE_SIZE = MAX_IMAGE_BYTES;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

async function storeImageLocally(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  const data = await postFormWithProgress<{ url: string }>("/api/admin/upload-image", formData);
  return data.url;
}

// Stores the image and returns its URL. In production the browser uploads straight to Vercel
// Blob and the server then checks the bytes. In development the image goes through the
// local-disk route.
async function storeImage(file: File): Promise<string> {
  if (await isDirectUploadEnabled()) {
    try {
      const url = await uploadToBlob("image", file);
      const checked = await postJson<{ url: string }>("/api/admin/blob-verify", {
        kind: "image",
        url,
      });
      return checked.url;
    } catch (err) {
      // /api/admin/upload-config already live-checks the token, so this is rare: the token
      // worked moments ago and stopped working mid-session. Never do this in production — a
      // file saved to local disk there is lost on the next deploy, so a real failure there
      // should surface loudly instead of silently "succeeding" with a file that won't survive.
      if (process.env.NODE_ENV === "production") throw err;
      console.error("[thumbnail] direct upload failed, falling back to local disk:", err);
      return storeImageLocally(file);
    }
  }
  return storeImageLocally(file);
}

interface ThumbnailPickerProps {
  /** URL of the current thumbnail, or "" for none. */
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Smaller preview, for use inside dense lists. */
  compact?: boolean;
}

// Uploads the chosen image right away and hands the resulting URL to the parent
// form, so the parent only ever deals with a plain string — the same shape the
// old "Image URL" text boxes had.
export function ThumbnailPicker({
  value,
  onChange,
  label = "Thumbnail",
  compact,
}: ThumbnailPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlBroken, setUrlBroken] = useState(false);

  function handleUrlChange(raw: string) {
    setUrlBroken(false);
    if (raw.trim() && !/^https?:\/\//i.test(raw.trim())) {
      setError("Enter a full image URL starting with http:// or https://.");
    } else {
      setError("");
    }
    onChange(raw);
  }

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
      onChange(await storeImage(file));
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
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{label}</span>
        <div className="bg-muted/40 flex gap-0.5 rounded-md border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1 rounded px-2 py-1 ${
              mode === "upload" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Upload className="h-3 w-3" /> Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1 rounded px-2 py-1 ${
              mode === "url" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Link2 className="h-3 w-3" /> Image URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
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
      ) : (
        <div className="flex items-start gap-3">
          <div
            className={`bg-muted/40 relative flex aspect-video shrink-0 items-center justify-center overflow-hidden rounded-md border ${previewWidth}`}
          >
            {value && !urlBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setUrlBroken(true)}
                onLoad={() => setUrlBroken(false)}
              />
            ) : (
              <ImagePlus className="text-muted-foreground h-5 w-5" />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <input
              type="url"
              inputMode="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="border-input bg-background flex h-8 w-full rounded-md border px-2 text-xs"
            />
            <p className="text-muted-foreground text-xs">
              Paste a direct image link: Unsplash, a Vercel Blob URL, or any hosted image.
            </p>
            {urlBroken && (
              <p className="text-destructive text-xs">That URL didn&apos;t load as an image.</p>
            )}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setUrlBroken(false);
                }}
                className="text-destructive text-xs hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
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
