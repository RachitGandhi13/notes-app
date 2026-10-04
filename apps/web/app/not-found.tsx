import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="text-primary text-sm font-semibold">404</p>
      <h1 className="text-3xl font-extrabold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="flex gap-3 pt-2">
        <Link
          href="/"
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 font-semibold"
        >
          Home
        </Link>
        <Link href="/notes" className="hover:bg-accent rounded-lg border px-5 py-2.5 font-semibold">
          Notes
        </Link>
      </div>
    </div>
  );
}
