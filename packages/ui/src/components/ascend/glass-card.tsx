import { cn } from "../../lib/utils";

export function GlassCard({
  children,
  className,
  radius = 24,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** border-radius in px. Defaults to 24. */
  radius?: number;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={cn("glass-card bg-card border-border border", className)}
      style={{ borderRadius: radius }}
    >
      {children}
    </Tag>
  );
}
