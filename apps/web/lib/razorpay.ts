import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "@repo/db/client";
import type { PaymentOrder } from "@repo/db";
import { cacheDel } from "@repo/cache";
import { getAppUrl, sendEnrollmentEmail } from "@repo/auth";

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
 * A course order grants one course (unchanged from before combo bundles
 * existed). A track (combo) order grants one course per course the track
 * bundles. Every grant is an upsert, so a retried webhook or a race between
 * /verify and the webhook can never end up with some courses granted and
 * others not, or double-grant anything.
 *
 * Enrollment emails go out only for courses the student didn't already own
 * before this call — otherwise that same retry/race would also double-email
 * them. Course titles/slugs and the student's email are only fetched when
 * there's actually something new to announce.
 */
export async function grantOrderAccess(
  order: Pick<PaymentOrder, "userId" | "courseId" | "trackId">
): Promise<void> {
  const courseIds = order.courseId
    ? [order.courseId]
    : order.trackId
      ? (
          await prisma.trackCourse.findMany({
            where: { trackId: order.trackId },
            select: { courseId: true },
          })
        ).map((link) => link.courseId)
      : [];
  if (courseIds.length === 0) return;

  const alreadyOwned = await prisma.userPurchases.findMany({
    where: { userId: order.userId, courseId: { in: courseIds } },
    select: { courseId: true },
  });
  const alreadyOwnedIds = new Set(alreadyOwned.map((p) => p.courseId));
  const newCourseIds = courseIds.filter((id) => !alreadyOwnedIds.has(id));

  await prisma.$transaction(
    courseIds.map((courseId) =>
      prisma.userPurchases.upsert({
        where: { userId_courseId: { userId: order.userId, courseId } },
        update: {},
        create: { userId: order.userId, courseId },
      })
    )
  );
  await cacheDel(`purchases:${order.userId}`, "courses:all");

  if (newCourseIds.length > 0) {
    const [user, courses] = await Promise.all([
      prisma.user.findUnique({ where: { id: order.userId }, select: { email: true, name: true } }),
      prisma.course.findMany({
        where: { id: { in: newCourseIds } },
        select: { title: true, slug: true },
      }),
    ]);
    if (user?.email) {
      const appUrl = getAppUrl();
      for (const course of courses) {
        try {
          await sendEnrollmentEmail({
            email: user.email,
            name: user.name ?? "there",
            courseTitle: course.title,
            courseSlug: course.slug,
            appUrl,
          });
        } catch (err) {
          // Access is already granted above — an email failure must never undo or
          // appear to undo a real payment.
          console.error(
            "[email] Enrollment email failed:",
            err instanceof Error ? err.message : err
          );
        }
      }
    }
  }
}
