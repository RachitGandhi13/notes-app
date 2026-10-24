import Link from "next/link";
import { AscendButton, CloudVidyaLogo, Grain } from "@repo/ui";
import { AscendPathLayer } from "./AscendPathLayer";
import { STEPS } from "./ascend-steps";

// New Ascend-path hero, replacing HeroContent (orbit callouts + stat row —
// kept on disk, just no longer rendered; see app/(marketing)/page.tsx).
// Server component, except for AscendPathLayer: the decorative path/dots/
// cards/logo tile need to measure the hero's rendered size (ResizeObserver)
// to position themselves full-bleed, which only a client component can
// do. Every element's *default* CSS state is still its fully-visible end
// state (see globals.css) — the measurement only refines positions, it
// never gates visibility.
const BROWSE_HREF = "/#browse";
const NOTES_HREF = "/notes";

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

      {/* Full-bleed: behind the copy column (which stays above it via
          z-10 below), edge to edge over the whole hero, so the line can
          start at the hero's own bottom edge. */}
      <AscendPathLayer />

      {/* lg+: top padding clears the floating sticky navbar (h-16 = 64px)
          plus the 32px the spec asks for, so the eyebrow is never covered
          once the navbar sticks and the hero scrolls underneath it. */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-0 lg:flex-1 lg:gap-0 lg:px-8 lg:py-0 lg:pt-[96px]">
        <div
          data-ascend-copy
          className="flex min-h-0 flex-1 flex-col justify-center gap-6 lg:max-w-[640px]"
        >
          <CopyColumnTop />
        </div>
        <div className="hidden lg:block lg:pb-12">
          <StatsRow courseCount={courseCount} internshipTrackCount={internshipTrackCount} />
        </div>
        <MobilePath />
      </div>
    </section>
  );
}
