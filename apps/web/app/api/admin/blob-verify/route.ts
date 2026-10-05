import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@repo/auth";
import { verifyBlobUpload, parseBlobUrl } from "@/lib/blob-check";
import { HttpError, assertSameOrigin } from "@/lib/security";
import { type MediaKind } from "@/lib/upload-types";

// Called after a direct upload of an image (a thumbnail). Confirms the bytes match the file
// type, and deletes the file if they don't. Videos are checked when they are saved (see
// /api/admin/videos).
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAdmin();

    const body = await request.json().catch(() => null);
    if (body?.kind !== "image" && body?.kind !== "video") {
      throw new HttpError(400, "Unknown upload type.");
    }
    const kind: MediaKind = body.kind;
    const url = parseBlobUrl(body.url, kind);
    await verifyBlobUpload(url, kind);

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AuthError || err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[blob-verify]", err);
    return NextResponse.json({ error: "Failed to check the uploaded file." }, { status: 500 });
  }
}
