"use client";

import Link from "next/link";
import { useState } from "react";

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
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <p className="bg-card text-muted-foreground rounded-md border px-4 py-3 text-center text-sm">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          <Link href="/auth" className="text-muted-foreground hover:text-foreground underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
