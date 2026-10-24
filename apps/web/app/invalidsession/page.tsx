import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

// A transient error state (expired session / no access), not content —
// kept out of search results like the other auth-flow pages.
export const metadata: Metadata = {
  title: "Access Denied",
  robots: { index: false, follow: false },
};

export default function InvalidSessionPage() {
  return (
    <AuthCard
      title="Access Denied"
      subtitle="You don't have access to this content. You may need to purchase the course, or your session may have expired."
      icon={
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
          <ShieldAlert className="h-6 w-6" />
        </span>
      }
    >
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-white/10 px-4 text-sm font-medium transition-colors hover:bg-white/[0.06]"
        >
          Go Home
        </Link>
        <Link
          href="/auth"
          className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-blue-600 px-4 text-sm font-medium text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98]"
        >
          Sign In
        </Link>
      </div>
    </AuthCard>
  );
}
