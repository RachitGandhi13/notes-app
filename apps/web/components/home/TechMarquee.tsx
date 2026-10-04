import {
  Box,
  Boxes,
  Cloud,
  Container,
  GitBranch,
  Layers,
  Sparkles,
  Terminal,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// Topics taken from what the instructor actually teaches (see lib/instructor.ts
// and his bio) — no logos, just names.
const TOPICS: { Icon: LucideIcon; label: string }[] = [
  { Icon: Cloud, label: "AWS Cloud" },
  { Icon: Workflow, label: "DevOps" },
  { Icon: GitBranch, label: "CI/CD" },
  { Icon: Layers, label: "Terraform" },
  { Icon: Container, label: "Docker" },
  { Icon: Boxes, label: "Kubernetes" },
  { Icon: Box, label: "Ansible" },
  { Icon: Box, label: "Puppet" },
  { Icon: Terminal, label: "Linux" },
  { Icon: Workflow, label: "Infrastructure Automation" },
  { Icon: Sparkles, label: "AWS AI" },
];

function Row() {
  return (
    <ul className="flex shrink-0 items-center gap-3 pr-3">
      {TOPICS.map(({ Icon, label }) => (
        <li
          key={label}
          className="bg-card flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm"
        >
          <Icon className="text-primary h-4 w-4" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function TechMarquee() {
  return (
    <section aria-label="Topics you will learn" className="border-b py-8">
      <p className="text-muted-foreground mb-4 text-center text-xs font-semibold uppercase tracking-widest">
        What you&apos;ll learn
      </p>
      <div className="group overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {/* the list twice, so the loop is seamless at -50% */}
        <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <Row />
          <Row />
        </div>
      </div>
    </section>
  );
}
