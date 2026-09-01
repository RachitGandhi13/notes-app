import { NextResponse } from "next/server";
import { registerUser, AuthActionError } from "@repo/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

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
