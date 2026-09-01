"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { purchaseCourse } from "@/lib/actions";

interface PurchaseButtonProps {
  courseId: string;
  price: number;
  courseSlug: string;
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
        // Free course — enroll directly without Stripe
        await purchaseCourse(courseId);
        router.refresh();
        return;
      }

      // Paid course — create Stripe Checkout session and redirect
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, courseSlug }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start checkout.");
        return;
      }

      window.location.href = data.url;
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
        className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? "Processing…"
          : price === 0
          ? "Enroll for Free"
          : `Purchase for $${price}`}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
