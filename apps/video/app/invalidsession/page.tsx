import Link from "next/link";

export default function InvalidSessionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You don&apos;t have access to this content. You may need to purchase
          the course, or your session may have expired.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          Go Home
        </Link>
        <Link
          href="/auth"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
