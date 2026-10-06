// import Image from "next/image"; // Re-enable with the instructor photo below.
import {
  Award,
  Cloud,
  Container,
  Database,
  GitBranch,
  LineChart,
  ListChecks,
  Server,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { instructor } from "@/lib/instructor";

// Infrastructure "nodes" around the photo, linked to it by animated dashed
// lines. Coordinates are percentages of the 520×520 artboard.
const NODES: { Icon: LucideIcon; x: number; y: number; delay: string }[] = [
  { Icon: Cloud, x: 9, y: 9, delay: "0s" },
  { Icon: Server, x: 91, y: 8, delay: "-1.4s" },
  { Icon: Database, x: 96, y: 56, delay: "-2.8s" },
  { Icon: Container, x: 4, y: 60, delay: "-4.2s" },
  { Icon: GitBranch, x: 50, y: 93, delay: "-5.6s" },
];

const CARDS: {
  Icon: LucideIcon;
  title: string;
  text: string;
  className: string;
  delay: string;
}[] = [
  {
    Icon: Award,
    title: `${instructor.certifications.length} AWS certifications`,
    text: "Taught by an AWS-certified expert",
    className: "left-[-6%] top-[16%]",
    delay: "0s",
  },
  {
    Icon: Terminal,
    title: "Project-based",
    text: "Learn by building, not just watching",
    className: "right-[-7%] top-[30%]",
    delay: "-2s",
  },
  {
    Icon: LineChart,
    title: "Track your progress",
    text: "Pick up right where you left off",
    className: "left-[-3%] bottom-[2%]",
    delay: "-4s",
  },
  {
    Icon: ListChecks,
    title: "Section reviews",
    text: "Test yourself as you go",
    className: "right-[-2%] bottom-[2%]",
    delay: "-1s",
  },
];

export function HeroArt() {
  return (
    <div
      aria-hidden="true"
      className="animate-fade-up relative mx-auto aspect-square w-full max-w-[520px] [animation-delay:250ms]"
    >
      {/* rotating dashed orbit + pulsing rings */}
      <div className="border-primary/30 animate-spin-slow absolute inset-[6%] rounded-full border-2 border-dashed motion-reduce:animate-none" />
      <div className="border-primary/20 absolute inset-[16%] rounded-full border" />
      <div className="border-primary/40 animate-pulse-ring absolute inset-[24%] rounded-full border-2 motion-reduce:animate-none" />
      <div className="border-primary/40 animate-pulse-ring absolute inset-[24%] rounded-full border-2 [animation-delay:-1.4s] motion-reduce:animate-none" />

      {/* animated links from the centre out to each node */}
      <svg viewBox="0 0 520 520" className="absolute inset-0 h-full w-full">
        {NODES.map(({ x, y }, i) => (
          <line
            key={i}
            x1="260"
            y1="260"
            x2={(x / 100) * 520}
            y2={(y / 100) * 520}
            className="stroke-primary/50 animate-dash motion-reduce:animate-none"
            strokeWidth="1.5"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {NODES.map(({ Icon, x, y, delay }, i) => (
        <div
          key={i}
          className="bg-card border-primary/30 text-primary animate-float absolute flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg motion-reduce:animate-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            marginLeft: -24,
            marginTop: -24,
            animationDelay: delay,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      ))}

      {/* Instructor photo and name, hidden for now. To restore, delete the comment markers below
      and re-enable the `Image` import at the top of this file.
      <div className="absolute left-1/2 top-[45%] h-[64%] w-[54%] -translate-x-1/2 -translate-y-1/2">
        <div className="from-primary absolute -inset-1 rounded-[2rem] bg-gradient-to-br via-cyan-400 to-violet-500 opacity-90 blur-[2px]" />
        <div className="bg-card relative h-full w-full overflow-hidden rounded-[1.8rem]">
          <Image
            src={instructor.photo}
            alt=""
            fill
            priority
            sizes="300px"
            className="object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10">
            <p className="text-sm font-bold text-white">{instructor.name}</p>
            <p className="text-xs text-white/80">Founder, CloudVidya Academy</p>
          </div>
        </div>
      </div>
      */}

      {/* floating glass cards */}
      {CARDS.map(({ Icon, title, text, className, delay }) => (
        <div
          key={title}
          className={`bg-card/85 animate-float absolute z-10 flex w-[15.5rem] items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur motion-reduce:animate-none ${className}`}
          style={{ animationDelay: delay, animationDuration: "7s" }}
        >
          <span className="bg-primary/15 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight">{title}</span>
            <span className="text-muted-foreground block text-xs leading-snug">{text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
