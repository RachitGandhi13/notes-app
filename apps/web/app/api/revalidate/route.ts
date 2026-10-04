import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/security";

// Webhook-style ISR revalidation.
// Call: POST /api/revalidate?path=/  with header  Authorization: Bearer <REVALIDATE_SECRET>
// The secret is read from the header, not the URL, so it stays out of access logs.
export async function POST(req: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !safeEqual(provided, expected)) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "/";
  // Only same-site paths: a leading "/" but not "//", which browsers read as a host.
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return NextResponse.json({ error: "path must be a site-relative path." }, { status: 400 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
