import { NextResponse } from "next/server";
import { toggleBookmark } from "@/lib/actions";
import { AuthError } from "@repo/auth";

export async function POST(req: Request) {
  try {
    const { contentId } = await req.json();
    if (!contentId) {
      return NextResponse.json({ error: "contentId is required." }, { status: 400 });
    }
    const bookmarked = await toggleBookmark(contentId);
    return NextResponse.json({ bookmarked });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[bookmark]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
