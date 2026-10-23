// Ascend design system — fixed ambient background layer (grid + glow + noise),
// mounted once in the root layout so every page sits on top of it. Purely
// decorative: fixed, aria-hidden and pointer-events-none, so it can never
// intercept clicks or affect layout/scroll height. Dark mode only — the
// glow/grid tokens aren't designed against a light background, and light
// mode is out of scope for this restyle, so it stays hidden there.
export function GlowCanvas() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-50 hidden overflow-hidden dark:block"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(60% 50% at 20% 0%, rgb(0 102 255 / 0.22), transparent 70%)",
            "radial-gradient(40% 35% at 85% 10%, rgb(0 240 255 / 0.12), transparent 70%)",
          ].join(", "),
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.04) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse at top, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black, transparent 70%)",
        }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]">
        <filter id="cv-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#cv-noise)" />
      </svg>
    </div>
  );
}
