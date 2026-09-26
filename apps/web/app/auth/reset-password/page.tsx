"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to reset password.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/auth"), 2000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!email || !token) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-destructive text-sm">
            This reset link is missing required information.
          </p>
          <Link href="/auth/forgot-password" className="mt-3 inline-block text-sm underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
          <p className="text-muted-foreground mt-1 text-sm">for {email}</p>
        </div>

        {success ? (
          <p className="rounded-md border bg-green-50 px-4 py-3 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Password updated. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-input bg-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
