import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { AuthError, requireAdmin } from "@repo/auth";
import { storeFile } from "@repo/storage";
import { createUploadedVideo } from "@/lib/actions";

// A plain multipart upload, not a server action — server actions carry a
// much smaller default body-size limit, which real lecture video files
// (potentially hundreds of MB) can exceed.
//
// Caveat: Vercel's own Serverless Functions cap the *request body* at
// ~4.5MB in production, independent of anything configurable here — this
// route works for any file size in local dev (no such cap on `next dev`),
// but a real multi-hundred-MB lecture recording will fail to upload once
// deployed to Vercel until this moves to Vercel Blob's client-side direct
// upload flow (browser uploads straight to storage, bypassing the function
// body entirely). See DEVELOPMENT.md.
export async function POST(request: Request) {
  try {
    // Checked here, before storeFile() runs — an admin check that only
    // happened inside createUploadedVideo() would let an unauthenticated
    // request still write the file to storage before being rejected.
    await requireAdmin();

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
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "File must be a video." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Strip any directory parts / odd characters from the client-supplied name.
    const safeName = path.basename(file.name).replace(/[^\w.-]+/g, "_");
    const pathname = `videos/${randomUUID()}-${safeName}`;
    const videoUrl = await storeFile({
      publicDir: path.join(process.cwd(), "public"),
      pathname,
      data: buffer,
      contentType: file.type,
    });

    await createUploadedVideo({ courseId, parentId, title, description, videoUrl, thumbnail });

    return NextResponse.json({ videoUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload-video]", err);
    return NextResponse.json({ error: "Failed to upload video." }, { status: 500 });
  }
}
