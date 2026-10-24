import { cn } from "../../lib/utils";

// Tiled grain texture overlay. aria-hidden, pointer-events-none, dark mode
// only. The PNG itself isn't pre-faded — this opacity prop controls intensity.
export function Grain({
  opacity = 0.6,
  className,
}: {
  /** 0.6-0.9 per spec. */
  opacity?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 hidden dark:block", className)}
      style={{
        backgroundImage: "url(/textures/grain.png)",
        backgroundSize: "200px",
        opacity,
      }}
    />
  );
}
