import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "@repo/db/client";
import type { PaymentOrder } from "@repo/db";
import { cacheDel } from "@repo/cache";

// Server-only. RAZORPAY_KEY_SECRET must never reach the browser: this module is
// imported only from route handlers and server code, never from client components.

export class RazorpayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RazorpayConfigError";
  }
}

/** The public key ID. Safe to return to the browser; the checkout needs it. */
export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new RazorpayConfigError("RAZORPAY_KEY_ID is not set.");
  return keyId;
}

function getKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new RazorpayConfigError("RAZORPAY_KEY_SECRET is not set.");
  return secret;
}

// Singleton: reused across requests in the same server process.
let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_client) {
    _client = new Razorpay({ key_id: getRazorpayKeyId(), key_secret: getKeySecret() });
  }
  return _client;
}

/** Constant-time check that `given` (hex) equals `expected` (hex). */
function hexEqualConstantTime(expected: string, given: string): boolean {
  const expectedBuf = Buffer.from(expected, "hex");
  const givenBuf = Buffer.from(given, "hex");
  // Lengths must match before timingSafeEqual, which throws otherwise. Invalid
  // hex decodes to a shorter buffer, so it fails here too.
  return expectedBuf.length === givenBuf.length && crypto.timingSafeEqual(expectedBuf, givenBuf);
}

/**
 * Verifies the signature Razorpay Checkout returns after a successful payment:
 * HMAC-SHA256 over "order_id|payment_id", keyed with RAZORPAY_KEY_SECRET.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac("sha256", getKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return hexEqualConstantTime(expected, signature);
}

/**
 * Verifies the X-Razorpay-Signature header on webhook requests: HMAC-SHA256 of
 * the raw body, keyed with the webhook secret set in the Razorpay dashboard.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new RazorpayConfigError("RAZORPAY_WEBHOOK_SECRET is not set.");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return hexEqualConstantTime(expected, signature);
}

/**
 * Grants access for a PAID order. Called by both /api/razorpay/verify and
 * /api/razorpay/webhook once each has independently confirmed the payment is
 * real (signature + amount), so this itself does no verification — it only
 * decides what a confirmed order unlocks.
 *
 * A course order upserts one UserPurchases row (unchanged from before combo
 * bundles existed). A track (combo) order upserts one UserPurchases row per
 * course the track bundles, in a single transaction, so a student can never
 * end up with some of a bundle's courses granted and others not.
 */
export async function grantOrderAccess(
  order: Pick<PaymentOrder, "userId" | "courseId" | "trackId">
): Promise<void> {
  if (order.courseId) {
    await prisma.userPurchases.upsert({
      where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
      update: {},
      create: { userId: order.userId, courseId: order.courseId },
    });
  } else if (order.trackId) {
    const links = await prisma.trackCourse.findMany({
      where: { trackId: order.trackId },
      select: { courseId: true },
    });
    await prisma.$transaction(
      links.map((link) =>
        prisma.userPurchases.upsert({
          where: { userId_courseId: { userId: order.userId, courseId: link.courseId } },
          update: {},
          create: { userId: order.userId, courseId: link.courseId },
        })
      )
    );
  }
  await cacheDel(`purchases:${order.userId}`, "courses:all");
}
