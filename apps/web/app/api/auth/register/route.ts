import { NextResponse } from "next/server";
import { clientIp } from "@/lib/security";
import { registerUser, AuthActionError, getAppUrl } from "@repo/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    const ip = clientIp(req);
    const appUrl = getAppUrl();

    await registerUser({ name, email, password, ip, appUrl });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
