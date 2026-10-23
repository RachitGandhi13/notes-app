import { cn } from "@repo/ui";

// A bolder, more saturated radial glow swept in from the top of a hero,
// layered behind AnimatedBackdrop's grid + small blobs rather than replacing
// them. Same dramatic "glow behind the headline" move as the gradient-hero
// references the client pointed at, kept in our own blue instead of their
// orange. Pure CSS; place inside a `relative` container, it fills it.
export function HeroGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-20 overflow-hidden", className)}
    >
      <div
        className="absolute left-1/2 top-0 h-[70%] w-[130%] -translate-x-1/2 -translate-y-1/3"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 50%, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.12) 45%, transparent 75%)",
        }}
      />
    </div>
  );
}
