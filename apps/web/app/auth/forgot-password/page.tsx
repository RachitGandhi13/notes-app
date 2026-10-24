"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard, authButtonClass, authInputClass, authLabelClass } from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always show the same "check your email" state, regardless of outcome —
      // never reveal whether an account exists for this email.
      setSent(true);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {sent ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-400"
        >
          If an account exists for that email, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={authLabelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
            />
          </div>
          <button type="submit" disabled={submitting} className={authButtonClass}>
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="text-center text-sm">
        <Link
          href="/auth"
          className="text-[#0052CC] underline hover:text-[#0052CC]/80 dark:text-[#4D94FF] dark:hover:text-[#4D94FF]/80"
        >
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
