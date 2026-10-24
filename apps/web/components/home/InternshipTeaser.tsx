import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AscendButton, GlassCard } from "@repo/ui";
import { INTERNSHIP_ROADMAP } from "@/lib/internships";

interface Track {
  id: string;
  title: string;
  duration: string;
  description: string;
}

const ACCENTS = ["#0066FF", "#00F0FF", "#7C5CFF", "#FFB547", "#34D399", "#B4A7FF"];

export function InternshipTeaser({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) return null;

  return (
    <section className="sm:py-21 border-t py-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.618fr] lg:gap-16">
        {/* Left */}
        <div className="lg:sticky lg:top-[120px] lg:self-start">
          <p className="text-eyebrow uppercase text-[#B4A7FF]">Internships</p>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Hands-on <span className="serif-accent">Internship</span> tracks
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md leading-relaxed">
            Hands-on internship tracks in Cloud, DevOps and AI application development: real
            projects, mentorship, and a certificate at the end.
          </p>
          <AscendButton
            asChild
            size="lg"
            className="mt-6"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            <Link href="/internships#apply">Apply Now</Link>
          </AscendButton>
          <p className="text-muted-foreground mt-4 text-sm">
            {tracks.length} tracks &middot; 4 to 8 weeks
          </p>
        </div>

        {/* Right: track list + roadmap */}
        <div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {tracks.map((track, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              const isLong = track.duration.toLowerCase().includes("6-8");
              return (
                <Link
                  key={track.id}
                  href="/internships"
                  className="group flex items-start gap-4 py-5 transition-colors hover:bg-white/[0.04] sm:items-center sm:gap-6"
                >
                  <span
                    className="w-8 shrink-0 font-mono text-sm transition-transform duration-[144ms] group-hover:translate-x-1"
                    style={{ color: accent }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl font-semibold sm:text-[22px]">
                      {track.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
                      {track.description}
                    </p>
                  </div>
                  <span
                    className={
                      isLong
                        ? "shrink-0 rounded-full bg-[#FAFAFA] px-3 py-1 text-xs font-semibold text-[#09090B]"
                        : "text-muted-foreground shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs"
                    }
                  >
                    {track.duration}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Roadmap */}
          <div className="mt-16">
            <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Your 4-week <span className="serif-accent">roadmap</span>
            </h3>
            <div className="relative mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-5 hidden h-[2px] lg:block"
                style={{
                  backgroundImage: "linear-gradient(90deg, #0066FF, #00F0FF, #B4A7FF)",
                  boxShadow: "0 0 12px rgb(0 240 255 / 0.5)",
                }}
              />
              {INTERNSHIP_ROADMAP.map((step, i) => (
                <div key={step.week} className="relative">
                  <span
                    className="relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm font-semibold text-white"
                    style={{ backgroundColor: ACCENTS[i % ACCENTS.length] }}
                  >
                    {i + 1}
                  </span>
                  <GlassCard className="p-5">
                    <p className="text-eyebrow uppercase text-[#B4A7FF]">{step.week}</p>
                    <h4 className="font-display mt-1 font-semibold">{step.title}</h4>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
