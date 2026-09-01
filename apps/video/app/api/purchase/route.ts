import { NextResponse } from "next/server";
import { purchaseCourse } from "@/lib/actions";
import { AuthError } from "@repo/auth";

// For free courses — paid courses will go through Stripe webhook in Phase 8
export async function POST(req: Request) {
  try {
    const { courseId } = await req.json();
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required." }, { status: 400 });
    }
    await purchaseCourse(courseId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[purchase]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
