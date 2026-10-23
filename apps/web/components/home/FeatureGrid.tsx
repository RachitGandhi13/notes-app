import { CheckCircle2, Circle, Copy, Download, Play, Share2, XCircle } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { HeroGlow } from "@/components/home/HeroGlow";

// Decorative "browser window" chrome around each card's mockup — traffic-light
// dots + generic toolbar icons, same treatment regardless of what's inside.
function WindowChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-black/5 bg-white px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <Download className="h-3 w-3" />
          <Share2 className="h-3 w-3" />
          <Plus className="h-3 w-3" />
          <Copy className="h-3 w-3" />
        </div>
      </div>
      <div className="aspect-[4/3]">{children}</div>
    </div>
  );
}

// Plus isn't used elsewhere in this file, imported alongside the other toolbar icons.
function Plus({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function CodeMockup() {
  return (
    <div className="flex h-full flex-col gap-2 bg-white p-4 font-mono text-[11px] leading-relaxed">
      <div className="flex items-center gap-1.5 text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        main.tf
      </div>
      <div className="space-y-1 text-zinc-500">
        <p>
          <span className="text-violet-600">resource</span>{" "}
          <span className="text-emerald-600">&quot;aws_instance&quot;</span> &quot;app&quot; {"{"}
        </p>
        <p className="pl-3">
          ami &nbsp;= <span className="text-amber-600">&quot;ami-0abc&quot;</span>
        </p>
        <p className="pl-3">
          type = <span className="text-amber-600">&quot;t3.micro&quot;</span>
        </p>
        <p>{"}"}</p>
      </div>
      <div className="mt-auto flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5 text-emerald-700">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        Apply complete — 3 resources
      </div>
    </div>
  );
}

function VideoMockup() {
  return (
    <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg">
        <Play className="ml-0.5 h-5 w-5 fill-current" />
      </span>
      <div className="absolute inset-x-3 bottom-3 space-y-1.5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-2/3 rounded-full bg-blue-500" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span>Module 3 · VPC Networking</span>
          <span>12:04 / 18:30</span>
        </div>
      </div>
    </div>
  );
}

function NotesMockup() {
  return (
    <div className="grid h-full grid-cols-2 gap-3 bg-white p-4">
      <div className="flex flex-col justify-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 p-2.5">
        <div className="h-2 w-3/4 rounded bg-blue-300" />
        <div className="h-10 w-full rounded bg-blue-200/70" />
        <div className="h-1.5 w-1/2 rounded bg-blue-300/80" />
      </div>
      <div className="flex flex-col justify-center gap-2">
        <div className="h-1.5 w-full rounded bg-zinc-200" />
        <div className="h-1.5 w-5/6 rounded bg-zinc-200" />
        <div className="h-1.5 w-full rounded bg-zinc-200" />
        <div className="h-1.5 w-2/3 rounded bg-zinc-200" />
      </div>
    </div>
  );
}

function QuizMockup() {
  return (
    <div className="flex h-full flex-col gap-2 bg-white p-4">
      <div className="h-2 w-5/6 rounded bg-zinc-200" />
      <div className="mt-1 space-y-1.5">
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <div className="h-1.5 w-2/3 rounded bg-emerald-300" />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5">
          <Circle className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
          <div className="h-1.5 w-1/2 rounded bg-zinc-200" />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5">
          <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
          <div className="h-1.5 w-3/5 rounded bg-red-200" />
        </div>
      </div>
      <span className="mt-auto text-[10px] font-medium text-zinc-400">Score: 2/2 correct</span>
    </div>
  );
}

function ProgressMockup() {
  const lessons = ["EC2 & Networking", "S3 & Storage", "IAM & Security"];
  return (
    <div className="flex h-full flex-col justify-between bg-white p-4">
      <div className="space-y-2">
        {lessons.map((lesson, i) => (
          <div key={lesson} className="flex items-center gap-2">
            {i < 2 ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
            )}
            <span className="text-[11px] text-zinc-600">{lesson}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span>Course progress</span>
          <span className="font-semibold text-blue-600">73%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full w-[73%] rounded-full bg-blue-500" />
        </div>
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="flex h-full flex-col justify-end gap-2 bg-white p-4">
      <div className="flex items-start gap-2">
        <span className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-400" />
        <div className="rounded-xl rounded-tl-sm bg-zinc-100 px-2.5 py-1.5 text-[11px] text-zinc-700">
          Why is the subnet unreachable?
        </div>
      </div>
      <div className="flex items-start justify-end gap-2">
        <div className="rounded-xl rounded-tr-sm bg-blue-500 px-2.5 py-1.5 text-[11px] text-white">
          Check the route table&apos;s NAT Gateway
        </div>
        <span className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400" />
      </div>
    </div>
  );
}

// Six of the site's eight real features, picked for how well each one reads as
// a small mockup — "Section reviews" and "Real support" stayed off this grid
// since they'd mostly repeat the quiz/chat cards visually.
const FEATURES: { title: string; text: string; Mockup: () => JSX.Element }[] = [
  {
    title: "Project-based learning",
    text: "Build real infrastructure and pipelines, guided step by step, not just slides.",
    Mockup: CodeMockup,
  },
  {
    title: "Learn at your own pace",
    text: "Pause, replay and revisit video lessons anytime, with lifetime access to every course you join.",
    Mockup: VideoMockup,
  },
  {
    title: "Notes & slides",
    text: "Structured notes with a slide deck for each section, right alongside the videos.",
    Mockup: NotesMockup,
  },
  {
    title: "Learn from your mistakes",
    text: "Test yourself with multiple-choice questions, see the answers, and try again.",
    Mockup: QuizMockup,
  },
  {
    title: "Progress tracking",
    text: "Mark lessons complete, bookmark favourites and pick up right where you left off.",
    Mockup: ProgressMockup,
  },
  {
    title: "Ask & discuss",
    text: "Comment and ask questions on every video, and learn from other students.",
    Mockup: ChatMockup,
  },
];

export function FeatureGrid() {
  return (
    <section className="relative isolate overflow-hidden py-12 sm:py-20">
      <HeroGlow />
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Why CloudVidya Academy</SectionEyebrow>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need to go from learning to <span className="text-primary">doing</span>
          </h2>
          <ScrollReveal
            text="Video courses, notes and quizzes. All in one place, built around hands-on AWS and DevOps training."
            className="mt-3 leading-relaxed"
          />
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, text, Mockup }) => (
            <div
              key={title}
              className="bg-card group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5"
            >
              <WindowChrome>
                <Mockup />
              </WindowChrome>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
