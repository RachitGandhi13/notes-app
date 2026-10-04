import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { AuthError, requireAdmin } from "@repo/auth";
import { storeFile } from "@repo/storage";
import { addSection, setSectionPPT } from "@/lib/track-actions";
import { HttpError, assertBodyWithin, assertSameOrigin } from "@/lib/security";
import { MAX_DOCUMENT_BYTES, validateUpload } from "@/lib/uploads";

// A plain multipart upload, not a server action — server actions carry a
// much smaller default body-size limit, which real PPT files (tens of MB)
// can exceed.
//
// Two modes, picked by which fields are present:
//   • `problemId` + `file`              → replace the presentation of a section
//   • `trackId` + `title` (+ `file`)    → create a section; the file is optional
//
// PDFs are accepted alongside PowerPoint: a PDF exported from the slides shows
// inside the page in every browser, with nothing to fetch from a third party.
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    // Checked before storeFile() runs — an admin check that only happened
    // inside the server actions would let an unauthenticated request still
    // write the file to storage before being rejected.
    await requireAdmin();
    assertBodyWithin(request, MAX_DOCUMENT_BYTES + 1024 * 1024);

    const formData = await request.formData();
    const file = formData.get("file");
    const problemId = String(formData.get("problemId") ?? "");
    const trackId = String(formData.get("trackId") ?? "");
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "");

    const replacing = !!problemId;
    if (replacing) {
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }
    } else if (!trackId || !title.trim()) {
      return NextResponse.json({ error: "Missing track or section title." }, { status: 400 });
    }

    let pptUrl: string | undefined;
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_DOCUMENT_BYTES) {
        return NextResponse.json({ error: "File is too large (max 100MB)." }, { status: 400 });
      }

      const data = Buffer.from(await file.arrayBuffer());
      const { contentType } = validateUpload("document", file.name, data);

      // Strip any directory parts / odd characters from the client-supplied name.
      const safeName = path.basename(file.name).replace(/[^\w.-]+/g, "_");
      pptUrl = await storeFile({
        publicDir: path.join(process.cwd(), "public"),
        pathname: `ppts/${randomUUID()}-${safeName}`,
        data,
        contentType,
      });
    }

    if (replacing) {
      await setSectionPPT(problemId, pptUrl ?? null);
      return NextResponse.json({ problemId, pptUrl });
    }

    const section = await addSection({ trackId, title, description, pptUrl });
    return NextResponse.json({ problemId: section.id, pptUrl });
  } catch (err) {
    if (err instanceof AuthError || err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload-ppt]", err);
    return NextResponse.json({ error: "Failed to save the section." }, { status: 500 });
  }
}
