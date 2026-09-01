import { requireAuth } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(request: Request) {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, courseSlug } = await request.json();
  if (!courseId || !courseSlug) {
    return NextResponse.json({ error: "Missing courseId or courseSlug" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Already purchased
  const existing = await prisma.userPurchases.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already purchased" }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(course.price * 100), // cents
          product_data: {
            name: course.title,
            description: course.description ?? undefined,
            images: course.imageUrl ? [course.imageUrl] : [],
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      courseId: course.id,
    },
    success_url: `${appUrl}/courses/${courseSlug}?payment=success`,
    cancel_url: `${appUrl}/courses/${courseSlug}?payment=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
