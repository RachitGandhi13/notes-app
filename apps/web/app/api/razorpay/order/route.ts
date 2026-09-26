import { requireAuth, AuthError } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required." }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }
    if (course.price <= 0) {
      return NextResponse.json(
        { error: "This course is free — use the enroll endpoint instead." },
        { status: 400 }
      );
    }

    const existing = await prisma.userPurchases.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already purchased." }, { status: 409 });
    }

    const amountInPaise = Math.round(course.price * 100);

    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `course_${course.id}_${Date.now()}`,
      notes: { userId: session.user.id, courseId: course.id },
    });

    await prisma.paymentOrder.create({
      data: {
        razorpayOrderId: order.id,
        userId: session.user.id,
        courseId: course.id,
        amount: course.price,
        status: "CREATED",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      courseName: course.title,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[razorpay/order]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
