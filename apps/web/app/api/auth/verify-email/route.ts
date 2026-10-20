import { NextResponse } from "next/server";
import { prisma } from "@repo/db/client";
import { consumeVerificationToken, getAppUrl } from "@repo/auth";

// Never redirect off req.url's own origin here: behind the Lightsail load
// balancer that can carry the container's internal address rather than the
// public domain (the same class of bug worked around in middleware.ts for
// the apex->www redirect), which sent verification links to a host no
// browser can resolve. getAppUrl() is the one source of truth already used
// to build the link this route receives in the first place.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const appUrl = getAppUrl();

  if (!email || !token) {
    return NextResponse.redirect(new URL("/auth?error=InvalidVerification", appUrl));
  }

  const valid = await consumeVerificationToken(email, token);
  if (!valid) {
    return NextResponse.redirect(new URL("/auth?error=InvalidVerification", appUrl));
  }

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return NextResponse.redirect(new URL("/auth?verified=1", appUrl));
}
