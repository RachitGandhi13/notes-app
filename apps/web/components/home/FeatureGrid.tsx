import {
  ClipboardCheck,
  FileText,
  HeartHandshake,
  LineChart,
  ListChecks,
  MessagesSquare,
  MonitorPlay,
  Rocket,
  type LucideIcon,
} from "lucide-react";

// Every card describes something the platform really does.
const FEATURES: { Icon: LucideIcon; title: string; text: string; tint: string }[] = [
  {
    Icon: Rocket,
    title: "Project-based learning",
    text: "Build real infrastructure and pipelines, guided step by step, not just slides.",
    tint: "from-blue-500 to-cyan-400",
  },
  {
    Icon: MonitorPlay,
    title: "Learn at your own pace",
    text: "Pause, replay and revisit video lessons anytime, with lifetime access to every course you join.",
    tint: "from-violet-500 to-fuchsia-400",
  },
  {
    Icon: FileText,
    title: "Notes & slides",
    text: "Structured notes with a slide deck for each section, right alongside the videos.",
    tint: "from-emerald-500 to-teal-400",
  },
  {
    Icon: ClipboardCheck,
    title: "Learn from your mistakes",
    text: "Test yourself with multiple-choice questions, see the answers, and try again.",
    tint: "from-amber-500 to-orange-400",
  },
  {
    Icon: LineChart,
    title: "Progress tracking",
    text: "Mark lessons complete, bookmark favourites and pick up right where you left off.",
    tint: "from-sky-500 to-indigo-400",
  },
  {
    Icon: ListChecks,
    title: "Section reviews",
    text: "Check what you've learned with multiple-choice questions after every section.",
    tint: "from-rose-500 to-pink-400",
  },
  {
    Icon: MessagesSquare,
    title: "Ask & discuss",
    text: "Comment and ask questions on every video, and learn from other students.",
    tint: "from-cyan-500 to-blue-400",
  },
  {
    Icon: HeartHandshake,
    title: "Real support",
    text: "Stuck? Email the academy and get help from the team behind the courses.",
    tint: "from-lime-500 to-emerald-400",
  },
];

export function FeatureGrid() {
  return (
    <section className="container py-12 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-primary text-sm font-semibold uppercase tracking-wide">
          Why CloudVidya Academy
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything you need to go from learning to <span className="text-primary">doing</span>
        </h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Video courses, notes and quizzes. All in one place, built around hands-on AWS and DevOps
          training.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ Icon, title, text, tint }, i) => (
          <div
            key={title}
            className="bg-card hover:border-primary/40 group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          >
            <div className="bg-primary/10 group-hover:bg-primary/20 absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-colors" />
            <span
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${tint}`}
            >
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="relative mt-5 text-base font-bold">{title}</h3>
            <p className="text-muted-foreground relative mt-2 text-sm leading-relaxed">{text}</p>
            <span className="text-muted-foreground/40 absolute right-4 top-4 text-xs font-bold tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
