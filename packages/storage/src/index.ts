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

/** Fast, no-network check: is a token present at all. */
export function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// A token can be present but wrong (revoked, copy-pasted from a different
// store, expired) — Vercel then rejects every call with "Access denied",
// which previously surfaced as a raw upload failure in the admin UI instead
// of falling back to local disk. This does a cheap, read-only live check so
// a dead token behaves like no token at all in development. Cached briefly
// so normal admin traffic doesn't add a Vercel round trip to every upload.
const CHECK_TTL_MS = 20_000;
let cachedCheck: { token: string; working: boolean; checkedAt: number } | null = null;

async function blobTokenWorks(token: string): Promise<boolean> {
  const now = Date.now();
  if (cachedCheck && cachedCheck.token === token && now - cachedCheck.checkedAt < CHECK_TTL_MS) {
    return cachedCheck.working;
  }

  let working: boolean;
  try {
    const { list } = await import("@vercel/blob");
    // limit: 1 — just confirms the token is accepted, not a real listing.
    await list({ token, limit: 1, abortSignal: AbortSignal.timeout(5000) });
    working = true;
  } catch (err) {
    console.error(
      "[storage] BLOB_READ_WRITE_TOKEN is set but Vercel rejected it, falling back to local disk:",
      err instanceof Error ? err.message : err
    );
    working = false;
  }
  cachedCheck = { token, working, checkedAt: now };
  return working;
}

/** Whether Blob uploads should actually be used — present *and* confirmed working. */
export async function isBlobConfigured(): Promise<boolean> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  return blobTokenWorks(token);
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
  if (await isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(pathname, data, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  // Local disk is for development only. In production it would be lost on
  // every deploy, because the container filesystem is ephemeral — so a bad
  // token still fails loudly here rather than silently writing files that
  // vanish on the next deploy.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      hasBlobToken()
        ? "BLOB_READ_WRITE_TOKEN is set but Vercel Blob rejected it (wrong or revoked token for this store). Uploads need working Vercel Blob in production."
        : "BLOB_READ_WRITE_TOKEN is not set. Uploads need Vercel Blob in production."
    );
  }

  const destPath = path.join(publicDir, "uploads", pathname);
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, data);
  return `/uploads/${pathname}`;
}
