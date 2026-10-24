"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { AscendButton, BadgePill, LogoEmblem } from "@repo/ui";

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.233, ease: [0.2, 0.8, 0.2, 1] } },
};

// LCP safety: the h1 and subtext render fully visible on first paint (not
// wrapped in the stagger below) — only the emblem, badge and CTAs animate in.
export function HeroContent() {
  return (
    <div className="pt-21 mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
      <motion.div initial="hidden" animate="visible" variants={item}>
        <LogoEmblem />
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={item}>
        <BadgePill chip="AWS">
          <span className="inline-flex items-center gap-2">Programs by CloudVidya Academy</span>
        </BadgePill>
      </motion.div>

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
          style={{
            backgroundImage: "linear-gradient(100deg, #4D94FF 0%, #00F0FF 55%, #B4A7FF 100%)",
          }}
        >
          Cloud &amp; DevOps
        </span>{" "}
        <span className="serif-accent">skills</span>
      </h1>

      <p className="max-w-[34em] text-[20px] leading-[30px] text-[#A1A1AA]">
        Hands-on video courses by our Academy, with notes, practice quizzes and progress tracking.
        Learn at your own pace.
      </p>

      <motion.div
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
      </motion.div>
    </div>
  );
}
