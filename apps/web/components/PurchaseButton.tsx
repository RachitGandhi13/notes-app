"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { purchaseCourse } from "@/lib/actions";

// NEXT_PUBLIC_RAZORPAY_KEY_ID is inlined into the bundle at build time. It is the
// public key ID only; the secret never reaches this file.
const PUBLIC_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const BUSINESS_NAME = "Cloud Vidya Academy";

interface PurchaseButtonProps {
  courseId: string;
  price: number;
  courseSlug: string;
  prefill?: { name?: string | null; email?: string | null };
}

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailure {
  error?: { description?: string };
}

interface RazorpayCheckout {
  open(): void;
  on(event: "payment.failed", handler: (failure: RazorpayFailure) => void): void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckout;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

// One shared load, so two buttons (or a double click) never inject two scripts.
let scriptPromise: Promise<boolean> | null = null;

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        script.remove();
        scriptPromise = null; // allow a retry on the next click
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

type Stage = "idle" | "creating" | "paying" | "confirming";

const STAGE_LABEL: Record<Exclude<Stage, "idle">, string> = {
  creating: "Preparing checkout…",
  paying: "Waiting for payment…",
  confirming: "Confirming payment…",
};

export function PurchaseButton({ courseId, price, courseSlug, prefill }: PurchaseButtonProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  // State updates are async, so a ref is what actually blocks a double click.
  const inFlight = useRef(false);

  function begin(next: Stage) {
    inFlight.current = true;
    setError("");
    setStage(next);
  }

  function fail(message: string) {
    inFlight.current = false;
    setError(message);
    setStage("idle");
  }

  function release() {
    inFlight.current = false;
    setStage("idle");
  }

  async function enrollFree() {
    begin("creating");
    try {
      await purchaseCourse(courseId);
      router.refresh();
    } catch {
      // Production builds hide the server's message, so use our own wording.
      fail("Could not enroll in this course. Please try again.");
    }
  }

  async function confirmPayment(response: RazorpaySuccess) {
    setStage("confirming");
    try {
      const res = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fail(
          `We could not confirm your payment (${data.error ?? "unknown error"}). ` +
            `If money was debited, access is granted automatically once Razorpay confirms it. ` +
            `Contact support with payment ID ${response.razorpay_payment_id} if it does not appear shortly.`
        );
        return;
      }
      inFlight.current = false;
      router.replace(`/courses/${courseSlug}?payment=success`);
      router.refresh();
    } catch {
      fail(
        `Network error while confirming your payment. Refresh the page; if the course does not ` +
          `appear, contact support with payment ID ${response.razorpay_payment_id}.`
      );
    }
  }

  async function startCheckout() {
    if (!PUBLIC_KEY_ID) {
      setError("Online payments are not configured. Please contact support.");
      return;
    }
    begin("creating");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      fail("Could not load the payment gateway. Check your connection and try again.");
      return;
    }

    let order: {
      error?: string;
      keyId?: string;
      orderId?: string;
      amount?: number;
      currency?: string;
      courseName?: string;
    };
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      order = await res.json().catch(() => ({}));
      if (!res.ok) {
        fail(order.error ?? "Could not start checkout. Please try again.");
        return;
      }
    } catch {
      fail("Network error. Please try again.");
      return;
    }

    // The order was created with the server's key. Opening checkout with a
    // different key would fail at Razorpay, so stop here with a clear message.
    if (order.keyId !== PUBLIC_KEY_ID) {
      console.error("[checkout] NEXT_PUBLIC_RAZORPAY_KEY_ID does not match the server key");
      fail("Payment configuration mismatch. Please contact support.");
      return;
    }

    if (!window.Razorpay) {
      fail("Could not load the payment gateway. Please refresh and try again.");
      return;
    }

    const checkout = new window.Razorpay({
      key: PUBLIC_KEY_ID,
      amount: order.amount, // paise, computed on the server
      currency: order.currency,
      name: BUSINESS_NAME,
      description: order.courseName,
      order_id: order.orderId,
      prefill: {
        name: prefill?.name ?? undefined,
        email: prefill?.email ?? undefined,
      },
      theme: { color: "#0f172a" },
      handler: (response: RazorpaySuccess) => {
        void confirmPayment(response);
      },
      modal: {
        // Closing the modal (or pressing Esc) ends the attempt, so the button is usable again.
        ondismiss: () => release(),
      },
    });

    checkout.on("payment.failed", (failure) => {
      // Razorpay keeps its modal open for a retry, so the button stays locked
      // until the modal is dismissed. The message is shown underneath.
      setError(failure.error?.description ?? "Payment failed. Please try again.");
    });

    setStage("paying");
    checkout.open();
  }

  function handleClick() {
    if (inFlight.current) return;
    if (price === 0) void enrollFree();
    else void startCheckout();
  }

  const loading = stage !== "idle";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className="bg-primary text-primary-foreground w-full rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? STAGE_LABEL[stage] : price === 0 ? "Enroll for Free" : `Purchase for ₹${price}`}
      </button>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
