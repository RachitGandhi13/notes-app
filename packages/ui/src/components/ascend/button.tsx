import Link from "next/link";
import * as React from "react";
import { cn } from "../../lib/utils";

// Ascend design system's button — intentionally a NEW, separate component
// from this package's existing `Button`. That shared one is used sitewide
// (admin, forms, modals, course/internship cards — all out of scope for
// this restyle), so its variants/classes stay frozen; this one only exists
// for the Ascend shell + home hero.
export type AscendButtonVariant = "primary" | "secondary" | "ghost";
export type AscendButtonSize = "md" | "lg";

interface BaseProps {
  variant?: AscendButtonVariant;
  size?: AscendButtonSize;
  className?: string;
  children: React.ReactNode;
}

type AscendButtonProps =
  | (BaseProps & { href: string } & Omit<
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        "className" | "children"
      >)
  | (BaseProps & { href?: undefined } & Omit<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        "className" | "children"
      >);

const sizeClass: Record<AscendButtonSize, string> = {
  md: "py-3 px-5 rounded-xl text-sm",
  lg: "py-3 px-8 rounded-xl text-sm",
};

// Colors route through the existing semantic tokens (bg-primary, bg-background,
// etc.) so light mode — out of scope for this restyle — renders exactly as it
// did before Phase 1. The `dark:` overrides carry the new Ascend hex values
// explicitly (not via --primary, which stays at its pre-Ascend value sitewide
// after the Phase-1 review sweep found it failed AA elsewhere on the page),
// plus the cyan glow/ring that's only designed for a black bg.
const variantClass: Record<AscendButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:shadow-lg dark:bg-[#0066FF] dark:text-white dark:hover:shadow-[0_0_0_1px_rgb(0_240_255_/_0.4),0_8px_32px_-8px_rgb(0_102_255_/_0.6)]",
  secondary:
    "bg-background text-foreground border border-input hover:bg-accent dark:bg-[#18181B] dark:text-[#FAFAFA] dark:border-white/[0.08] dark:hover:bg-[#18181B] dark:hover:border-white/[0.14]",
  ghost:
    "text-muted-foreground hover:text-foreground dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA]",
};

export const AscendButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  AscendButtonProps
>(({ variant = "primary", size = "md", className, children, href, ...props }, ref) => {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[box-shadow,border-color,color] duration-[144ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-[#00F0FF] dark:focus-visible:ring-offset-[#09090B] disabled:pointer-events-none disabled:opacity-50",
    sizeClass[size],
    variantClass[variant],
    className
  );

  if (href) {
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...(props as Omit<
          React.AnchorHTMLAttributes<HTMLAnchorElement>,
          "className" | "children"
        >)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      {...(props as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">)}
    >
      {children}
    </button>
  );
});
AscendButton.displayName = "AscendButton";
