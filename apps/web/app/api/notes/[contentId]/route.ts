import { NextResponse } from "next/server";
import { getSession } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { userCanAccessContent } from "@/lib/access";

interface Params {
  params: { contentId: string };
}

// Serves a lesson's PDF from Bunny Storage without ever exposing a direct Bunny URL to the
// browser. Routed by contentId, not a raw Bunny file path — the path actually fetched always
// comes from our own database, never from the request, so a signed-in-but-not-enrolled user
// can't probe this route with a different path to reach another course's file.
//
// 401 for signed-out requests; 404 for everything else that doesn't resolve to a servable
// PDF (unknown content, no PDF attached, not enrolled) — the same "don't reveal whether it
// exists" shape getContent() already uses for the rest of this app's paid content.
export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to view this file." }, { status: 401 });
  }

  if (!(await userCanAccessContent(params.contentId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const content = await prisma.content.findUnique({
    where: { id: params.contentId },
    select: { videoMetadata: { select: { bunnyPdfPath: true } } },
  });
  const bunnyPdfPath = content?.videoMetadata?.bunnyPdfPath;
  if (!bunnyPdfPath) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const baseUrl = process.env.BUNNY_STORAGE_BASE_URL;
  // Read-only key, not the full-access one — this route only ever reads a file, so it
  // should never hold a key that could also write or delete from the storage zone.
  const apiKey = process.env.BUNNY_STORAGE_READ_ONLY_KEY;
  if (!baseUrl || !apiKey) {
    console.error("[notes] BUNNY_STORAGE_BASE_URL or BUNNY_STORAGE_READ_ONLY_KEY is not set.");
    return NextResponse.json({ error: "Notes storage is not configured." }, { status: 500 });
  }

  try {
    const upstream = await fetch(`${baseUrl}/${bunnyPdfPath}`, {
      headers: { AccessKey: apiKey },
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("[notes] Failed to fetch from Bunny Storage:", err);
    return NextResponse.json({ error: "Failed to load the file." }, { status: 500 });
  }
}
