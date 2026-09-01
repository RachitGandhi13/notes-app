"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { purchaseCourse } from "@/lib/actions";

interface PurchaseButtonProps {
  courseId: string;
  price: number;
  courseSlug: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PurchaseButton({ courseId, price, courseSlug }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handlePurchase() {
    setLoading(true);
    setError("");

    try {
      if (price === 0) {
        // Free course — enroll directly, no payment involved
        await purchaseCourse(courseId);
        router.refresh();
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Could not load the payment gateway. Check your connection and try again.");
        return;
      }

      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error ?? "Failed to start checkout.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Video Platform",
        description: orderData.courseName,
        order_id: orderData.orderId,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            router.push(`/courses/${courseSlug}?payment=success`);
            router.refresh();
          } else {
            router.push(`/courses/${courseSlug}?payment=cancelled`);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: "#0f172a" },
      });

      razorpay.on("payment.failed", () => {
        router.push(`/courses/${courseSlug}?payment=cancelled`);
      });

      razorpay.open();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="bg-primary text-primary-foreground w-full rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Processing…" : price === 0 ? "Enroll for Free" : `Purchase for ₹${price}`}
      </button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
