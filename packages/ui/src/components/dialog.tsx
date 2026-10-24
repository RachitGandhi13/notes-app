"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 dark:backdrop-blur-sm",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Suppresses the grab-bar/top-glow decoration and the close button's
     * backdrop chip — for bare content like the gallery lightbox that fully
     * overrides background/border/shadow itself. Defaults to showing them. */
    hideChrome?: boolean;
  }
>(({ className, children, hideChrome, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Below sm: anchored to the bottom edge (reachable one-handed, respects
        // the home-indicator safe area), slides up, square top corners rounded.
        // At sm and up: the original centered, zoom-in popup — unchanged.
        "safe-bottom data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%] bg-card border-border sm:rounded-shell fixed inset-x-0 bottom-0 top-auto z-50 grid max-h-[85vh] w-full translate-x-0 translate-y-0 gap-4 overflow-y-auto rounded-t-[32px] border p-5 shadow-lg duration-[233ms] ease-[var(--cv-ease)] data-[state=closed]:duration-[144ms] sm:inset-x-auto sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-h-[90vh] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:p-8 dark:border-white/[0.12] dark:bg-[rgb(20_20_24_/_0.86)] dark:backdrop-blur-[24px] dark:[box-shadow:inset_0_1px_0_rgb(255_255_255_/_0.08),0_40px_120px_-30px_rgb(0_0_0_/_0.8)]",
        className
      )}
      {...props}
    >
      {!hideChrome && (
        <>
          {/* Mobile bottom-sheet grab bar — decorative, dark only */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-3 hidden h-1 w-9 -translate-x-1/2 rounded-full bg-white/20 sm:hidden dark:block"
          />
          {/* Top glow — decorative, dark only */}
          <div
            aria-hidden="true"
            className="sm:rounded-t-shell absolute inset-x-0 top-0 hidden h-32 rounded-t-[32px] dark:block"
            style={{
              backgroundImage:
                "radial-gradient(60% 50% at 50% 0%, rgb(0 102 255 / 0.18), transparent 70%)",
            }}
          />
        </>
      )}
      {children}
      <DialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full opacity-70 transition-opacity hover:bg-white/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogClose>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("relative flex flex-col gap-2 text-center sm:text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("relative flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-[26px] font-semibold leading-[32px] tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm leading-5", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
