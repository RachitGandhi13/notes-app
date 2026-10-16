import { randomBytes } from "crypto";
import { AuthError, checkRateLimit, requireAuth } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { NextResponse } from "next/server";
import { getRazorpay, getRazorpayKeyId, RazorpayConfigError } from "@/lib/razorpay";

// Razorpay rejects a receipt longer than 40 characters. A course ID is a 36-character UUID,
// so the old "course_<id>_<timestamp>" receipt (57 characters) failed on every purchase.
// The receipt is only a reference for our records, so a short random value is enough.
function makeReceipt(): string {
  return `rcpt_${randomBytes(12).toString("hex")}`;
}

// Creates a Razorpay order for a paid course, or a paid combo bundle (a Track
// with linked courses and its own bundlePrice).
//
// The client sends a courseId or a trackId — never both, never an amount: the
// price is always read from the database, so a tampered request can't change
// what is charged.
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
    const trackId = typeof body?.trackId === "string" ? body.trackId : "";
    if (!courseId && !trackId) {
      return NextResponse.json({ error: "courseId or trackId is required." }, { status: 400 });
    }
    if (courseId && trackId) {
      return NextResponse.json({ error: "Send only one of courseId or trackId." }, { status: 400 });
    }

    let price: number;
    let name: string;

    if (courseId) {
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
      price = course.price;
      name = course.title;
    } else {
      const track = await prisma.track.findUnique({
        where: { id: trackId },
        include: { courses: { select: { courseId: true } } },
      });
      if (!track || track.hidden) {
        return NextResponse.json({ error: "Track not found." }, { status: 404 });
      }
      if (track.courses.length === 0 || !track.bundlePrice || track.bundlePrice <= 0) {
        return NextResponse.json(
          { error: "This track isn't a purchasable combo." },
          { status: 400 }
        );
      }
      // Owning any one of the bundle's courses already unlocks the track — see
      // hasTrackAccess() in lib/track-actions.ts, the same rule applied here.
      const owned = await prisma.userPurchases.findFirst({
        where: {
          userId: session.user.id,
          courseId: { in: track.courses.map((c) => c.courseId) },
        },
      });
      if (owned) {
        return NextResponse.json({ error: "You already own this bundle." }, { status: 409 });
      }
      price = track.bundlePrice;
      name = track.title;
    }

    // Razorpay takes amounts in paise (the smallest INR unit). It rejects amounts under 100
    // paise (INR 1), so a price such as 0.50 would fail at Razorpay with no explanation.
    const amountInPaise = Math.round(price * 100);
    if (amountInPaise < 100) {
      console.error(
        `[razorpay/order] ${courseId ? "course" : "track"} ${courseId || trackId} price ${price} is below INR 1`
      );
      return NextResponse.json(
        { error: "This price is too low to take online payment." },
        { status: 400 }
      );
    }

    // Razorpay limits each note value to 256 characters.
    const notes: Record<string, string> = courseId
      ? { userId: session.user.id, courseId, title: name.slice(0, 200) }
      : { userId: session.user.id, trackId, title: name.slice(0, 200) };

    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: makeReceipt(),
      notes,
    });

    await prisma.paymentOrder.create({
      data: {
        razorpayOrderId: order.id,
        userId: session.user.id,
        courseId: courseId || null,
        trackId: trackId || null,
        amount: price,
        status: "CREATED",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: getRazorpayKeyId(),
      courseName: name,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof RazorpayConfigError) {
      console.error("[razorpay/order] configuration:", err.message);
      return NextResponse.json({ error: "Payments are not configured yet." }, { status: 500 });
    }
    // Razorpay's SDK rejects with its own error object: an HTTP status and a description such as
    // "The api key provided is invalid". Log those so the cause shows in the server logs.
    // The key secret is never logged.
    const razorpayErr = err as {
      statusCode?: number;
      error?: { code?: string; description?: string };
    };
    if (razorpayErr?.error?.description) {
      console.error(
        "[razorpay/order] Razorpay rejected the order:",
        razorpayErr.statusCode,
        razorpayErr.error.code,
        razorpayErr.error.description
      );
    } else {
      console.error("[razorpay/order] unexpected error:", err);
    }
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
