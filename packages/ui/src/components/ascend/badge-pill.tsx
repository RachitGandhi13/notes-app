import { cn } from "../../lib/utils";

export function BadgePill({
  children,
  chip,
  className,
}: {
  children: React.ReactNode;
  /** Optional inner mono chip, e.g. "AWS", with a glowing dot. */
  chip?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/5 py-1.5 pl-1.5 pr-4 text-sm text-[#D4D4D8] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]",
        className
      )}
    >
      {chip && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00F0FF]/[0.12] px-2.5 py-1 font-mono text-xs text-[#00F0FF]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]"
          />
          {chip}
        </span>
      )}
      {children}
    </div>
  );
}
