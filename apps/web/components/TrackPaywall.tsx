import { BadgeCheck, Lock } from "lucide-react";
import Link from "next/link";
import { PurchaseButton } from "@/components/PurchaseButton";

interface TrackPaywallProps {
  trackId: string;
  trackTitle: string;
  courses: { slug: string; price: number; title: string }[];
  bundlePrice: number;
  /** null when signed out — shows a sign-in link instead of the purchase button. */
  prefill: { name?: string | null; email?: string | null } | null;
}

export function TrackPaywall({
  trackId,
  trackTitle,
  courses,
  bundlePrice,
  prefill,
}: TrackPaywallProps) {
  const originalTotal = courses.reduce((sum, c) => sum + c.price, 0);
  const savings = originalTotal - bundlePrice;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <Lock className="text-muted-foreground h-6 w-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold">{trackTitle} is part of a combo</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This track unlocks automatically once you own any one of the courses below. One combo
          payment unlocks all of them.
        </p>
      </div>

      <ul className="w-full space-y-2 text-left">
        {courses.map((course) => (
          <li
            key={course.slug}
            className="bg-card flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <BadgeCheck className="text-primary h-4 w-4 shrink-0" />
              {course.title}
            </span>
            <Link href={`/courses/${course.slug}`} className="text-primary text-xs hover:underline">
              View course
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">₹{bundlePrice}</span>
        {savings > 0 && (
          <>
            <span className="text-muted-foreground text-sm line-through">₹{originalTotal}</span>
            <span className="text-primary text-sm font-semibold">Save ₹{savings}</span>
          </>
        )}
      </div>

      {prefill ? (
        <div className="w-full max-w-xs">
          <PurchaseButton
            kind="track"
            id={trackId}
            price={bundlePrice}
            label={`Buy combo for ₹${bundlePrice}`}
            prefill={prefill}
          />
        </div>
      ) : (
        <Link
          href="/auth"
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          Sign in to buy the combo
        </Link>
      )}
    </div>
  );
}
