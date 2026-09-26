import { mkdir, writeFile } from "fs/promises";
import path from "path";

// ── File storage ─────────────────────────────────────────────────────────────
// The client uploads PPT/video files directly (no pasted links). Storage
// picks Vercel Blob when a token is configured (BLOB_READ_WRITE_TOKEN — a
// free-tier service, same "free unless explicitly provisioned" pattern as
// Neon/Upstash/Qdrant elsewhere in this repo), and otherwise falls back to
// writing into the calling app's own public/uploads/ directory so local dev
// works with zero setup.
//
// The local-disk fallback does NOT survive a Vercel deploy (serverless
// functions have an ephemeral, per-invocation filesystem) — it's for local
// testing only. See DEVELOPMENT.md for the Vercel Blob provisioning step
// still needed before this is production-ready, and for the request-body
// size caveat on large video uploads.

export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export interface StoreFileOptions {
  /** Absolute path to the calling app's `public` directory — only used by the local fallback. */
  publicDir: string;
  /** Destination path, e.g. "videos/<uuid>-lecture.mp4". */
  pathname: string;
  data: Buffer;
  contentType: string;
}

export async function storeFile({
  publicDir,
  pathname,
  data,
  contentType,
}: StoreFileOptions): Promise<string> {
  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(pathname, data, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  const destPath = path.join(publicDir, "uploads", pathname);
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, data);
  return `/uploads/${pathname}`;
}
