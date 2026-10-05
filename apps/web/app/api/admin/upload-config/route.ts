import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@repo/auth";
import { isBlobConfigured } from "@repo/storage";

export const dynamic = "force-dynamic";

// Tells the admin pages where files should go. When Blob is configured the browser uploads
// straight to Vercel Blob; otherwise it uses the local-disk routes, which work in development.
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ direct: isBlobConfigured() });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload-config]", err);
    return NextResponse.json({ error: "Failed to read upload settings." }, { status: 500 });
  }
}
