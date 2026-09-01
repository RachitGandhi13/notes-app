import { requireAdmin } from "@repo/auth";
import { NextResponse } from "next/server";
import { getNotionPageBlocks } from "@/lib/notion";

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { notionPageId } = await req.json();
    if (!notionPageId) {
      return NextResponse.json({ error: "notionPageId is required." }, { status: 400 });
    }

    const allBlocks = await getNotionPageBlocks(notionPageId);

    // Drop first and last blocks (boilerplate cover / footer per spec)
    const blocks =
      allBlocks.length > 2 ? allBlocks.slice(1, -1) : allBlocks;

    return NextResponse.json({ blocks });
  } catch (err) {
    console.error("[AddTracks]", err);
    return NextResponse.json(
      { error: "Failed to fetch Notion page. Check the page ID and try again." },
      { status: 500 }
    );
  }
}
