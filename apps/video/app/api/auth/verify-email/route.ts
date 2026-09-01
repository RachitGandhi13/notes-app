import { NextResponse } from "next/server";
import { prisma } from "@repo/db/client";
import { consumeVerificationToken } from "@repo/auth";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return NextResponse.redirect(new URL("/auth?error=InvalidVerification", origin));
  }

  const valid = await consumeVerificationToken(email, token);
  if (!valid) {
    return NextResponse.redirect(new URL("/auth?error=InvalidVerification", origin));
  }

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return NextResponse.redirect(new URL("/auth?verified=1", origin));
}
