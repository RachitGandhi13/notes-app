import { prisma } from "@repo/db/client";
import { cacheDel } from "@repo/cache";
import { NextResponse } from "next/server";
import { RazorpayConfigError, verifyWebhookSignature } from "@/lib/razorpay";

// Durability backstop for /api/razorpay/verify. If the browser closes before the
// Checkout success callback runs, Razorpay still delivers payment.captured here.
//
// Status codes:
//   400  missing or invalid signature, or a body that isn't JSON. Razorpay retries.
//   500  webhook secret not configured. Razorpay retries until it is fixed.
//   200  everything else, with a `status` field saying what happened. A 200 stops
//        retries, so orders we can't or shouldn't process aren't retried forever.
//
// Idempotent: a repeated delivery returns "already_granted" and changes nothing.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json(
      { status: "rejected", error: "Missing x-razorpay-signature header." },
      { status: 400 }
    );
  }

  let valid: boolean;
  try {
    valid = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    if (err instanceof RazorpayConfigError) {
      console.error("[razorpay/webhook] configuration:", err.message);
      return NextResponse.json(
        { status: "error", error: "Webhook is not configured." },
        { status: 500 }
      );
    }
    throw err;
  }
  if (!valid) {
    return NextResponse.json(
      { status: "rejected", error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  let event: { event?: string; payload?: { payment?: { entity?: Record<string, unknown> } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { status: "rejected", error: "Body is not valid JSON." },
      { status: 400 }
    );
  }

  if (event.event !== "payment.captured") {
    return NextResponse.json({ status: "ignored", event: event.event ?? null });
  }

  const payment = event.payload?.payment?.entity ?? {};
  const orderId = typeof payment.order_id === "string" ? payment.order_id : "";
  const paymentId = typeof payment.id === "string" ? payment.id : "";
  if (!orderId || !paymentId) {
    return NextResponse.json({ status: "ignored", reason: "payment has no order_id" });
  }

  const order = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId: orderId } });
  if (!order) {
    // Not one of our orders (or created in another environment). Don't retry.
    return NextResponse.json({ status: "unknown_order", orderId });
  }
  if (order.status === "PAID") {
    return NextResponse.json({ status: "already_granted", orderId });
  }

  // Grant access only when the captured amount matches what we charged.
  // The order stores rupees; Razorpay reports paise.
  const expectedPaise = Math.round(order.amount * 100);
  if (payment.amount !== expectedPaise || payment.currency !== "INR") {
    console.error("[razorpay/webhook] amount mismatch for order", orderId);
    return NextResponse.json({ status: "amount_mismatch", orderId });
  }

  await prisma.paymentOrder.update({
    where: { id: order.id },
    data: { status: "PAID", razorpayPaymentId: paymentId },
  });
  await prisma.userPurchases.upsert({
    where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
    update: {},
    create: { userId: order.userId, courseId: order.courseId },
  });
  await cacheDel(`purchases:${order.userId}`, "courses:all");

  return NextResponse.json({ status: "granted", orderId });
}
