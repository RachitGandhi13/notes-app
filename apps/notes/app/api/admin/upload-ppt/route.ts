import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { AuthError, requireAdmin } from "@repo/auth";
import { storeFile } from "@repo/storage";
import { addPPTLesson } from "@/lib/actions";

// A plain multipart upload, not a server action — server actions carry a
// much smaller default body-size limit, which real PPT files (tens of MB)
// can exceed.
export async function POST(request: Request) {
  try {
    // Checked here, before storeFile() runs — an admin check that only
    // happened inside addPPTLesson() would let an unauthenticated request
    // still write the file to storage before being rejected.
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    const trackId = String(formData.get("trackId") ?? "");
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (!trackId || !title.trim() || !description.trim()) {
      return NextResponse.json({ error: "Missing track, title, or description." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pathname = `ppts/${randomUUID()}-${file.name}`;
    const pptUrl = await storeFile({
      publicDir: path.join(process.cwd(), "public"),
      pathname,
      data: buffer,
      contentType: file.type || "application/octet-stream",
    });

    await addPPTLesson({ trackId, title, description, pptUrl });

    return NextResponse.json({ pptUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload-ppt]", err);
    return NextResponse.json({ error: "Failed to upload PPT." }, { status: 500 });
  }
}
