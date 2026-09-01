import { prisma } from "@repo/db/client";
import { cacheDel } from "@repo/cache";
import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Durability backstop for /api/razorpay/verify — in case the client tab
// closes before the Checkout success handler fires. Idempotent: safe to run
// even if /verify already granted access for this order.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing x-razorpay-signature header." }, { status: 400 });
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const razorpayPaymentId = payment?.id;

    if (razorpayOrderId) {
      const order = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId } });
      if (order && order.status !== "PAID") {
        await prisma.paymentOrder.update({
          where: { id: order.id },
          data: { status: "PAID", razorpayPaymentId },
        });
        await prisma.userPurchases.upsert({
          where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
          update: {},
          create: { userId: order.userId, courseId: order.courseId },
        });
        await cacheDel(`purchases:${order.userId}`, "courses:all");
      }
    }
  }

  return NextResponse.json({ received: true });
}
