import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The app resolves identically on the apex and www hosts, but NextAuth's OAuth
// state/PKCE cookies are host-scoped. NEXTAUTH_URL is the www host, so Google
// always redirects back to www — a sign-in started on the apex domain sets its
// cookie there, the callback lands on www without it, and NextAuth throws
// "State cookie was missing." Forcing one canonical host before any cookie is
// set removes the mismatch.
const APEX_HOST = "cloudvidyaacademy.com";
const CANONICAL_HOST = "www.cloudvidyaacademy.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase();
  if (host === APEX_HOST) {
    // Built as a plain string, not via request.nextUrl.clone() — the container
    // listens on :3000 behind the Lightsail load balancer, and NextURL carries
    // that internal port along even after overwriting .host, which previously
    // sent real visitors to a port nothing public can reach.
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`https://${CANONICAL_HOST}${pathname}${search}`, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
