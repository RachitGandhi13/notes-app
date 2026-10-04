import { AuthError, requireAuth } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { cacheDel } from "@repo/cache";
import { NextResponse } from "next/server";
import { RazorpayConfigError, verifyPaymentSignature } from "@/lib/razorpay";

// Called by the browser after Checkout reports success. The signature is what
// proves the payment happened; the success callback in the browser is not trusted.
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json().catch(() => null);

    const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }

    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    const order = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "This order does not belong to you." }, { status: 403 });
    }

    // Idempotent: the webhook may already have granted access for this order.
    if (order.status !== "PAID") {
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
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof RazorpayConfigError) {
      console.error("[razorpay/verify] configuration:", err.message);
      return NextResponse.json({ error: "Payments are not configured yet." }, { status: 500 });
    }
    console.error("[razorpay/verify]", err);
    return NextResponse.json({ error: "Could not confirm the payment." }, { status: 500 });
  }
}
