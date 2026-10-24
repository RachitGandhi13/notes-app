import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/utils";

// Ascend v2 pill restyle. Variant names, sizes, defaults and ref all stay
// exactly as before — every existing call site across the app (admin, forms,
// dashboards) keeps working unchanged; only the underlying classes/colors
// changed, plus two new optional props (`icon`, `glow`) that do nothing
// unless a caller opts in.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Monochrome-inverted pill: white-on-black in dark mode, black-on-white
        // in light mode (not the old blue primary).
        default:
          "bg-[#09090B] text-white hover:opacity-90 dark:bg-[#FAFAFA] dark:text-[#09090B] font-semibold",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // Dark mode: glass pill. Light mode unchanged (no glass spec given for it).
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:border dark:border-white/[0.14] dark:bg-white/5 dark:text-white dark:backdrop-blur-[12px] dark:hover:bg-white/[0.08]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-11 px-4 py-2 lg:h-10",
        sm: "h-11 px-3 lg:h-9",
        lg: "h-14 px-8",
        icon: "h-11 w-11 lg:h-10 lg:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const GLOW_CLASS =
  "shadow-[0_0_0_6px_rgb(255_255_255_/_0.06),0_20px_60px_-12px_rgb(0_240_255_/_0.45)]";

function IconCircle({ icon }: { icon: React.ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-white">
      {icon}
    </span>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Optional trailing icon rendered in its own 40px accent circle, per the
   * Ascend v2 primary-CTA spec. Omit it to render children exactly as before.
   */
  icon?: React.ReactNode;
  /** Hero-CTA-only glow box-shadow. Opt-in, off by default. */
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, glow = false, children, ...props }, ref) => {
    const classes = cn(
      buttonVariants({ variant, size, className }),
      icon && "pr-2",
      glow && GLOW_CLASS
    );

    if (asChild) {
      // Slot requires exactly one child element — when there's an icon, it
      // has to be injected *inside* that single child (via cloneElement)
      // rather than rendered as a sibling, or Slot throws at runtime.
      const onlyChild = React.Children.only(children) as React.ReactElement;
      const content = icon ? (
        <>
          {onlyChild.props.children}
          <IconCircle icon={icon} />
        </>
      ) : (
        onlyChild.props.children
      );
      return (
        <Slot className={classes} ref={ref} {...props}>
          {React.cloneElement(onlyChild, undefined, content)}
        </Slot>
      );
    }

    return (
      <button className={classes} ref={ref as React.Ref<HTMLButtonElement>} {...props}>
        {children}
        {icon && <IconCircle icon={icon} />}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
