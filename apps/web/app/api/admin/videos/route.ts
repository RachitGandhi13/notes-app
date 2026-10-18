import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { createUploadedVideo } from "@/lib/actions";
import { verifyBlobUpload, parseBlobUrl } from "@/lib/blob-check";
import { HttpError, assertSameOrigin } from "@/lib/security";

// Saves a video that the browser already uploaded straight to Vercel Blob (see
// /api/admin/blob-upload). Checks the file, then creates the course record.
//
// The browser retries this request when a gateway times out. A retry must not create a
// second course entry, so a video whose URL is already saved returns success without a new record.
export async function POST(request: Request) {
  const started = Date.now();
  try {
    assertSameOrigin(request);
    await requireAdmin();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw new HttpError(400, "Missing course or title.");
    }

    const courseId = String(body.courseId ?? "");
    const parentId = body.parentId ? String(body.parentId) : undefined;
    const title = String(body.title ?? "");
    const description = String(body.description ?? "");
    if (!courseId || !title.trim()) {
      throw new HttpError(400, "Missing course or title.");
    }

    const videoUrl = parseBlobUrl(body.videoUrl, "video");
    const thumbnail = body.thumbnail ? parseBlobUrl(body.thumbnail, "image") : undefined;

    const alreadySaved = await prisma.videoMetadata.findFirst({
      where: { videoUrl },
      select: { id: true },
    });
    if (alreadySaved) {
      return NextResponse.json({ videoUrl, duplicate: true });
    }

    // Checked before the record is created, so a file that isn't really a video never gets a
    // course entry.
    const checkedAt = Date.now();
    await verifyBlobUpload(videoUrl, "video");
    const verifiedMs = Date.now() - checkedAt;

    await createUploadedVideo({ courseId, parentId, title, description, videoUrl, thumbnail });

    console.info(`[admin/videos] saved in ${Date.now() - started}ms (byte check ${verifiedMs}ms)`);
    return NextResponse.json({ videoUrl });
  } catch (err) {
    if (err instanceof AuthError || err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/videos]", err);
    return NextResponse.json({ error: "Failed to save video." }, { status: 500 });
  }
}
