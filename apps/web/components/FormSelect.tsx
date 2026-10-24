"use client";

import { cn } from "@repo/ui";
import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes } from "react";

// Native <select> renders the browser's own dropdown arrow with no way to
// restyle it — appearance-none strips that and this draws a matching chevron
// instead, so every <select> on the site matches its surrounding inputs
// instead of looking like a bare browser control.
export const FormSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }
>(function FormSelect({ className, wrapperClassName, ...props }, ref) {
  return (
    <div className={cn("relative inline-block", wrapperClassName)}>
      <select
        ref={ref}
        {...props}
        className={cn(
          "border-input bg-background h-11 w-full appearance-none rounded-xl border pl-3.5 pr-7 transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/5",
          className
        )}
      />
      <ChevronDown className="text-muted-foreground pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
    </div>
  );
});
