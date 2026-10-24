// Topics actually taught on the platform — same real list as before, now a
// flowing text marquee instead of icon pills.
const TOPICS = [
  "AWS Cloud",
  "DevOps",
  "CI/CD",
  "Terraform",
  "Docker",
  "Kubernetes",
  "Ansible",
  "Puppet",
  "Linux",
  "Infrastructure Automation",
  "AWS AI",
];

const EMPHASIS = new Set(["DevOps", "Kubernetes"]);
const SERIF_EMPHASIS = new Set(["Terraform", "Linux"]);

// Light mode: every word reads at full opacity in #3F3F46, no dim/emphasis
// distinction (that only exists against the dark background). Dark mode
// keeps the original emphasis (FAFAFA) / dim (71717A) treatment.
function Word({ label }: { label: string }) {
  if (EMPHASIS.has(label)) {
    return <span className="text-[#3F3F46] dark:text-[#FAFAFA]">{label}</span>;
  }
  if (SERIF_EMPHASIS.has(label)) {
    return <span className="serif-accent text-[#3F3F46] dark:text-[#FAFAFA]">{label}</span>;
  }
  return <span className="text-[#3F3F46] dark:text-[#71717A]">{label}</span>;
}

function Row() {
  return (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {TOPICS.map((label, i) => (
        <span key={i} className="font-display flex items-center gap-6 text-[32px] font-semibold">
          <Word label={label} />
          {<span className="text-[#0052CC] dark:text-[#00F0FF]">&rsaquo;</span>}
        </span>
      ))}
    </div>
  );
}

export function TechMarquee() {
  // Fixed-pixel fade zone (not a percentage) so exactly 64px fades at each
  // edge regardless of the marquee's rendered width.
  const mask =
    "linear-gradient(90deg, transparent, #000 64px, #000 calc(100% - 64px), transparent)";
  return (
    <section aria-label="Topics you will learn" className="overflow-hidden pb-[52px] pt-[84px]">
      <div className="group overflow-hidden" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        {/* the list twice, second copy aria-hidden, so the loop is seamless at -50% */}
        <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <Row />
          <div aria-hidden="true" className="contents">
            <Row />
          </div>
        </div>
      </div>
    </section>
  );
}
