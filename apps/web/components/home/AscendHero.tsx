import Link from "next/link";
import { AscendButton, CloudVidyaLogo, Grain } from "@repo/ui";

// New Ascend-path hero, replacing HeroContent (orbit callouts + stat row —
// kept on disk, just no longer rendered; see app/(marketing)/page.tsx).
// Server component throughout, no client wrapper: the decorative path's
// draw-in motion is pure CSS (animation-fill-mode: both, see globals.css),
// so visibility never depends on JS/hydration/IntersectionObserver timing
// — the hero is above the fold, and nothing here may stay invisible while
// JS is still loading.
//
// Dot/card/logo positions are percentages of an 840x900 box (the decorative
// path's own box, independent of the hero's overall width) — see
// `.ascend-path-box` below, which is sized to that exact ratio via
// `aspect-ratio` plus a dual width/height cap, so the SVG's
// `viewBox="600 0 840 900"` and these percentages always stay in sync at
// any box size.
const BROWSE_HREF = "/#browse";
const NOTES_HREF = "/notes";

interface Step {
  n: string;
  title: string;
  description: string;
  /** Anchors the card's left edge at this % of the box, unless rightPct is set. */
  leftPct?: number;
  /** STEP 04 only: anchored from the right instead of the left. At the
   * container's capped max-width (max-w-7xl), the box the right column
   * gets is narrower than 840px even at the widest viewports the gate
   * checks (1920px included — the container itself caps out), so a
   * left-anchored card nearest the right edge would push past the box
   * (clipped by overflow-hidden) at every width from 1024px up. Right-
   * anchoring this one card keeps its right edge inside the box always. */
  rightPct?: number;
  topPct: number;
  /** STEP 02 only, per spec: hidden at 1024-1279px first if cards crowd the h1. */
  hideBodyAtLg?: boolean;
}

const STEPS: Step[] = [
  {
    n: "STEP 01",
    title: "Learn the foundations",
    description: "Video lessons, notes and slides",
    leftPct: 4.76,
    topPct: 57.78,
  },
  {
    n: "STEP 02",
    title: "Build real projects",
    description: "Learn by building, not just watching",
    leftPct: 30.95,
    topPct: 81.11,
    hideBodyAtLg: true,
  },
  {
    n: "STEP 03",
    title: "Test yourself",
    description: "Section reviews and quizzes",
    leftPct: 27.38,
    topPct: 38.89,
  },
  {
    n: "STEP 04",
    title: "Get certified on AWS",
    description: "With cloud experts",
    rightPct: 2,
    topPct: 60.89,
  },
];

const DOTS: { leftPct: number; topPct: number }[] = [
  { leftPct: 19.05, topPct: 71.11 },
  { leftPct: 35.71, topPct: 77.78 },
  { leftPct: 57.14, topPct: 52.22 },
  { leftPct: 67.86, topPct: 57.78 },
];

const LOGO_LEFT_PCT = 75.71;
const LOGO_TOP_PCT = 11.56;
const LOGO_WIDTH_PCT = 15.24;
const LABEL_TOP_PCT = 27.33;

function H1() {
  return (
    <h1
      className="ascend-h1 font-display text-foreground font-bold"
      style={{ lineHeight: 0.98, letterSpacing: "-0.045em" }}
    >
      Level up your
      <br />
      <span
        className="bg-clip-text text-transparent"
        style={{ backgroundImage: "var(--ascend-hero-gradient)" }}
      >
        Cloud &amp; DevOps
      </span>
      <br />
      <span className="serif-accent">skills,</span>{" "}
      <span className="text-zinc-500">step by step.</span>
    </h1>
  );
}

function CopyColumnTop() {
  return (
    <div className="relative z-10 flex max-w-[640px] flex-col gap-6">
      <span className="text-primary-ink font-mono text-xs uppercase tracking-[0.14em]">
        Programs by CloudVidya Academy
      </span>
      <H1 />
      <p className="ascend-lead hidden max-w-[500px] text-[18px] leading-[29px] text-[#52525B] sm:block dark:text-[#A1A1AA]">
        Hands-on video courses with notes, practice quizzes and progress tracking. Learn at your own
        pace; we&apos;ll show you every step to the top.
      </p>
      <p className="ascend-lead max-w-[500px] text-[18px] leading-[29px] text-[#52525B] sm:hidden dark:text-[#A1A1AA]">
        Hands-on video courses with notes, practice quizzes, and progress tracking.
      </p>
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap">
        <AscendButton
          asChild
          size="lg"
          className="h-[54px] w-full justify-center px-[26px] lg:w-auto"
        >
          <Link href={BROWSE_HREF}>Start climbing →</Link>
        </AscendButton>
        <AscendButton
          asChild
          variant="secondary"
          size="lg"
          className="h-[54px] w-full justify-center px-[26px] lg:w-auto"
        >
          <Link href={NOTES_HREF}>Explore notes</Link>
        </AscendButton>
      </div>
    </div>
  );
}

function StatsRow({
  courseCount,
  internshipTrackCount,
}: {
  courseCount: number;
  internshipTrackCount: number;
}) {
  const stats = [
    {
      value: String(courseCount),
      label: courseCount === 1 ? "course, lifetime access" : "courses, lifetime access",
    },
    {
      value: String(internshipTrackCount),
      label: internshipTrackCount === 1 ? "internship track" : "internship tracks",
    },
    { value: "Live", label: "real-time industry experts" },
  ];

  return (
    <div className="relative z-10 hidden gap-9 text-sm text-[#52525B] lg:flex dark:text-[#A1A1AA]">
      {stats.map((s) => (
        <span key={s.label}>
          <b className="ascend-stat-value font-display text-foreground block text-[30px] leading-[34px]">
            {s.value}
          </b>
          {s.label}
        </span>
      ))}
    </div>
  );
}

function DesktopPath() {
  return (
    <div
      className="absolute bottom-0 right-0 hidden lg:block"
      style={{
        aspectRatio: "840 / 900",
        width: "100%",
        maxWidth: "840px",
        height: "auto",
        maxHeight: "100%",
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="600 0 840 900"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="ascend-path-grad-dark"
            x1="720"
            y1="900"
            x2="1300"
            y2="150"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0066FF" stopOpacity={0.15} />
            <stop offset="0.5" stopColor="#0066FF" />
            <stop offset="1" stopColor="#00F0FF" />
          </linearGradient>
          <linearGradient
            id="ascend-path-grad-light"
            x1="720"
            y1="900"
            x2="1300"
            y2="150"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0052CC" stopOpacity={0.15} />
            <stop offset="0.5" stopColor="#0052CC" />
            <stop offset="1" stopColor="#0099CC" />
          </linearGradient>
        </defs>

        <g className="hidden dark:block">
          <polyline
            points="720,900 760,640 900,700 1080,470 1170,520 1300,230"
            fill="none"
            stroke="rgba(0,240,255,0.18)"
            strokeWidth={22}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            className="ascend-path-main"
            points="720,900 760,640 900,700 1080,470 1170,520 1300,230"
            fill="none"
            stroke="url(#ascend-path-grad-dark)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
        </g>
        <g className="dark:hidden">
          <polyline
            points="720,900 760,640 900,700 1080,470 1170,520 1300,230"
            fill="none"
            stroke="rgba(0,102,255,0.10)"
            strokeWidth={22}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            className="ascend-path-main"
            points="720,900 760,640 900,700 1080,470 1170,520 1300,230"
            fill="none"
            stroke="url(#ascend-path-grad-light)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
        </g>
      </svg>

      {DOTS.map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute"
          style={{ left: `${d.leftPct}%`, top: `${d.topPct}%`, transform: "translate(-50%, -50%)" }}
        >
          {/* Centering transform lives on the (unanimated) outer span — the
              inner span is the one the .ascend-dot CSS animates, since an
              inline style="transform" would otherwise clobber the class's
              keyframe-animated transform (inline always wins over a
              stylesheet rule for the same property; the two can't layer
              from separate sources). Delay is inline, not nth-of-type, so
              it can't drift out of sync if this markup's sibling shape
              ever changes. */}
          <span
            className="ascend-dot bg-background block h-[18px] w-[18px] rounded-full border-[3px] border-[#0099CC] shadow-[0_0_0_6px_rgba(0,102,255,0.10)] dark:border-[#00F0FF] dark:shadow-[0_0_0_6px_rgba(0,240,255,0.12)]"
            style={{ animationDelay: `${0.6 + i * 0.12}s` }}
          />
        </span>
      ))}

      <ol className="m-0 list-none p-0">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className="ascend-card absolute rounded-[18px] border border-[#E4E4E7] bg-white p-4 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.45)] dark:border-white/[0.12] dark:bg-[rgba(20,20,24,0.78)] dark:backdrop-blur-[14px]"
            style={{
              left: s.leftPct !== undefined ? `${s.leftPct}%` : undefined,
              right: s.rightPct !== undefined ? `${s.rightPct}%` : undefined,
              top: `${s.topPct}%`,
              width: "clamp(200px, 29.76%, 250px)",
              animationDelay: `${0.75 + i * 0.12}s`,
            }}
          >
            <span className="font-mono text-xs tracking-[0.1em] text-[#007A99] dark:text-[#00F0FF]">
              {s.n}
            </span>
            <b className="font-display text-foreground mt-1.5 block text-[17px] font-semibold leading-[22px]">
              {s.title}
            </b>
            <span
              className={`text-muted-foreground mt-1 block text-[13px] leading-[19px] ${
                s.hideBodyAtLg ? "hidden xl:block" : ""
              }`}
            >
              {s.description}
            </span>
          </li>
        ))}
      </ol>

      <div
        role="img"
        aria-label="CloudVidya Academy logo"
        className="ascend-logo-tile absolute flex aspect-square items-center justify-center rounded-[34px] bg-white shadow-[0_0_0_1px_#E4E4E7,0_24px_50px_-18px_rgba(0,82,204,0.35)] dark:bg-[linear-gradient(160deg,#FFFFFF,#E6F0FF)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_30px_80px_-14px_rgba(0,180,255,0.85)]"
        style={{ left: `${LOGO_LEFT_PCT}%`, top: `${LOGO_TOP_PCT}%`, width: `${LOGO_WIDTH_PCT}%` }}
      >
        <CloudVidyaLogo layout="mark" theme="light" height={84} title="" />
      </div>
      <span
        aria-hidden="true"
        className="absolute whitespace-nowrap text-center font-mono text-xs tracking-[0.1em] text-[#007A99] dark:text-[#00F0FF]"
        style={{
          left: `${LOGO_LEFT_PCT + LOGO_WIDTH_PCT / 2}%`,
          top: `${LABEL_TOP_PCT}%`,
          transform: "translateX(-50%)",
        }}
      >
        YOU, CLOUD-READY
      </span>
    </div>
  );
}

function MobilePath() {
  return (
    <div className="lg:hidden">
      <div className="relative mt-2 flex flex-col gap-4 rounded-[22px] border border-[#E4E4E7] bg-white p-[18px] dark:border-white/[0.12] dark:bg-[rgba(20,20,24,0.78)]">
        <span
          aria-hidden="true"
          className="absolute bottom-[30px] left-[25px] top-[74px] block w-[3px] rounded-[3px] dark:hidden"
          style={{ backgroundImage: "linear-gradient(0deg, #0052CC, #0099CC)" }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-[30px] left-[25px] top-[74px] hidden w-[3px] rounded-[3px] dark:block"
          style={{ backgroundImage: "linear-gradient(0deg, #0066FF, #00F0FF)" }}
        />
        <div className="flex items-center gap-3">
          <div
            role="img"
            aria-label="CloudVidya Academy logo"
            className="ascend-logo-tile relative z-10 -ml-1.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-white shadow-[0_0_0_1px_#E4E4E7,0_14px_30px_-14px_rgba(0,82,204,0.35)] dark:bg-[linear-gradient(160deg,#FFFFFF,#E6F0FF)] dark:shadow-[0_16px_40px_-12px_rgba(0,180,255,0.8)]"
          >
            <CloudVidyaLogo layout="mark" theme="light" height={30} title="" />
          </div>
          <span className="font-mono text-xs tracking-[0.1em] text-[#007A99] dark:text-[#00F0FF]">
            YOU, CLOUD-READY
          </span>
        </div>
        <ol className="m-0 flex list-none flex-col gap-3.5 p-0 pl-10">
          {[...STEPS].reverse().map((s, i) => (
            <li
              key={s.n}
              className="ascend-card relative flex items-start gap-3"
              style={{ animationDelay: `${0.45 + i * 0.12}s` }}
            >
              <span className="bg-background absolute -left-10 top-0.5 h-4 w-4 rounded-full border-[3px] border-[#0099CC] dark:border-[#00F0FF]" />
              <span>
                <span className="block font-mono text-[11px] tracking-[0.1em] text-[#007A99] dark:text-[#00F0FF]">
                  {s.n}
                </span>
                <b className="font-display text-foreground block text-[15px] font-semibold leading-5">
                  {s.title}
                </b>
                <span className="text-muted-foreground block text-[13px] leading-[18px]">
                  {s.description}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function AscendHero({
  courseCount,
  internshipTrackCount,
}: {
  courseCount: number;
  internshipTrackCount: number;
}) {
  return (
    <section className="ascend-hero-section relative isolate flex flex-col overflow-hidden border-b">
      {/* Aurora */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            "radial-gradient(45% 55% at 88% 12%, rgba(0,102,255,0.40), transparent 70%), radial-gradient(35% 40% at 60% 90%, rgba(0,240,255,0.10), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(45% 55% at 88% 12%, rgba(0,102,255,0.10), transparent 70%), radial-gradient(35% 40% at 60% 90%, rgba(0,153,204,0.06), transparent 70%)",
        }}
      />

      {/* 72px grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block dark:hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(9,9,11,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(9,9,11,0.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <Grain opacity={0.55} lightOpacity={0.05} blend="overlay" />

      {/* lg+: top padding clears the floating sticky navbar (h-16 = 64px)
          plus the 32px the spec asks for, so the eyebrow is never covered
          once the navbar sticks and the hero scrolls underneath it. */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-0 lg:flex-1 lg:gap-0 lg:px-8 lg:py-0 lg:pt-[96px]">
        <div className="flex min-h-0 flex-1 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] lg:grid-rows-[1fr] lg:items-stretch lg:gap-6">
          <div className="flex flex-col justify-center gap-6 lg:h-full">
            <CopyColumnTop />
          </div>
          <div className="relative hidden lg:block">
            <DesktopPath />
          </div>
        </div>
        <div className="hidden lg:block lg:pb-12">
          <StatsRow courseCount={courseCount} internshipTrackCount={internshipTrackCount} />
        </div>
        <MobilePath />
      </div>
    </section>
  );
}
