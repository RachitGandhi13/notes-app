import { requireAuth, AuthError } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { cacheDel } from "@repo/cache";
import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }

    const valid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    const order = await prisma.paymentOrder.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "This order does not belong to you." }, { status: 403 });
    }

    if (order.status !== "PAID") {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: "PAID", razorpayPaymentId: razorpay_payment_id },
      });
      await prisma.userPurchases.upsert({
        where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
        update: {},
        create: { userId: order.userId, courseId: order.courseId },
      });
      await cacheDel(`purchases:${order.userId}`, "courses:all");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[razorpay/verify]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
