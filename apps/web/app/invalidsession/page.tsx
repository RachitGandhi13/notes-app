import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function InvalidSessionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
        <ShieldAlert className="h-6 w-6" />
      </span>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You don&apos;t have access to this content. You may need to purchase the course, or your
          session may have expired.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="hover:bg-accent rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/auth"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98]"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
