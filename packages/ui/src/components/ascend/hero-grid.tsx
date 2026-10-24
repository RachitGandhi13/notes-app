import { cn } from "../../lib/utils";

// 52px line grid, faded via a radial mask. aria-hidden, pointer-events-none,
// dark mode only.
export function HeroGrid({ className }: { className?: string }) {
  const mask = "radial-gradient(ellipse 60% 50% at 50% 30%, #000, transparent 75%)";
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 hidden dark:block", className)}
      style={{
        backgroundImage: [
          "linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px)",
          "linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "52px 52px",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
