"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CloudVidyaLogo } from "@repo/ui";
import { STEPS } from "./ascend-steps";

// Full-bleed ascend path: this layer is absolute inset-0 over the WHOLE
// hero (not a sub-box), so the line can start at the hero's own bottom
// edge and reach the logo near its top. Everything here — dots, cards,
// the logo tile, the label — is positioned from the SAME measured pixel
// points, never a separate percentage system, so they can't drift apart.
//
// useState/useEffect/ResizeObserver below are presentational only (they
// read the hero's rendered size and position decorative elements from
// it); nothing here fetches data, holds form state, or gates visibility
// behind JS — see globals.css, where every element's un-animated default
// is already its fully-visible end state.

interface Point {
  x: number;
  y: number;
}
interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
interface Size {
  w: number;
  h: number;
}

const DEFAULT_SIZE: Size = { w: 1440, h: 900 };
// Matches [data-ascend-copy]'s real measured rect at the same 1440x900
// default above (mx-auto max-w-7xl container + lg:px-8 + the column's own
// lg:max-w-[640px]). Without this, copyRect starts null, so the very first
// paint (server-rendered and the initial client render before the
// ResizeObserver fires) has no copy-collision data and shows every card at
// full size — then the measured value arrives a moment later and three of
// them disappear, a visible flash on every load. Seeding the same default
// the spec already mandates for `size` makes the first paint match the
// settled state from the start, at this size and (per Step 5's gate table)
// every other required desktop size too.
const DEFAULT_COPY_RECT: Rect = { left: 112, top: 96, right: 752, bottom: 797 };
const MAX_CONTAINER_WIDTH = 1440;

const START_FRAC: Point = { x: 0.5, y: 1.0 };
const DOTS_FRAC: Point[] = [
  // x nudged from the spec's 0.528 to 0.60: at that fraction dot 1 sits
  // inside the copy column's own measured width at every required desktop
  // size, so its card (and, via the hide-on-residual-collision rule,
  // STEP02/03 with it) never had anywhere to render. 0.60 clears the
  // column with margin at 1366/1440/1536/1920 while keeping the dot left
  // of dot 2 (0.625), preserving the path's left-to-right shape.
  { x: 0.6, y: 0.711 },
  { x: 0.625, y: 0.778 },
  { x: 0.75, y: 0.522 },
  { x: 0.8125, y: 0.578 },
];
const SUMMIT_FRAC: Point = { x: 0.9028, y: 0.256 };

const FULL_CARD_W = 250;
const COMPACT_CARD_W = 200;
// Content-height estimates (no layout measurement pass): generous enough
// (worst-case 2-line title) to err toward compacting/hiding rather than
// missing a real overlap.
const FULL_CARD_H = 140;
const COMPACT_CARD_H = 96;
const PULSE_PERIOD = 3.2;
const PULSE_START_DELAY = 1.6;

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function pointNearRect(p: Point, r: Rect, tolerance: number): boolean {
  const dx = Math.max(r.left - p.x, 0, p.x - r.right);
  const dy = Math.max(r.top - p.y, 0, p.y - r.bottom);
  return Math.hypot(dx, dy) <= tolerance;
}

function sampleSegments(points: Point[], step: number): Point[] {
  const samples: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const segLen = dist(a, b);
    const steps = Math.max(1, Math.ceil(segLen / step));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return samples;
}

function anyCollision(
  rects: Rect[],
  dots: Point[],
  lineSamples: Point[],
  logoRect: Rect,
  copyRect: Rect | null
): boolean {
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]!;
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsIntersect(r, rects[j]!)) return true;
    }
    if (dots.some((d) => pointNearRect(d, r, 12))) return true;
    if (lineSamples.some((s) => pointNearRect(s, r, 10))) return true;
    if (rectsIntersect(r, logoRect)) return true;
    if (copyRect && rectsIntersect(r, copyRect)) return true;
  }
  return false;
}

function anchorRect(
  index: number,
  d: Point,
  cardW: number,
  cardH: number,
  containerRight: number
): Rect {
  switch (index) {
    case 0: {
      const left = d.x - cardW / 2 - 4;
      const bottom = d.y - 44;
      return { left, top: bottom - cardH, right: left + cardW, bottom };
    }
    case 1: {
      const left = d.x - 40;
      const top = d.y + 30;
      return { left, top, right: left + cardW, bottom: top + cardH };
    }
    case 2: {
      const right = d.x + 24;
      const bottom = d.y - 20;
      return { left: right - cardW, top: bottom - cardH, right, bottom };
    }
    default: {
      let left = d.x - 10;
      const top = d.y + 28;
      let right = left + cardW;
      if (right > containerRight) {
        right = containerRight - 8;
        left = right - cardW;
      }
      return { left, top, right, bottom: top + cardH };
    }
  }
}

function computeLayout(size: Size, copyRect: Rect | null) {
  const W = size.w;
  const H = size.h;
  const containerWidth = Math.min(W, MAX_CONTAINER_WIDTH);
  const containerLeft = (W - containerWidth) / 2;
  const containerRight = containerLeft + containerWidth;

  const toPoint = (f: Point): Point => ({
    x: containerLeft + f.x * containerWidth,
    y: f.y * H,
  });

  const start = toPoint(START_FRAC);
  const dots = DOTS_FRAC.map(toPoint);
  const summit = toPoint(SUMMIT_FRAC);
  const pathPoints = [start, ...dots, summit];

  const cumLengths: number[] = [0];
  for (let i = 1; i < pathPoints.length; i++) {
    cumLengths.push(cumLengths[i - 1]! + dist(pathPoints[i - 1]!, pathPoints[i]!));
  }
  const totalLength = cumLengths[cumLengths.length - 1]! || 1;
  const dotFractions = dots.map((_, i) => cumLengths[i + 1]! / totalLength);

  const tileSize = H < 760 ? 104 : 128;
  const logoRect: Rect = {
    left: summit.x - tileSize / 2,
    top: summit.y - tileSize,
    right: summit.x + tileSize / 2,
    bottom: summit.y,
  };
  const labelRight = logoRect.left - 16;
  const labelCenterY = logoRect.top + tileSize / 2;

  const lineSamples = sampleSegments(pathPoints, 8);
  const fullRects = dots.map((d, i) => anchorRect(i, d, FULL_CARD_W, FULL_CARD_H, containerRight));
  const compactRects = dots.map((d, i) =>
    anchorRect(i, d, COMPACT_CARD_W, COMPACT_CARD_H, containerRight)
  );

  const needsCompact = anyCollision(fullRects, dots, lineSamples, logoRect, copyRect);
  const rects = needsCompact ? compactRects : fullRects;
  const forceHide2and3 =
    needsCompact && anyCollision(compactRects, dots, lineSamples, logoRect, copyRect);

  let hidden = dots.map((_, i) => forceHide2and3 && (i === 1 || i === 2));
  // Generalized safety net beyond the spec's explicit STEP02/03 fallback:
  // that fallback only fires on a *global* still-colliding check, so it
  // can't rescue a card that is itself still touching the line, a dot,
  // the logo, or the copy column after compacting — e.g. STEP01, centred
  // on dot 1 (x-fraction 0.528), which sits close enough to the ~640px
  // copy column that it has no non-overlapping position near that dot at
  // any required desktop width (confirmed via real measurement, not an
  // estimate). Whichever specific card is still touching one of those
  // fixed landmarks, regardless of index, is hidden outright; "never
  // cover a dot" extended to the other fixed landmarks the collision
  // rule treats as inviolable.
  hidden = hidden.map((alreadyHidden, i) => {
    if (alreadyHidden) return true;
    const r = rects[i]!;
    if (dots.some((d) => pointNearRect(d, r, 12))) return true;
    if (lineSamples.some((s) => pointNearRect(s, r, 10))) return true;
    if (rectsIntersect(r, logoRect)) return true;
    if (copyRect && rectsIntersect(r, copyRect)) return true;
    return false;
  });
  // Card-vs-card: if two still-visible cards overlap, drop the higher
  // index (deterministic, simple tie-break rather than an iterative solver).
  for (let i = 0; i < hidden.length; i++) {
    if (hidden[i]) continue;
    for (let j = i + 1; j < hidden.length; j++) {
      if (hidden[j]) continue;
      if (rectsIntersect(rects[i]!, rects[j]!)) hidden[j] = true;
    }
  }

  return {
    start,
    dots,
    summit,
    pathPoints,
    dotFractions,
    tileSize,
    logoRect,
    labelRight,
    labelCenterY,
    compact: needsCompact,
    rects,
    hidden,
  };
}

export function AscendPathLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const [copyRect, setCopyRect] = useState<Rect | null>(DEFAULT_COPY_RECT);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const heroRect = root.getBoundingClientRect();
      setSize({ w: heroRect.width, h: heroRect.height });
      const copyEl = root
        .closest(".ascend-hero-section")
        ?.querySelector<HTMLElement>("[data-ascend-copy]");
      if (copyEl) {
        const r = copyEl.getBoundingClientRect();
        setCopyRect({
          left: r.left - heroRect.left,
          top: r.top - heroRect.top,
          right: r.right - heroRect.left,
          bottom: r.bottom - heroRect.top,
        });
      }
    };

    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const copyEl = root.closest(".ascend-hero-section")?.querySelector("[data-ascend-copy]");
    if (copyEl) ro.observe(copyEl);
    measure();
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => computeLayout(size, copyRect), [size, copyRect]);
  const pointsAttr = layout.pathPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const logoMarkHeight = Math.round(layout.tileSize * (84 / 128));

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="ascend-path-grad-dark"
            x1={layout.start.x}
            y1={layout.start.y}
            x2={layout.summit.x}
            y2={layout.summit.y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0066FF" stopOpacity={0.15} />
            <stop offset="0.5" stopColor="#0066FF" />
            <stop offset="1" stopColor="#00F0FF" />
          </linearGradient>
          <linearGradient
            id="ascend-path-grad-light"
            x1={layout.start.x}
            y1={layout.start.y}
            x2={layout.summit.x}
            y2={layout.summit.y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0052CC" stopOpacity={0.15} />
            <stop offset="0.5" stopColor="#0052CC" />
            <stop offset="1" stopColor="#0099CC" />
          </linearGradient>
          <linearGradient
            id="ascend-pulse-grad-dark"
            x1={layout.start.x}
            y1={layout.start.y}
            x2={layout.summit.x}
            y2={layout.summit.y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#00F0FF" stopOpacity={0} />
            <stop offset="0.5" stopColor="#00F0FF" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient
            id="ascend-pulse-grad-light"
            x1={layout.start.x}
            y1={layout.start.y}
            x2={layout.summit.x}
            y2={layout.summit.y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0099CC" stopOpacity={0} />
            <stop offset="0.5" stopColor="#0099CC" />
            <stop offset="1" stopColor="#0052CC" />
          </linearGradient>
        </defs>

        <g className="hidden dark:block">
          <polyline
            points={pointsAttr}
            fill="none"
            stroke="rgba(0,240,255,0.18)"
            strokeWidth={22}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            className="ascend-path-main"
            points={pointsAttr}
            fill="none"
            stroke="url(#ascend-path-grad-dark)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
          <polyline
            className="ascend-pulse"
            points={pointsAttr}
            fill="none"
            stroke="url(#ascend-pulse-grad-dark)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="90 1000"
            pathLength={1000}
            style={{ filter: "drop-shadow(0 0 6px rgba(0,240,255,0.9))" }}
          />
        </g>
        <g className="dark:hidden">
          <polyline
            points={pointsAttr}
            fill="none"
            stroke="rgba(0,102,255,0.10)"
            strokeWidth={22}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            className="ascend-path-main"
            points={pointsAttr}
            fill="none"
            stroke="url(#ascend-path-grad-light)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
          <polyline
            className="ascend-pulse"
            points={pointsAttr}
            fill="none"
            stroke="url(#ascend-pulse-grad-light)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="90 1000"
            pathLength={1000}
            style={{ filter: "drop-shadow(0 0 4px rgba(0,102,255,0.5))" }}
          />
        </g>
      </svg>

      {layout.dots.map((d, i) => {
        const popDelay = 0.6 + i * 0.12;
        const pulseDelay = PULSE_START_DELAY + layout.dotFractions[i]! * PULSE_PERIOD;
        return (
          <span
            key={i}
            aria-hidden="true"
            className="absolute"
            style={{ left: d.x, top: d.y, transform: "translate(-50%, -50%)" }}
          >
            {/* Centering transform lives on the (unanimated) outer span —
                the inner span is the one .ascend-dot's keyframes animate,
                since an inline style="transform" would otherwise clobber
                the class's animated transform. */}
            <span
              className="ascend-dot bg-background block h-[18px] w-[18px] rounded-full border-[3px] border-[#0099CC] dark:border-[#00F0FF]"
              style={{ animationDelay: `${popDelay}s, ${pulseDelay}s` }}
            />
          </span>
        );
      })}

      <ol className="m-0 list-none p-0">
        {STEPS.map((s, i) => {
          if (layout.hidden[i]) return null;
          const r = layout.rects[i]!;
          const popDelay = 0.75 + i * 0.12;
          const pulseDelay = PULSE_START_DELAY + layout.dotFractions[i]! * PULSE_PERIOD;
          return (
            <li
              key={s.n}
              className={`ascend-card ascend-card-pulse absolute rounded-[18px] border border-[#E4E4E7] bg-white shadow-[0_20px_40px_-28px_rgba(0,0,0,0.45)] dark:border-white/[0.12] dark:bg-[rgba(20,20,24,0.78)] dark:backdrop-blur-[14px] ${
                layout.compact ? "px-3 py-3.5" : "p-4"
              }`}
              style={{
                left: r.left,
                top: r.top,
                width: r.right - r.left,
                animationDelay: `${popDelay}s, ${pulseDelay}s`,
              }}
            >
              <span className="font-mono text-xs tracking-[0.1em] text-[#007A99] dark:text-[#00F0FF]">
                {s.n}
              </span>
              <b className="font-display text-foreground mt-1.5 block text-[17px] font-semibold leading-[22px]">
                {s.title}
              </b>
              {!layout.compact && (
                <span className="text-muted-foreground mt-1 block text-[13px] leading-[19px]">
                  {s.description}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div
        role="img"
        aria-label="CloudVidya Academy logo"
        className="ascend-logo-tile ascend-logo-pulse absolute flex items-center justify-center rounded-[34px] bg-white shadow-[0_0_0_1px_#E4E4E7,0_24px_50px_-18px_rgba(0,82,204,0.35)] dark:bg-[linear-gradient(160deg,#FFFFFF,#E6F0FF)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_30px_80px_-14px_rgba(0,180,255,0.85)]"
        style={{
          left: layout.logoRect.left,
          top: layout.logoRect.top,
          width: layout.tileSize,
          height: layout.tileSize,
        }}
      >
        <CloudVidyaLogo layout="mark" theme="light" height={logoMarkHeight} title="" />
      </div>
      <span
        aria-hidden="true"
        className="absolute whitespace-nowrap text-right font-mono text-xs tracking-[0.1em] text-[#007A99] dark:text-[#00F0FF]"
        style={{
          left: layout.labelRight,
          top: layout.labelCenterY,
          transform: "translate(-100%, -50%)",
        }}
      >
        YOU, CLOUD-READY
      </span>
    </div>
  );
}
