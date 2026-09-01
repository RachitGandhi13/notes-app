import { NextResponse } from "next/server";
import { requestPasswordReset } from "@repo/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

    await requestPasswordReset(email, ip, appUrl);

    // Always succeed — never reveal whether an account exists for this email
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
