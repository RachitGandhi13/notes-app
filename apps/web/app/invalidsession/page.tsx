import Link from "next/link";

export default function InvalidSessionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
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
          className="hover:bg-accent rounded-md border px-4 py-2 text-sm font-medium transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/auth"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
