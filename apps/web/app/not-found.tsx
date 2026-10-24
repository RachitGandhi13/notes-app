import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { AscendButton, ThemedLogo } from "@repo/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-5 px-6 py-24 text-center">
      <ThemedLogo layout="mark" height={40} title="" />
      <p className="text-primary text-sm font-semibold uppercase tracking-wide">404</p>
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="text-muted-foreground max-w-sm leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <AscendButton asChild size="lg" glow icon={<ArrowRight className="h-4 w-4" />}>
          <Link href="/">Home</Link>
        </AscendButton>
        <AscendButton asChild variant="secondary" size="lg">
          <Link href="/#browse">
            <BookOpen className="h-4 w-4" />
            Browse courses
          </Link>
        </AscendButton>
      </div>
    </main>
  );
}
