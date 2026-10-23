import { cn } from "../../lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-eyebrow text-primary inline-flex items-center gap-2 uppercase dark:text-[#00F0FF]",
        className
      )}
      style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
