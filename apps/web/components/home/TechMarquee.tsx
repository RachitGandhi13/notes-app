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

function Word({ label }: { label: string }) {
  if (EMPHASIS.has(label)) {
    return <span className="text-[#FAFAFA]">{label}</span>;
  }
  if (SERIF_EMPHASIS.has(label)) {
    return <span className="serif-accent text-[#FAFAFA]">{label}</span>;
  }
  return <span className="text-[#71717A]">{label}</span>;
}

function Row() {
  return (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {TOPICS.map((label, i) => (
        <span key={i} className="font-display flex items-center gap-6 text-[32px] font-semibold">
          <Word label={label} />
          {<span className="text-[#00F0FF]">&rsaquo;</span>}
        </span>
      ))}
    </div>
  );
}

export function TechMarquee() {
  const mask = "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)";
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
