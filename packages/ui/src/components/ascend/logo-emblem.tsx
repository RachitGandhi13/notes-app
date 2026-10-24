import { ThemedLogo } from "../ThemedLogo";

interface Ring {
  size: number;
  border: string;
  mask?: string;
}

interface Node {
  ringSize: number;
  angle: number;
  dotSize: number;
  color: string;
  glow: number;
}

const RINGS: Ring[] = [
  {
    size: 848,
    border: "1px solid rgb(255 255 255 / 0.045)",
    mask: "linear-gradient(180deg, #000 30%, transparent 62%)",
  },
  {
    size: 524,
    border: "1px solid rgb(255 255 255 / 0.07)",
    mask: "linear-gradient(180deg, #000 40%, transparent 75%)",
  },
  { size: 324, border: "1px solid rgb(255 255 255 / 0.12)" },
];

const NODES: Node[] = [
  { ringSize: 324, angle: -48, dotSize: 8, color: "#00F0FF", glow: 14 },
  { ringSize: 524, angle: 62, dotSize: 6, color: "#4D94FF", glow: 12 },
  { ringSize: 524, angle: -74, dotSize: 6, color: "#B4A7FF", glow: 12 },
  { ringSize: 848, angle: 38, dotSize: 6, color: "#00F0FF", glow: 12 },
];

// Mobile (below 640px) only keeps 2 rings and 2 nodes, at smaller diameters.
const MOBILE_RINGS: Ring[] = [
  { size: 210, border: "1px solid rgb(255 255 255 / 0.07)" },
  { size: 340, border: "1px solid rgb(255 255 255 / 0.045)" },
];
const MOBILE_NODES: Node[] = [
  { ringSize: 210, angle: -48, dotSize: 8, color: "#00F0FF", glow: 14 },
  { ringSize: 340, angle: 38, dotSize: 6, color: "#00F0FF", glow: 12 },
];

function RingEl({ ring }: { ring: Ring }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: ring.size,
        height: ring.size,
        borderRadius: "50%",
        border: ring.border,
        transform: "translate(-50%, -50%)",
        maskImage: ring.mask,
        WebkitMaskImage: ring.mask,
      }}
    />
  );
}

function NodeEl({ node }: { node: Node }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: node.ringSize,
        height: node.ringSize,
        transform: `translate(-50%, -50%) rotate(${node.angle}deg)`,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: node.dotSize,
          height: node.dotSize,
          borderRadius: "50%",
          backgroundColor: node.color,
          boxShadow: `0 0 ${node.glow}px ${node.color}`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

// Compact variant (Ascend v2 Phase 3): a single 140px ring, a single node,
// a 72px tile and a smaller glow — used atop the auth cards, where the full
// hero-sized emblem would overwhelm a centered form.
const COMPACT_RINGS: Ring[] = [{ size: 140, border: "1px solid rgb(255 255 255 / 0.12)" }];
const COMPACT_NODES: Node[] = [
  { ringSize: 140, angle: -48, dotSize: 7, color: "#00F0FF", glow: 12 },
];

/**
 * Hero logo emblem: orbiting rings/nodes + glow + a glass "tile" holding the
 * CloudVidya mark, with a soft floor reflection. Dark mode only — light mode
 * renders just the plain tile (no rings/nodes/glow/reflection), per spec.
 * Purely decorative: role="img" with one aria-label, everything inside
 * aria-hidden and nothing focusable.
 */
export function LogoEmblem({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <div
        role="img"
        aria-label="CloudVidya Academy logo"
        className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center"
      >
        <div aria-hidden="true" className="hidden dark:block">
          <div className="animate-spin-slow absolute inset-0 motion-reduce:animate-none">
            {COMPACT_RINGS.map((ring) => (
              <RingEl key={ring.size} ring={ring} />
            ))}
            {COMPACT_NODES.map((node, i) => (
              <NodeEl key={i} node={node} />
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 hidden h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full dark:block"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(0 240 255 / 0.32), rgb(0 102 255 / 0.16) 40%, transparent 70%)",
          }}
        />

        <div
          aria-hidden="true"
          className="border-border relative flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border bg-white shadow-md dark:border-white/20 dark:bg-[linear-gradient(160deg,rgb(255_255_255_/_0.16),rgb(255_255_255_/_0.03)_60%)] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.3),inset_0_-12px_24px_rgb(0_102_255_/_0.18),0_16px_40px_-12px_rgb(0_102_255_/_0.75)]"
        >
          <ThemedLogo
            layout="mark"
            height={44}
            title=""
            className="dark:[filter:drop-shadow(0_0_16px_rgb(0_240_255_/_0.55))_drop-shadow(0_6px_12px_rgb(0_0_0_/_0.45))]"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label="CloudVidya Academy logo"
      className="relative mx-auto flex h-[120px] w-[120px] items-center justify-center sm:h-[200px] sm:w-[200px]"
    >
      {/* Dark-mode orbit system. The outer wrapper divs are plain static
          elements purely for responsive show/hide, not positioning contexts
          (each has exactly one non-default visibility rule, stacked
          dark:+breakpoint variant, so there's no cascade-order ambiguity
          between competing classes). The inner `inset-0` div is what actually
          rotates: `animate-spin-slow` is a pure-CSS, GPU-composited transform
          (reuses the existing spin-slow keyframe, already shipped in the CSS
          bundle for the pre-redesign hero — zero added bytes), so the orbit
          costs no main-thread JS. It's also what RingEl/NodeEl position
          against: being `absolute inset-0`, it matches the outer role="img"
          box exactly, so adding the rotating layer doesn't shift anything —
          it just makes the whole ring+node group spin as one rigid disc. */}
      <div aria-hidden="true" className="hidden dark:max-sm:block">
        <div className="animate-spin-slow absolute inset-0 motion-reduce:animate-none">
          {MOBILE_RINGS.map((ring) => (
            <RingEl key={ring.size} ring={ring} />
          ))}
          {MOBILE_NODES.map((node, i) => (
            <NodeEl key={i} node={node} />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="hidden dark:sm:block">
        <div className="animate-spin-slow absolute inset-0 motion-reduce:animate-none">
          {RINGS.map((ring) => (
            <RingEl key={ring.size} ring={ring} />
          ))}
          {NODES.map((node, i) => (
            <NodeEl key={i} node={node} />
          ))}
        </div>
      </div>

      {/* Glow */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 hidden h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full dark:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(0 240 255 / 0.32), rgb(0 102 255 / 0.16) 40%, transparent 70%)",
        }}
      />

      {/* Tile */}
      <div
        aria-hidden="true"
        className="border-border relative flex h-[104px] w-[104px] items-center justify-center rounded-[28px] border bg-white shadow-md sm:h-[168px] sm:w-[168px] sm:rounded-[44px] dark:border-white/20 dark:bg-[linear-gradient(160deg,rgb(255_255_255_/_0.16),rgb(255_255_255_/_0.03)_60%)] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.3),inset_0_-24px_48px_rgb(0_102_255_/_0.18),0_30px_80px_-20px_rgb(0_102_255_/_0.75)]"
      >
        <ThemedLogo
          layout="mark"
          height={66}
          title=""
          className="sm:hidden dark:[filter:drop-shadow(0_0_24px_rgb(0_240_255_/_0.55))_drop-shadow(0_10px_18px_rgb(0_0_0_/_0.45))]"
        />
        <ThemedLogo
          layout="mark"
          height={106}
          title=""
          className="hidden sm:block dark:[filter:drop-shadow(0_0_24px_rgb(0_240_255_/_0.55))_drop-shadow(0_10px_18px_rgb(0_0_0_/_0.45))]"
        />
      </div>

      {/* Reflection */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 hidden h-[18px] w-[150px] -translate-x-1/2 rounded-full dark:block"
        style={{
          top: "calc(50% + 52px + 22px)",
          backgroundImage: "radial-gradient(ellipse, rgb(0 240 255 / 0.45), transparent 70%)",
        }}
      />
    </div>
  );
}
