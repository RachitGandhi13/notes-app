import { Lock } from "lucide-react";
import Link from "next/link";

interface TrackPaywallProps {
  trackTitle: string;
  course: { slug: string; price: number; title: string };
}

export function TrackPaywall({ trackTitle, course }: TrackPaywallProps) {
  const videoAppUrl = process.env.NEXT_PUBLIC_VIDEO_APP_URL ?? "http://localhost:3001";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <Lock className="text-muted-foreground h-6 w-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold">
          {trackTitle} is bundled with &quot;{course.title}&quot;
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This track unlocks automatically once you purchase the <strong>{course.title}</strong>{" "}
          video course
          {course.price > 0 ? ` for ₹${course.price}` : ""} — same payment, both apps.
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href={`${videoAppUrl}/courses/${course.slug}`}
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          View course to purchase
        </a>
        <Link
          href="/auth"
          className="hover:bg-accent rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
