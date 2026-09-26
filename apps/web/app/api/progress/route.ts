import { NextResponse } from "next/server";
import { markProgress } from "@/lib/actions";
import { AuthError } from "@repo/auth";

export async function POST(req: Request) {
  try {
    const { contentId, markAsRead } = await req.json();
    if (!contentId) {
      return NextResponse.json({ error: "contentId is required." }, { status: 400 });
    }
    await markProgress(contentId, Boolean(markAsRead));
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[progress]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
