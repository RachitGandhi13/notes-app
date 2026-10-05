// Upload types shared by the server and the browser. Keep this file free of server-only
// imports: client components import it too, so the file types and size limits match on both
// sides.

export type MediaKind = "image" | "video";

export type Signature = "jpeg" | "png" | "webp" | "pdf" | "ole" | "zip" | "mp4" | "webm";

export interface AllowedType {
  /** Canonical extension the file is stored under. */
  ext: string;
  contentType: string;
  sig: Signature;
}

export const IMAGE_TYPES: Record<string, AllowedType> = {
  ".jpg": { ext: ".jpg", contentType: "image/jpeg", sig: "jpeg" },
  ".jpeg": { ext: ".jpg", contentType: "image/jpeg", sig: "jpeg" },
  ".png": { ext: ".png", contentType: "image/png", sig: "png" },
  ".webp": { ext: ".webp", contentType: "image/webp", sig: "webp" },
};

export const DOCUMENT_TYPES: Record<string, AllowedType> = {
  ".pdf": { ext: ".pdf", contentType: "application/pdf", sig: "pdf" },
  ".ppt": { ext: ".ppt", contentType: "application/vnd.ms-powerpoint", sig: "ole" },
  ".pptx": {
    ext: ".pptx",
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    sig: "zip",
  },
};

export const VIDEO_TYPES: Record<string, AllowedType> = {
  ".mp4": { ext: ".mp4", contentType: "video/mp4", sig: "mp4" },
  ".m4v": { ext: ".mp4", contentType: "video/mp4", sig: "mp4" },
  ".mov": { ext: ".mov", contentType: "video/quicktime", sig: "mp4" },
  ".webm": { ext: ".webm", contentType: "video/webm", sig: "webm" },
};

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024; // 100 MB
// The admin form also stops at 500 MB (CourseManager.tsx). Through the app server, videos
// are buffered in memory, so this cap is bounded by the container's memory. Direct uploads
// bypass the server but use the same cap.
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

/** The file types and size limit for a direct upload of this kind. */
export function directUploadRules(kind: MediaKind) {
  const table = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
  return {
    folder: kind === "image" ? "images" : "videos",
    extensions: Object.keys(table),
    contentTypes: [...new Set(Object.values(table).map((t) => t.contentType))],
    maxBytes: kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES,
  };
}

/** The table entry for a file name's extension, or undefined when the type isn't allowed. */
export function allowedTypeFor(kind: MediaKind, ext: string): AllowedType | undefined {
  const table = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
  return table[ext.toLowerCase()];
}
