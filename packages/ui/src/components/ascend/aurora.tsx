import { cn } from "../../lib/utils";

export type AuroraVariant = "hero" | "cover" | "panel";

interface AuroraProps {
  variant: AuroraVariant;
  /** cover/panel only — tints the two secondary blooms. Defaults to the cv-blue/cv-cyan pair. */
  accent?: string;
  accent2?: string;
  className?: string;
}

// Decorative ambient color wash. aria-hidden, pointer-events-none, dark mode
// only (renders nothing in light mode — out of scope for this restyle).
// CSS gradients only, no filter: blur / canvas / video, per spec.
export function Aurora({ variant, accent, accent2, className }: AuroraProps) {
  if (variant === "hero") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1/2 top-[-260px] hidden h-[1300px] w-[1600px] -translate-x-1/2 dark:block",
          className
        )}
        style={{
          backgroundImage: [
            "radial-gradient(28% 32% at 30% 38%, rgb(0 102 255 / 0.55), transparent 70%)",
            "radial-gradient(24% 28% at 68% 30%, rgb(0 240 255 / 0.32), transparent 70%)",
            "radial-gradient(22% 26% at 52% 58%, rgb(124 92 255 / 0.30), transparent 70%)",
          ].join(", "),
        }}
      />
    );
  }

  const a = accent ?? "#0066FF";
  const b = accent2 ?? "#00F0FF";

  if (variant === "cover") {
    return (
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 hidden dark:block", className)}
        style={{
          backgroundImage: [
            `radial-gradient(60% 55% at 20% 15%, color-mix(in srgb, ${a} 55%, transparent), transparent 70%)`,
            `radial-gradient(50% 45% at 85% 80%, color-mix(in srgb, ${b} 35%, transparent), transparent 70%)`,
          ].join(", "),
        }}
      />
    );
  }

  // panel
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 hidden dark:block", className)}
      style={{
        backgroundImage: [
          `radial-gradient(45% 60% at 50% -10%, color-mix(in srgb, ${a} 45%, transparent), transparent 70%)`,
          `radial-gradient(35% 45% at 85% 100%, color-mix(in srgb, ${b} 28%, transparent), transparent 70%)`,
        ].join(", "),
      }}
    />
  );
}
