import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { AuthError, requireAdmin } from "@repo/auth";
import { storeFile } from "@repo/storage";

// Thumbnails for courses, playlists (sections), videos and tracks. Kept under
// Vercel's ~4.5MB request-body cap so it still works once deployed there.
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

// SVG is deliberately not allowed: it can carry scripts, and these files are
// served from the site's own origin.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(request: Request) {
  try {
    // Checked before storeFile() runs so an unauthenticated request can't
    // write a file to storage before being rejected.
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image is too large (max 4 MB)." }, { status: 400 });
    }

    // The stored name never includes the uploaded file's own name.
    const url = await storeFile({
      publicDir: path.join(process.cwd(), "public"),
      pathname: `images/${randomUUID()}${ext}`,
      data: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload-image]", err);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
