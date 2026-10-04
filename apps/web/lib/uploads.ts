import path from "path";
import { HttpError } from "./security";

// Upload validation. A file's name and its browser-supplied MIME type are both
// under the client's control, so each allowed type is also checked against the
// file's leading bytes (its "magic number"). A file passes only when the
// extension and the signature agree.

type Signature = "jpeg" | "png" | "webp" | "pdf" | "ole" | "zip" | "mp4" | "webm";

interface AllowedType {
  /** Canonical extension the file is stored under. */
  ext: string;
  contentType: string;
  sig: Signature;
}

function sniff(buf: Buffer): Signature | null {
  const head = (n: number) => buf.subarray(0, n);
  if (buf.length >= 3 && head(3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpeg";
  if (
    buf.length >= 8 &&
    head(8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (
    buf.length >= 12 &&
    head(4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";
  if (buf.length >= 5 && head(5).toString("ascii") === "%PDF-") return "pdf";
  if (
    buf.length >= 8 &&
    head(8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
  )
    return "ole";
  if (buf.length >= 4 && head(4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) return "zip";
  if (buf.length >= 8 && buf.subarray(4, 8).toString("ascii") === "ftyp") return "mp4";
  if (buf.length >= 4 && head(4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "webm";
  return null;
}

const IMAGE_TYPES: Record<string, AllowedType> = {
  ".jpg": { ext: ".jpg", contentType: "image/jpeg", sig: "jpeg" },
  ".jpeg": { ext: ".jpg", contentType: "image/jpeg", sig: "jpeg" },
  ".png": { ext: ".png", contentType: "image/png", sig: "png" },
  ".webp": { ext: ".webp", contentType: "image/webp", sig: "webp" },
};

const DOCUMENT_TYPES: Record<string, AllowedType> = {
  ".pdf": { ext: ".pdf", contentType: "application/pdf", sig: "pdf" },
  ".ppt": { ext: ".ppt", contentType: "application/vnd.ms-powerpoint", sig: "ole" },
  ".pptx": {
    ext: ".pptx",
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    sig: "zip",
  },
};

const VIDEO_TYPES: Record<string, AllowedType> = {
  ".mp4": { ext: ".mp4", contentType: "video/mp4", sig: "mp4" },
  ".m4v": { ext: ".mp4", contentType: "video/mp4", sig: "mp4" },
  ".mov": { ext: ".mov", contentType: "video/quicktime", sig: "mp4" },
  ".webm": { ext: ".webm", contentType: "video/webm", sig: "webm" },
};

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024; // 100 MB
// Videos are buffered in memory before storage, so this cap is bounded by the
// container's memory. Larger lecture files need direct-to-storage uploads.
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024; // 1 GB

/**
 * Checks an uploaded buffer against an allowlist. Throws HttpError(400) when
 * the extension isn't allowed or the bytes don't match it. Returns the
 * canonical extension and content type to store the file under.
 */
export function validateUpload(
  kind: "image" | "document" | "video",
  name: string,
  data: Buffer
): { ext: string; contentType: string } {
  const table = kind === "image" ? IMAGE_TYPES : kind === "document" ? DOCUMENT_TYPES : VIDEO_TYPES;
  const entry = table[path.extname(name).toLowerCase()];
  if (!entry) {
    throw new HttpError(400, `Unsupported file type. Allowed: ${Object.keys(table).join(", ")}`);
  }
  if (sniff(data) !== entry.sig) {
    throw new HttpError(400, "The file contents don't match its extension.");
  }
  return { ext: entry.ext, contentType: entry.contentType };
}
