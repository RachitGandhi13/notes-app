import crypto from "crypto";
import { AuthError } from "@repo/auth";

/** An HTTP error with an explicit status, for failures that aren't auth errors. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Constant-time string comparison for secrets. Both sides are hashed first so
 * the comparison runs in the same time whatever the lengths are.
 */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb) && a.length === b.length;
}

/**
 * The client IP for rate limiting. `x-forwarded-for` is a comma-separated
 * chain: the leftmost entry is whatever the client sent, so trusting it lets an
 * attacker rotate the value on every request. The rightmost entry is the one
 * the load balancer in front of the app appended, so that is the one we use.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const hops = forwarded
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return hops[hops.length - 1] ?? "unknown";
}

/**
 * Blocks cross-site form posts to multipart endpoints. Browsers send an Origin
 * header on cross-origin POSTs; if it is present and does not match the site,
 * reject it. JSON endpoints don't need this (a cross-site form can't send
 * application/json), and session cookies are SameSite=Lax anyway.
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return;

  const allowed = new Set<string>();
  const appUrl = process.env.NEXTAUTH_URL;
  if (appUrl) {
    const site = new URL(appUrl);
    allowed.add(site.origin);
    // Accept the apex and www forms of the same site.
    const host = site.hostname.startsWith("www.") ? site.hostname.slice(4) : `www.${site.hostname}`;
    allowed.add(`${site.protocol}//${host}${site.port ? `:${site.port}` : ""}`);
  }

  if (!allowed.has(origin)) {
    throw new AuthError(403, "Cross-origin request blocked.");
  }
}

/** Rejects a request whose declared body is larger than `maxBytes`. */
export function assertBodyWithin(req: Request, maxBytes: number): void {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) {
    throw new HttpError(413, "File is too large.");
  }
}
