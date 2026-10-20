import { NextResponse } from "next/server";
import { getSession } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { userCanAccessContent, userCanAccessProblem } from "@/lib/access";

interface Params {
  params: { contentId: string };
}

// Serves a course lesson/section's attached file, or a track section's slide/image, from
// Bunny Storage — without ever exposing a direct Bunny URL to the browser. Routed by an id,
// not a raw Bunny file path — the path actually fetched always comes from our own database,
// never from the request, so a signed-in-but-not-enrolled user can't probe this route with a
// different path to reach another course's file.
//
// The id space covers two different owning rows (Content for course materials, Problem for
// track sections) since both are served identically; whichever one the id resolves to
// decides which access check and which stored path apply.
//
// 401 for signed-out requests; 404 for everything else that doesn't resolve to a servable
// file (unknown id, nothing attached, not enrolled) — the same "don't reveal whether it
// exists" shape getContent() already uses for the rest of this app's paid content.
const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to view this file." }, { status: 401 });
  }

  const id = params.contentId;
  let bunnyPath: string | null;

  const content = await prisma.content.findUnique({
    where: { id },
    select: { materialPath: true, videoMetadata: { select: { bunnyPdfPath: true } } },
  });
  if (content) {
    if (!(await userCanAccessContent(id))) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    // A video lesson's material lives on VideoMetadata; a section (FOLDER) has no
    // VideoMetadata row, so its material is on Content.materialPath instead.
    bunnyPath = content.videoMetadata?.bunnyPdfPath || content.materialPath;
  } else {
    const problem = await prisma.problem.findUnique({ where: { id }, select: { pptUrl: true } });
    if (!problem) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (!(await userCanAccessProblem(id))) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    bunnyPath = problem.pptUrl;
  }

  if (!bunnyPath) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    // A handful of sections still hold a full URL from before track sections moved to
    // Bunny paths (the old upload flow stored a public Vercel Blob URL directly) —
    // fetched as-is, with no AccessKey header, rather than treated as a Bunny path.
    const isLegacyUrl = bunnyPath.startsWith("http://") || bunnyPath.startsWith("https://");

    let upstream: Response;
    if (isLegacyUrl) {
      upstream = await fetch(bunnyPath);
    } else {
      const baseUrl = process.env.BUNNY_STORAGE_BASE_URL;
      // Read-only key, not the full-access one — this route only ever reads a file, so it
      // should never hold a key that could also write or delete from the storage zone.
      const apiKey = process.env.BUNNY_STORAGE_READ_ONLY_KEY;
      if (!baseUrl || !apiKey) {
        console.error("[notes] BUNNY_STORAGE_BASE_URL or BUNNY_STORAGE_READ_ONLY_KEY is not set.");
        return NextResponse.json({ error: "Notes storage is not configured." }, { status: 500 });
      }
      upstream = await fetch(`${baseUrl}/${bunnyPath}`, { headers: { AccessKey: apiKey } });
    }

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const ext = bunnyPath.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("[notes] Failed to fetch the file:", err);
    return NextResponse.json({ error: "Failed to load the file." }, { status: 500 });
  }
}
