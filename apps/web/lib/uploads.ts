import path from "path";
import { HttpError } from "./security";
import { DOCUMENT_TYPES, IMAGE_TYPES, VIDEO_TYPES, type Signature } from "./upload-types";

// Upload validation. A file's name and its browser-supplied MIME type are both
// under the client's control, so each allowed type is also checked against the
// file's leading bytes (its "magic number"). A file passes only when the
// extension and the signature agree.

export { MAX_IMAGE_BYTES, MAX_DOCUMENT_BYTES, MAX_VIDEO_BYTES } from "./upload-types";

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

/**
 * Checks an uploaded buffer against an allowlist. Throws HttpError(400) when
 * the extension isn't allowed or the bytes don't match it. Returns the
 * canonical extension and content type to store the file under.
 *
 * `data` may be only the first few bytes of a file, which is enough for every
 * signature above (the longest is 12 bytes).
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
