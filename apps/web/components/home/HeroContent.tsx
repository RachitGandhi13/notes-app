"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, BadgeCheck, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { AscendButton, AscendEyebrow, ThemedLogo } from "@repo/ui";
import { CourseSearchBar } from "@/components/CourseSearchBar";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// Icon components can't cross the server->client boundary as props (they're
// functions, not serializable data), so the stats array is built here from a
// plain `courseCount` number instead of being passed down fully formed.
//
// The course count is a real, computed number. The other two are
// deliberately *not* personal stats (e.g. one instructor's certification
// count or years of experience) — the client wants the homepage to read
// as an Academy with many trainers, not a single person's résumé.
// Enrollment/student counts are also deliberately not shown here —
// admin-only metric, see /admin.
export function HeroContent({ courseCount }: { courseCount: number }) {
  const stats = [
    courseCount > 0
      ? {
          Icon: BookOpen,
          value: String(courseCount),
          text: courseCount === 1 ? "Course" : "Courses",
        }
      : null,
    { Icon: BadgeCheck, text: "Get certified on AWS with cloud experts" },
    { Icon: Users, text: "Get trained with real-time industry experts" },
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <motion.div
      className="min-w-0 space-y-7"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.div
        variants={item}
        className="bg-card/80 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 shadow-sm backdrop-blur"
      >
        <ThemedLogo layout="mark" height={20} title="" />
        <AscendEyebrow>Programs by CloudVidya Academy</AscendEyebrow>
      </motion.div>

      <motion.h1 variants={item} className="font-display text-display">
        Level up your{" "}
        <span className="animate-gradient-shift from-primary bg-gradient-to-r via-cyan-400 to-violet-500 bg-[length:200%_auto] bg-clip-text text-transparent motion-reduce:animate-none sm:whitespace-nowrap dark:[background-image:linear-gradient(45deg,#0066FF,#00F0FF)]">
          Cloud &amp; DevOps
        </span>{" "}
        skills
      </motion.h1>

      <motion.p variants={item} className="text-body-lg text-muted-foreground max-w-[65ch]">
        Hands-on video courses by our Academy, with notes, practice quizzes and progress tracking.
        Learn at your own pace.
      </motion.p>

      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
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

      <motion.div variants={item} className="max-w-xl">
        <CourseSearchBar />
      </motion.div>

      <motion.dl variants={item} className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(({ Icon, value, text }, i) => (
          <div
            key={i}
            className="bg-card/80 flex h-full items-center gap-3 rounded-xl border p-4 backdrop-blur"
          >
            <span className="bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              {value ? (
                <>
                  <dd className="text-h3 tabular-nums leading-tight">{value}</dd>
                  <dt className="text-eyebrow text-muted-foreground normal-case">{text}</dt>
                </>
              ) : (
                <dd className="text-sm font-semibold leading-snug">{text}</dd>
              )}
            </div>
          </div>
        ))}
      </motion.dl>
    </motion.div>
  );
}
