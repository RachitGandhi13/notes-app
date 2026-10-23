import { cn } from "../../lib/utils";

export function Section({
  children,
  className,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div";
}) {
  return (
    <Tag className={cn("py-13 sm:py-21", className)}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">{children}</div>
    </Tag>
  );
}
