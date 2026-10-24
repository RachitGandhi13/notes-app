import type { ReactNode } from "react";
import { cn } from "@repo/ui";

// Shared eyebrow label used above a section's <h2> sitewide.
export function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-primary text-sm font-semibold uppercase tracking-wide", className)}>
      {children}
    </p>
  );
}
