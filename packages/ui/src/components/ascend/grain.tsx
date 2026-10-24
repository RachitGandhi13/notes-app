import { cn } from "../../lib/utils";

// Tiled grain texture overlay. aria-hidden, pointer-events-none. The PNG
// itself isn't pre-faded — the opacity props control intensity.
//
// Dark-mode-only by default (existing behaviour, unchanged for every
// consumer that doesn't pass `lightOpacity`). Passing `lightOpacity` adds a
// second, light-mode-only layer blended with `multiply` instead of a plain
// overlay — a flat overlay at dark-mode strength would grey out a light
// background instead of just adding texture.
export function Grain({
  opacity = 0.6,
  lightOpacity,
  className,
}: {
  /** 0.6-0.9 per spec. */
  opacity?: number;
  /** Opt-in light-mode layer, multiply-blended. ~0.05 per spec. */
  lightOpacity?: number;
  className?: string;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 hidden dark:block", className)}
        style={{
          backgroundImage: "url(/textures/grain.png)",
          backgroundSize: "200px",
          opacity,
        }}
      />
      {lightOpacity !== undefined && (
        <div
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 block dark:hidden", className)}
          style={{
            backgroundImage: "url(/textures/grain.png)",
            backgroundSize: "200px",
            opacity: lightOpacity,
            mixBlendMode: "multiply",
          }}
        />
      )}
    </>
  );
}
