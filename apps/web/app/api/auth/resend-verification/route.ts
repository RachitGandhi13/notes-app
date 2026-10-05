import { NextResponse } from "next/server";
import { getAppUrl, resendVerification } from "@repo/auth";
import { clientIp } from "@/lib/security";

// Sends a new verification link. The answer is the same whether or not the address has an
// account, so the endpoint can't be used to find out who has signed up. Rate limited per
// IP and per address (see packages/auth/src/verification.ts).
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.slice(0, 254) : "";

    const outcome = await resendVerification({ email, ip: clientIp(req), appUrl: getAppUrl() });
    if (outcome === "rate-limited") {
      return NextResponse.json(
        { error: "Too many requests. Wait a while before asking for another link." },
        { status: 429 }
      );
    }
    return NextResponse.json({
      success: true,
      message:
        "If that account is waiting for verification, a new link is on its way. Check your inbox and spam folder.",
    });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
