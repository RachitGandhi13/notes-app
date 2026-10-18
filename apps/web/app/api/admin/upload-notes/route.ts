import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { AuthError, requireAdmin } from "@repo/auth";
import { storeFile } from "@repo/storage";
import { setContentNotes } from "@/lib/actions";
import { HttpError, assertBodyWithin, assertSameOrigin } from "@/lib/security";
import { MAX_DOCUMENT_BYTES, validateUpload } from "@/lib/uploads";

// Notes (PDF/PPT/PPTX) attached to a video lesson. Always server-buffered, like
// /api/admin/upload-ppt — documents are capped at 100MB, well below where a direct-to-blob
// upload would matter.
//
// With `contentId` + `courseId`: attaches the file to that existing lesson directly (the
// "edit a lesson" path). Without them: just stores the file and returns its URL, so the
// create-lesson form can fold it straight into its own createUploadedVideo call instead of
// writing the database twice.
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    // Checked before storeFile() runs — an admin check that only happened inside
    // setContentNotes() would let an unauthenticated request still write the file to
    // storage before being rejected.
    await requireAdmin();
    assertBodyWithin(request, MAX_DOCUMENT_BYTES + 1024 * 1024);

    const formData = await request.formData();
    const file = formData.get("file");
    const contentId = formData.get("contentId") ? String(formData.get("contentId")) : undefined;
    const courseId = formData.get("courseId") ? String(formData.get("courseId")) : undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "File is too large (max 100MB)." }, { status: 400 });
    }
    if (contentId && !courseId) {
      return NextResponse.json({ error: "Missing course." }, { status: 400 });
    }

    const data = Buffer.from(await file.arrayBuffer());
    const { contentType } = validateUpload("document", file.name, data);

    // Strip any directory parts / odd characters from the client-supplied name.
    const safeName = path.basename(file.name).replace(/[^\w.-]+/g, "_");
    const notesUrl = await storeFile({
      publicDir: path.join(process.cwd(), "public"),
      pathname: `notes/${randomUUID()}-${safeName}`,
      data,
      contentType,
    });
    const notesTitle = path.basename(file.name);

    if (contentId && courseId) {
      await setContentNotes(contentId, courseId, notesUrl, notesTitle);
    }

    return NextResponse.json({ notesUrl, notesTitle });
  } catch (err) {
    if (err instanceof AuthError || err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload-notes]", err);
    return NextResponse.json({ error: "Failed to upload notes." }, { status: 500 });
  }
}
