import { ArrowRight, Briefcase, Clock } from "lucide-react";
import Link from "next/link";
import { INTERNSHIP_TRACKS } from "@/lib/internships";

// A static CTA card, not backed by a Course record — sits alongside real
// course cards in the homepage grid, so it mirrors CourseCard's shell
// (image area + padded content + bordered footer row) for visual consistency.
export function InternshipCard() {
  return (
    <Link href="/internships" className="group block">
      <div className="bg-card hover:border-primary/30 overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="from-primary/30 relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br to-violet-500/30 p-4 text-center">
          <Briefcase className="text-primary/70 h-10 w-10" />
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
            <Clock className="h-3 w-3" />
            {INTERNSHIP_TRACKS.length} tracks · {INTERNSHIP_TRACKS[0]!.duration}
          </span>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h3 className="line-clamp-1 text-base font-semibold leading-snug tracking-tight">
              Industry Internship Program
            </h3>
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-relaxed">
              AWS Cloud, DevOps &amp; Automation, and AI &amp; Cloud App Dev — hands-on, mentored,
              with a certificate on completion.
            </p>
          </div>

          <div className="flex items-center border-t pt-3">
            <span className="ml-auto flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              Apply now <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
