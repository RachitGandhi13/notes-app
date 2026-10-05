import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, LineChart } from "lucide-react";
import Link from "next/link";

// An illustrative mock-up (not real content) of a notes section: slides on
// top, practice question underneath.
function NotesMockup() {
  return (
    <div
      aria-hidden="true"
      className="animate-float bg-card relative mx-auto w-full max-w-md rounded-2xl border shadow-2xl motion-reduce:animate-none"
      style={{ animationDuration: "8s" }}
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="bg-muted ml-3 h-4 w-40 rounded-full" />
      </div>

      <div className="space-y-4 p-5">
        <div className="from-primary relative overflow-hidden rounded-xl bg-gradient-to-br to-violet-600 p-5 text-white">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15" />
          <div className="absolute -bottom-8 right-10 h-20 w-20 rounded-full bg-white/10" />
          <p className="relative text-xs font-semibold uppercase tracking-wide text-white/70">
            Slides
          </p>
          <p className="relative mt-1 text-lg font-extrabold">Cloud computing basics</p>
          <div className="relative mt-3 space-y-1.5">
            <div className="h-1.5 w-3/4 rounded-full bg-white/40" />
            <div className="h-1.5 w-1/2 rounded-full bg-white/30" />
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Practice
          </p>
          <p className="text-sm font-semibold">Which service stores objects and files?</p>
          {[
            { label: "EBS", state: "wrong" },
            { label: "S3", state: "right" },
            { label: "RDS", state: "idle" },
          ].map(({ label, state }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                state === "right"
                  ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                  : state === "wrong"
                    ? "border-destructive/60 bg-destructive/10 text-destructive"
                    : ""
              }`}
            >
              {state === "right" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <span className="border-muted-foreground h-4 w-4 rounded-full border-2" />
              )}
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card absolute -bottom-5 -left-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold shadow-xl">
        <LineChart className="text-primary h-4 w-4" />
        Score 2 / 2
      </div>
    </div>
  );
}

export function NotesShowcase() {
  return (
    <section className="container pb-20">
      <div className="from-primary/10 to-card relative overflow-hidden rounded-3xl border bg-gradient-to-br via-cyan-500/5 p-8 sm:p-12">
        <div className="bg-primary/20 animate-blob absolute -left-16 -top-16 h-64 w-64 rounded-full blur-3xl motion-reduce:animate-none" />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-primary text-sm font-semibold uppercase tracking-wide">
              Study notes
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Learn with slides, then <span className="text-primary">practise</span> what you
              learned
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Every notes section comes with a slide deck and practice questions, so what you watch
              in the videos actually sticks.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                { Icon: FileText, text: "A slide deck for every section, right on the page" },
                {
                  Icon: ClipboardCheck,
                  text: "Practice questions with instant feedback. Try again as often as you like",
                },
                { Icon: LineChart, text: "Sign in and your quiz scores are saved to your profile" },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm">
                  <span className="bg-primary/15 text-primary mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <Link
              href="/notes"
              className="bg-primary text-primary-foreground mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-lg transition-all hover:gap-3 hover:shadow-xl"
            >
              Explore notes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <NotesMockup />
        </div>
      </div>
    </section>
  );
}
