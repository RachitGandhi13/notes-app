import { cn } from "../../lib/utils";

/** The chrome-bar + white window body. aria-hidden — it's a visual mockup, not real UI. */
export function WindowChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[14px] border border-[#E4E4E7] bg-white shadow-[0_20px_40px_-20px_rgb(0_0_0_/_0.6)]"
    >
      <div className="flex h-9 items-center justify-between border-b border-[#F4F4F5] px-3.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
        </div>
        <div className="flex items-center gap-2 text-[#A1A1AA]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.6 3.6A2 2 0 0 0 4.57 22h14.86a2 2 0 0 0 1.97-1.4L22 17"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="18" cy="5" r="3" strokeWidth="2" />
            <circle cx="6" cy="12" r="3" strokeWidth="2" />
            <circle cx="18" cy="19" r="3" strokeWidth="2" />
            <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" strokeWidth="2" />
          </svg>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" />
          </svg>
        </div>
      </div>
      <div className="h-[200px] p-5 sm:h-64">{children}</div>
    </div>
  );
}

export function WindowCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card border-border group rounded-2xl border p-5 shadow-[0_20px_40px_-20px_rgb(0_0_0_/_0.15)] transition-[transform,border-color] duration-[144ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:rounded-[24px] dark:border-white/[0.08] dark:bg-[#161618] dark:shadow-none dark:hover:border-white/[0.16]",
        className
      )}
    >
      <WindowChrome>{children}</WindowChrome>
      <h3 className="font-display mt-5 text-xl font-semibold leading-7">{title}</h3>
      <p className="mt-2 text-base leading-[26px] text-[#52525B] dark:text-[#A1A1AA]">
        {description}
      </p>
    </div>
  );
}
