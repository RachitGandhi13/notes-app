import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { AuthError, requireAdmin } from "@repo/auth";
import { isBlobConfigured, storeFile } from "@repo/storage";
import { createUploadedVideo } from "@/lib/actions";
import { HttpError, assertBodyWithin, assertSameOrigin } from "@/lib/security";
import { MAX_VIDEO_BYTES, validateUpload } from "@/lib/uploads";

// Local-disk fallback for development, used only when BLOB_READ_WRITE_TOKEN is not set. With
// Blob configured, the browser uploads straight to storage (see /api/admin/blob-upload) and
// this route answers 410 so the server never buffers a lecture video.
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    // Checked before storeFile() runs — an admin check that only happened
    // inside createUploadedVideo() would let an unauthenticated request still
    // write the file to storage before being rejected.
    await requireAdmin();
    if (isBlobConfigured()) {
      return NextResponse.json(
        { error: "Videos upload directly to storage. Reload the page and try again." },
        { status: 410 }
      );
    }
    assertBodyWithin(request, MAX_VIDEO_BYTES + 1024 * 1024);

    const formData = await request.formData();
    const file = formData.get("file");
    const courseId = String(formData.get("courseId") ?? "");
    const parentId = formData.get("parentId") ? String(formData.get("parentId")) : undefined;
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "");
    // URL of an already-uploaded thumbnail image (via /api/admin/upload-image)
    const thumbnail = String(formData.get("thumbnail") ?? "") || undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (!courseId || !title.trim()) {
      return NextResponse.json({ error: "Missing course or title." }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: "Video is too large (max 1 GB)." }, { status: 400 });
    }

    const data = Buffer.from(await file.arrayBuffer());
    const { contentType } = validateUpload("video", file.name, data);

    // Strip any directory parts / odd characters from the client-supplied name.
    const safeName = path.basename(file.name).replace(/[^\w.-]+/g, "_");
    const videoUrl = await storeFile({
      publicDir: path.join(process.cwd(), "public"),
      pathname: `videos/${randomUUID()}-${safeName}`,
      data,
      contentType,
    });

    await createUploadedVideo({ courseId, parentId, title, description, videoUrl, thumbnail });

    return NextResponse.json({ videoUrl });
  } catch (err) {
    if (err instanceof AuthError || err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload-video]", err);
    return NextResponse.json({ error: "Failed to upload video." }, { status: 500 });
  }
}
