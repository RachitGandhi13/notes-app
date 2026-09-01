import { NextResponse } from "next/server";
import { resetPassword, AuthActionError } from "@repo/auth";

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json();
    if (!email || !token || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await resetPassword(email, token, password);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
