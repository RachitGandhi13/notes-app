import { del } from "@vercel/blob";
import { HttpError } from "./security";
import { validateUpload } from "./uploads";
import { directUploadRules, type MediaKind } from "./upload-types";

// Checks for files uploaded straight from the browser to Vercel Blob. The browser
// reports a URL and the server must not trust it: a URL is accepted only when it points at
// this store's public files, under the folder for the kind of file.

const PUBLIC_BLOB_HOST = ".public.blob.vercel-storage.com";
// How many leading bytes to read. The longest signature is 12 bytes, and the ftyp box for
// MP4 and MOV sits at offset 4.
const HEAD_BYTES = 64;

/** Returns the URL when it is a public blob in the folder for `kind`, or throws HttpError(400). */
export function parseBlobUrl(raw: unknown, kind: MediaKind): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) {
    throw new HttpError(400, "Missing or invalid file URL.");
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError(400, "Missing or invalid file URL.");
  }
  const { folder } = directUploadRules(kind);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(PUBLIC_BLOB_HOST) ||
    !url.pathname.startsWith(`/${folder}/`) ||
    url.pathname.includes("..")
  ) {
    throw new HttpError(400, "The file is not in this site's storage.");
  }
  return url.toString();
}

/** Reads up to `count` bytes from the start of a file, without downloading the rest. */
async function readHead(url: string, count: number): Promise<Buffer> {
  // Bounded, so a stalled storage read can't hold the admin request past the load balancer's
  // timeout (about 60 seconds). The client retries the save when it gets a 503.
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Range: `bytes=0-${count - 1}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("[blob-check] read failed", err instanceof Error ? err.name : err);
    throw new HttpError(503, "The uploaded file could not be checked yet. Try saving again.");
  }
  if (!res.ok || !res.body) {
    throw new HttpError(400, "The uploaded file could not be read.");
  }
  const reader = res.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (total < count) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
      total += value.length;
    }
  } catch (err) {
    console.error("[blob-check] read interrupted", err instanceof Error ? err.name : err);
    throw new HttpError(503, "The uploaded file could not be checked yet. Try saving again.");
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).subarray(0, count);
}

/**
 * Confirms that an uploaded file's bytes match its extension. If they don't, the file is
 * deleted from storage and HttpError(400) is thrown. The browser checks types too, but it
 * can be bypassed, so this check runs on the server.
 */
export async function verifyBlobUpload(url: string, kind: MediaKind): Promise<void> {
  const head = await readHead(url, HEAD_BYTES);
  try {
    validateUpload(kind, new URL(url).pathname, head);
  } catch (err) {
    await del(url).catch((delErr) => console.error("[blob-check] delete failed", delErr));
    throw err;
  }
}
