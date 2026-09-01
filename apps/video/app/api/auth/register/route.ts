import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db/client";
import { checkRateLimit } from "@repo/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Rate limit: max 5 registrations per IP per minute
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await hash(password, 10);

    await prisma.user.create({
      data: { name, email, password: hashed },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
