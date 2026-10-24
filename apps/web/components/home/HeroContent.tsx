"use client";

import { m, type Variants } from "framer-motion";
import { Award, ArrowRight, BookOpen, ClipboardCheck, Code2, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AscendButton, BadgePill, LogoEmblem } from "@repo/ui";
import { StatStrip } from "./StatStrip";

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.233, ease: [0.2, 0.8, 0.2, 1] } },
};

interface Callout {
  icon: ReactNode;
  title: string;
  description: string;
}

// Decorative only (not links) — what the old hero communicated in one glance,
// brought back in the new visual language. Order matters: index 0/2 render
// on the left rail, 1/3 on the right (see the two xl+ rail groupings below).
const CALLOUTS: Callout[] = [
  {
    icon: <Award className="h-5 w-5" />,
    title: "Get certified on AWS",
    description: "Taught by AWS-certified industry experts",
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "Project-based",
    description: "Learn by building, not just watching",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Track your progress",
    description: "Pick up right where you left off",
  },
  {
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: "Section reviews",
    description: "Test yourself as you go",
  },
];

function CalloutCard({ icon, title, description }: Callout) {
  return (
    <div className="border-border flex w-[216px] items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none dark:backdrop-blur-sm">
      <span className="text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5 text-left">
        <span className="text-foreground text-[15px] font-semibold leading-tight">{title}</span>
        <span className="text-muted-foreground text-[13px] leading-snug">{description}</span>
      </span>
    </div>
  );
}

// LCP safety: the h1 and subtext render fully visible on first paint (not
// wrapped in the stagger below) — only the emblem, badge and CTAs animate in.
export function HeroContent({ courseCount }: { courseCount?: number }) {
  return (
    <div className="pt-21 mx-auto max-w-7xl">
      {/* Emblem row + orbit callouts (1280px+ only, below that the callouts
          move into the 2x2 grid further down). Grid height is just this
          row's content, so the side rails align with the emblem/badge/h1
          block specifically, not the whole hero. */}
      <div className="xl:grid xl:grid-cols-[216px_auto_216px] xl:items-center xl:gap-6">
        <div className="col-start-1 row-start-1 hidden flex-col items-end gap-5 xl:flex">
          <CalloutCard {...CALLOUTS[0]!} />
          <CalloutCard {...CALLOUTS[2]!} />
        </div>

        <div className="col-start-2 row-start-1 mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
          <m.div initial="hidden" animate="visible" variants={item}>
            <LogoEmblem />
          </m.div>

          <m.div initial="hidden" animate="visible" variants={item}>
            <BadgePill chip="AWS">
              <span className="inline-flex items-center gap-2">Programs by CloudVidya Academy</span>
            </BadgePill>
          </m.div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(52px, 8.6vw, 132px)",
              lineHeight: 0.9,
              letterSpacing: "-0.055em",
              fontWeight: 700,
            }}
          >
            Level up your
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--cv-gradient-headline)" }}
            >
              Cloud &amp; DevOps
            </span>{" "}
            <span className="serif-accent">skills</span>
          </h1>
        </div>

        <div className="col-start-3 row-start-1 hidden flex-col items-start gap-5 xl:flex">
          <CalloutCard {...CALLOUTS[1]!} />
          <CalloutCard {...CALLOUTS[3]!} />
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <p className="max-w-[34em] text-[20px] leading-[30px] text-[#52525B] dark:text-[#A1A1AA]">
          Hands-on video courses by CloudVidya Academy, with notes, practice quizzes and progress
          tracking. Learn at your own pace.
        </p>

        <m.div
          initial="hidden"
          animate="visible"
          variants={item}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <AscendButton asChild size="lg" glow icon={<ArrowRight className="h-4 w-4" />}>
            <Link href="/#browse">Browse courses</Link>
          </AscendButton>
          <AscendButton asChild variant="secondary" size="lg">
            <Link href="/notes">
              <BookOpen className="h-4 w-4" />
              Explore notes
            </Link>
          </AscendButton>
        </m.div>

        <StatStrip courseCount={courseCount} />

        {/* Below 1280px the orbit callouts move here, as a 2x2 grid. */}
        <div className="grid w-full max-w-md grid-cols-2 gap-4 xl:hidden">
          {CALLOUTS.map((c) => (
            <CalloutCard key={c.title} {...c} />
          ))}
        </div>
      </div>
    </div>
  );
}
