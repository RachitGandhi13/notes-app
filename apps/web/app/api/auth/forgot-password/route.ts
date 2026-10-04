import { NextResponse } from "next/server";
import { clientIp } from "@/lib/security";
import { requestPasswordReset, getAppUrl } from "@repo/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const ip = clientIp(req);
    const appUrl = getAppUrl();

    await requestPasswordReset(email, ip, appUrl);

    // Always succeed — never reveal whether an account exists for this email
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
