import { cn } from "../../lib/utils";

export function Card({
  children,
  className,
  featured = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Gradient border instead of the plain 1px white/8 border. */
  featured?: boolean;
}) {
  if (featured) {
    return (
      <div
        className={cn("rounded-card p-[1px]", className)}
        style={{ background: "linear-gradient(45deg, #0066FF, #00F0FF)" }}
      >
        <div className="rounded-[19px] bg-[#18181B] p-5 sm:p-8">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-card border border-white/[0.08] bg-[#18181B] p-5 sm:p-8", className)}
    >
      {children}
    </div>
  );
}
