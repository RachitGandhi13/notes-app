"use client";

import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock,
  FlaskConical,
  GraduationCap,
  ListChecks,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import { Button, Dialog, DialogContent } from "@repo/ui";
import { TRACK_CURRICULUM } from "@/lib/internship-curriculum";

interface Track {
  id: string;
  title: string;
  duration: string;
  description: string;
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Clock; title: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        <Icon className="h-4 w-4" />
      </span>
      {title}
    </h3>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof Clock;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#161618] p-4 shadow-sm">
      <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{text}</p>
    </div>
  );
}

export function InternshipCurriculumModal({
  track,
  open,
  onOpenChange,
  onApply,
}: {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}) {
  const curriculum = track ? TRACK_CURRICULUM[track.title] : undefined;
  if (!track || !curriculum) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-shell max-h-[85vh] max-w-3xl overflow-y-auto p-0">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/10 p-6 sm:p-8">
          <div className="pointer-events-none absolute -top-20 left-1/4 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative">
            <span className="bg-primary/15 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5" />
              {curriculum.duration}
            </span>
            <h2 className="mt-3 pr-8 text-2xl font-extrabold tracking-tight text-white">
              {track.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{track.description}</p>
          </div>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          {/* Overview */}
          <div className="grid gap-4 sm:grid-cols-3">
            <OverviewCard icon={Users} label="Eligibility" text={curriculum.eligibility} />
            <OverviewCard
              icon={GraduationCap}
              label="Learning format"
              text={curriculum.methodology}
            />
            <OverviewCard
              icon={CheckCircle2}
              label="Prerequisites"
              text={curriculum.prerequisites}
            />
          </div>

          {/* Module-by-module curriculum */}
          <section>
            <SectionHeading icon={ListChecks} title="Module-by-module curriculum" />
            <div className="space-y-2.5">
              {curriculum.modules.map((m) => (
                <details
                  key={m.title}
                  className="group rounded-xl border border-white/10 bg-[#161618] p-4 transition-all duration-150 open:border-l-2 open:border-l-blue-500 hover:border-blue-500/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white marker:content-none">
                    <span>{m.title}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-[144ms] group-open:rotate-180" />
                  </summary>
                  <p className="mt-1 text-xs font-medium text-blue-400">{m.period}</p>
                  <ul className="mt-3 space-y-1.5">
                    {m.topics.map((topic) => (
                      <li key={topic} className="flex gap-2 text-sm text-zinc-300">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                        <span className="leading-relaxed">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          {/* Hands-on labs */}
          <section>
            <SectionHeading icon={FlaskConical} title="Hands-on lab exercises" />
            <div className="grid gap-3 sm:grid-cols-2">
              {curriculum.labs.map((lab) => (
                <div
                  key={lab.title}
                  className="rounded-lg border border-white/10 bg-[#161618] p-3.5 transition-all duration-150 hover:border-blue-500/30"
                >
                  <p className="text-sm font-semibold text-white">{lab.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{lab.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Capstone projects */}
          <section>
            <SectionHeading icon={Rocket} title="Capstone projects" />
            <div className="grid gap-3 sm:grid-cols-3">
              {curriculum.capstoneProjects.map((project) => (
                <div
                  key={project.title}
                  className="rounded-xl border border-white/10 bg-[#161618] p-4 transition-all duration-150 hover:border-blue-500/30"
                >
                  <p className="text-sm font-semibold text-white">{project.title}</p>
                  <ul className="mt-2 space-y-1">
                    {project.points.map((point) => (
                      <li key={point} className="text-xs leading-relaxed text-zinc-400">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Skills + Career */}
          <div className="grid gap-6 sm:grid-cols-2">
            <section>
              <SectionHeading icon={Sparkles} title="Skills gained" />
              <div className="flex flex-wrap gap-2">
                {curriculum.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
            <section>
              <SectionHeading icon={Briefcase} title="Career opportunities" />
              <ul className="space-y-1.5">
                {curriculum.careerOpportunities.map((career) => (
                  <li key={career} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                    {career}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Footer — sticky, so the primary CTA stays reachable while scrolling the long modal */}
        <div className="sticky bottom-0 z-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 bg-zinc-950/90 p-6 backdrop-blur-xl sm:flex-row sm:p-8">
          <p className="text-center text-xs text-zinc-500 sm:text-left">
            Questions about this track? Email{" "}
            <a
              href="mailto:admin@cloudvidyaacademy.com"
              className="text-blue-400 underline hover:text-blue-300"
            >
              admin@cloudvidyaacademy.com
            </a>
          </p>
          <Button
            onClick={onApply}
            className="w-full shrink-0 rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-150 hover:bg-blue-500 active:scale-[0.97] sm:w-auto"
          >
            Apply for this track
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
