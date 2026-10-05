import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { AuthError, requireAdmin } from "@repo/auth";
import { isBlobConfigured, storeFile } from "@repo/storage";
import { HttpError, assertBodyWithin, assertSameOrigin } from "@/lib/security";
import { MAX_IMAGE_BYTES, validateUpload } from "@/lib/uploads";

// Thumbnails for courses, playlists (sections), videos and tracks. Local-disk
// fallback for development. With Blob configured, the browser uploads straight
// to storage (see /api/admin/blob-upload) and this route answers 410.
// SVG is not allowed: it can carry scripts, and these files are served from
// the site's own origin.
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    // Checked before storeFile() runs so an unauthenticated request can't
    // write a file to storage before being rejected.
    await requireAdmin();
    if (isBlobConfigured()) {
      return NextResponse.json(
        { error: "Images upload directly to storage. Reload the page and try again." },
        { status: 410 }
      );
    }
    assertBodyWithin(request, MAX_IMAGE_BYTES + 64 * 1024);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image is too large (max 4 MB)." }, { status: 400 });
    }

    const data = Buffer.from(await file.arrayBuffer());
    const { ext, contentType } = validateUpload("image", file.name, data);

    // The stored name never includes the uploaded file's own name.
    const url = await storeFile({
      publicDir: path.join(process.cwd(), "public"),
      pathname: `images/${randomUUID()}${ext}`,
      data,
      contentType,
    });

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AuthError || err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload-image]", err);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
