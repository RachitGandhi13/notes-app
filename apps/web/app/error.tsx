"use client";

// Catches errors thrown while rendering a route. The real error is logged on the
// server by Next.js; the browser only gets a generic message and the digest.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">
        We hit an unexpected problem loading this page. Try again, and if it keeps happening,
        contact us.
      </p>
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">Reference: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
