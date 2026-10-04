import { AuthError, checkRateLimit, requireAuth } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { NextResponse } from "next/server";
import { getRazorpay, getRazorpayKeyId, RazorpayConfigError } from "@/lib/razorpay";

// Creates a Razorpay order for a paid course.
//
// The client sends only the course ID. Any amount it sends is ignored: the price
// is read from the database, so a tampered request can't change what is charged.
export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    if (!checkRateLimit(`razorpay-order:${session.user.id}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many attempts. Wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const courseId = typeof body?.courseId === "string" ? body.courseId : "";
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required." }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.hidden) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }
    if (course.price <= 0) {
      return NextResponse.json(
        { error: "This course is free. Enroll directly instead." },
        { status: 400 }
      );
    }

    const existing = await prisma.userPurchases.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });
    if (existing) {
      return NextResponse.json({ error: "You already own this course." }, { status: 409 });
    }

    // Razorpay takes amounts in paise (the smallest INR unit).
    const amountInPaise = Math.round(course.price * 100);

    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `course_${course.id}_${Date.now()}`,
      notes: { userId: session.user.id, courseId: course.id, courseTitle: course.title },
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
      keyId: getRazorpayKeyId(),
      courseName: course.title,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof RazorpayConfigError) {
      console.error("[razorpay/order] configuration:", err.message);
      return NextResponse.json({ error: "Payments are not configured yet." }, { status: 500 });
    }
    console.error("[razorpay/order]", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
