import type { ReactNode } from "react";
import { AnimatedBackdrop } from "@/components/home/AnimatedBackdrop";

// Shared field/button styling for every auth form (sign in, register, forgot
// password, reset password) so the four pages stay visually identical.
export const authInputClass =
  "flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-blue-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export const authLabelClass = "text-sm font-medium text-zinc-300";

export const authButtonClass =
  "min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <AnimatedBackdrop />
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
