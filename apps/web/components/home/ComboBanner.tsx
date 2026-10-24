"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Flame } from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui";
import { PurchaseButton } from "@/components/PurchaseButton";

interface ComboCourse {
  id: string;
  slug: string;
  title: string;
  price: number;
}

interface ComboBundle {
  id: string;
  title: string;
  bundlePrice: number;
  courses: ComboCourse[];
}

interface ComboBannerProps {
  bundles: ComboBundle[];
  /** null when signed out — each bundle card shows a sign-in link instead of a buy button. */
  prefill: { name?: string | null; email?: string | null } | null;
}

// A small, attention-grabbing entry point next to "Explore our courses" — not
// a standalone hero section — that opens every active combo bundle (Track +
// TrackCourse + bundlePrice, the same data TrackBundlePanel/setTrackBundle
// already manage) as cards in one modal. No new purchase logic: each card
// ends in the existing <PurchaseButton kind="track" .../>, exactly the same
// button TrackPaywall already uses on a track's own paywall page.
export function ComboBanner({ bundles, prefill }: ComboBannerProps) {
  const [open, setOpen] = useState(false);

  if (bundles.length === 0) return null;

  return (
    <>
      <div className="mb-8 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex items-center gap-2 rounded-full p-[1.5px] transition-transform hover:scale-[1.02] active:scale-[0.99] dark:[background:linear-gradient(90deg,#0066FF,#00F0FF,#B4A7FF)]"
        >
          <span className="bg-background flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-sm font-semibold text-orange-500 dark:border-0 dark:bg-[#111113] dark:text-[#FAFAFA]">
            <span
              aria-hidden="true"
              className="hidden h-2 w-2 rounded-full dark:block"
              style={{ backgroundColor: "#00F0FF", boxShadow: "0 0 8px #00F0FF" }}
            />
            <Flame className="h-4 w-4 dark:hidden" />
            Get Special Combo Deal
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <h3 className="text-lg font-semibold">Combo bundles</h3>
          <p className="text-muted-foreground text-sm">
            One payment unlocks every course below, and the notes track that comes with each one.
          </p>

          <div className="max-h-[65vh] space-y-5 overflow-y-auto">
            {bundles.map((bundle) => {
              const originalTotal = bundle.courses.reduce((sum, c) => sum + c.price, 0);
              const savings = originalTotal - bundle.bundlePrice;
              return (
                <div
                  key={bundle.id}
                  className="bg-muted space-y-3 rounded-[20px] border p-4 dark:border-white/10 dark:bg-[#161618]"
                >
                  <h4 className="font-semibold">{bundle.title}</h4>
                  <ul className="space-y-1.5">
                    {bundle.courses.map((course) => (
                      <li key={course.id} className="flex items-center gap-2 text-sm">
                        <BadgeCheck className="text-primary h-4 w-4 shrink-0" />
                        <Link href={`/courses/${course.slug}`} className="hover:underline">
                          {course.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">₹{bundle.bundlePrice}</span>
                    {savings > 0 && (
                      <>
                        <span className="text-muted-foreground text-sm line-through">
                          ₹{originalTotal}
                        </span>
                        <span className="text-primary text-sm font-semibold">Save ₹{savings}</span>
                      </>
                    )}
                  </div>
                  {prefill ? (
                    <PurchaseButton
                      kind="track"
                      id={bundle.id}
                      price={bundle.bundlePrice}
                      label={`Enroll in combo for ₹${bundle.bundlePrice}`}
                      prefill={prefill}
                    />
                  ) : (
                    <Link
                      href="/auth"
                      className="bg-primary text-primary-foreground block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-opacity hover:opacity-90"
                    >
                      Sign in to buy the combo
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
