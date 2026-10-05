"use client";

import { upload } from "@vercel/blob/client";
import { allowedTypeFor, directUploadRules, type MediaKind } from "@/lib/upload-types";

// fetch() can't report upload progress, and a lecture video or a big slide deck
// can take minutes on a normal connection — so uploads use XMLHttpRequest, which
// can, and the forms show a progress bar instead of a silent "Uploading…".
export function postFormWithProgress<T = any>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as (T & { error?: string }) | null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T);
      } else if (xhr.status === 413) {
        reject(new Error("The file is too large for the server to accept."));
      } else {
        reject(new Error(body?.error ?? `Upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error. The upload did not finish."));
    xhr.send(formData);
  });
}

export async function postJson<T = any>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status}).`);
  return data as T;
}

// Whether files go straight to Vercel Blob (production) or to the local-disk routes
// (development). Asked once per page load. A failed check is not cached, so a retry works.
let directModePromise: Promise<boolean> | null = null;

export function isDirectUploadEnabled(): Promise<boolean> {
  if (!directModePromise) {
    directModePromise = fetch("/api/admin/upload-config", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not read upload settings.");
        const data = await res.json();
        return data.direct === true;
      })
      .catch((err) => {
        directModePromise = null;
        throw err;
      });
  }
  return directModePromise;
}

// Checks the file on the client, so the user gets a clear message before anything uploads.
// The server checks it again, including the file's bytes, after the upload.
function planDirectUpload(kind: MediaKind, file: File) {
  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot).toLowerCase() : "";
  const entry = allowedTypeFor(kind, ext);
  const rules = directUploadRules(kind);
  if (!entry) {
    throw new Error(`Unsupported file type. Allowed: ${rules.extensions.join(", ")}`);
  }
  if (file.size > rules.maxBytes) {
    const mb = Math.round(rules.maxBytes / (1024 * 1024));
    throw new Error(`File is too large (max ${mb} MB).`);
  }
  const stem = (dot > 0 ? file.name.slice(0, dot) : file.name)
    .replace(/[^\w-]+/g, "_")
    .slice(0, 80);
  return {
    pathname: `${rules.folder}/${stem || kind}${entry.ext}`,
    contentType: entry.contentType,
  };
}

/**
 * Uploads a file from the browser straight to Vercel Blob. The server only issues a
 * short-lived token, so the file never passes through the app server. Resolves to the
 * file's public URL.
 */
export async function uploadToBlob(
  kind: MediaKind,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const { pathname, contentType } = planDirectUpload(kind, file);
  const blob = await upload(pathname, file, {
    access: "public",
    contentType,
    handleUploadUrl: "/api/admin/blob-upload",
    clientPayload: JSON.stringify({ kind }),
    multipart: kind === "video",
    onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage)),
  });
  return blob.url;
}

export function UploadBar({ percent }: { percent: number }) {
  return (
    <div
      className="space-y-1"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {percent < 100 ? `Uploading… ${percent}%` : "Upload finished, saving…"}
      </p>
    </div>
  );
}
