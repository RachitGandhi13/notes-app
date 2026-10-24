import type { Metadata } from "next";
import { Award, ArrowRight, Briefcase, CheckCircle2, ClipboardCheck } from "lucide-react";
import { InternshipTrackPicker } from "@/components/InternshipTrackPicker";
import { INTERNSHIP_ROADMAP, PROGRAM_BENEFITS, PROGRAM_DELIVERABLES } from "@/lib/internships";
import { getActiveInternshipTracks } from "@/lib/internship-actions";
import { HeroGlow } from "@/components/home/HeroGlow";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Internship Program",
  description:
    "Hands-on internship tracks in Cloud, DevOps and AI application development, by CloudVidya Academy.",
};

// Rendered per request — the track list and application form are both
// admin/DB-driven now, same reasoning as every other data page in this app.
export const dynamic = "force-dynamic";

export default async function InternshipsPage() {
  const tracks = await getActiveInternshipTracks();

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      {/* Hero */}
      <div className="relative isolate -mx-4 overflow-hidden px-4 py-6 text-center sm:-mx-6 sm:px-6">
        <HeroGlow />
        <span className="bg-primary/15 text-primary mx-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Briefcase className="h-3.5 w-3.5" />
          CloudVidya Academy Internship Program
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Industry Internship Program
        </h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
          Hands-on internship tracks in Cloud, DevOps and AI application development: real projects,
          mentorship, and a certificate at the end.
        </p>
        <a
          href="#apply"
          className="bg-primary text-primary-foreground ring-offset-background focus-visible:ring-ring mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-[0_0_12px_hsl(var(--primary)/0.4)] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Apply Now
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <InternshipTrackPicker tracks={tracks}>
        {/* 4-week roadmap */}
        <Reveal>
          <div className="space-y-6">
            <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
              Your 4-week roadmap
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {INTERNSHIP_ROADMAP.map((step, i) => (
                <div key={step.week} className="bg-card relative space-y-2 rounded-2xl border p-5">
                  <span className="bg-primary text-primary-foreground absolute -top-3 left-5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-primary text-xs font-semibold uppercase tracking-wide">
                    {step.week}
                  </p>
                  <h3 className="text-sm font-bold leading-snug">{step.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Benefits */}
        <Reveal>
          <div className="space-y-6">
            <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
              Program benefits
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {PROGRAM_BENEFITS.map((benefit) => (
                <div
                  key={benefit}
                  className="bg-card flex items-center gap-3 rounded-xl border p-4 text-sm font-medium"
                >
                  <CheckCircle2 className="text-primary h-5 w-5 shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Deliverables */}
        <Reveal>
          <div className="bg-card space-y-4 rounded-2xl border p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              What you&apos;ll walk away with
            </h2>
            <ul className="space-y-3">
              {PROGRAM_DELIVERABLES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Assessment & certificate */}
        <Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-card space-y-3 rounded-2xl border p-6">
              <ClipboardCheck className="text-primary h-6 w-6" />
              <h3 className="text-lg font-bold">Project assessment</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                In Week 4, your mentor reviews your mini-project against the track&apos;s rubric and
                you present it live. Feedback covers both what you built and the decisions behind
                it.
              </p>
            </div>
            <div className="bg-card space-y-3 rounded-2xl border p-6">
              <Award className="text-primary h-6 w-6" />
              <h3 className="text-lg font-bold">Certificate eligibility</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Complete all 4 weeks, submit your project, and pass the final review to receive the
                CloudVidya Academy Internship Certificate.
              </p>
            </div>
          </div>
        </Reveal>
      </InternshipTrackPicker>
    </div>
  );
}
