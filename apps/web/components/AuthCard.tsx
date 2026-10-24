import type { ReactNode } from "react";
import { Aurora, Grain, GlassCard, HeroGrid, LogoEmblem } from "@repo/ui";
import { AnimatedBackdrop } from "@/components/home/AnimatedBackdrop";
import { Reveal } from "@/components/Reveal";

// Shared field/button styling for every auth form (sign in, register, forgot
// password, reset password) so the four pages stay visually identical.
export const authInputClass =
  "border-border flex h-11 w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-[#09090B] placeholder:text-[#71717A] transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-transparent dark:focus:bg-white/[0.07] dark:focus:ring-[#00F0FF] dark:focus:ring-offset-2 dark:focus:ring-offset-[#09090B]";

export const authLabelClass = "text-sm font-medium text-[#3F3F46] dark:text-zinc-300";

export const authButtonClass =
  "min-h-12 w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

export function AuthCard({
  title,
  subtitle,
  children,
  icon,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Replaces the default LogoEmblem — used by the status pages
   * (/verify, /invalidsession) to show a status-coloured circle instead. */
  icon?: ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Light mode: unchanged pre-Ascend backdrop (out of scope for this
          restyle). Dark mode: the Phase 2 Aurora + Grain + HeroGrid trio. */}
      <AnimatedBackdrop className="dark:hidden" />
      <Aurora variant="panel" />
      <Grain opacity={0.6} />
      <HeroGrid />

      <Reveal distance={8} className="relative w-full max-w-md">
        <GlassCard radius={32} className="space-y-6 p-5 sm:p-8">
          <div className="space-y-4 text-center">
            {icon ?? <LogoEmblem variant="compact" />}
            <div>
              <h1 className="font-display text-[26px] font-semibold leading-[32px] tracking-tight text-[#09090B] dark:text-white">
                {title}
              </h1>
              <p className="mt-1 text-sm leading-5 text-[#52525B] dark:text-zinc-400">{subtitle}</p>
            </div>
          </div>
          {children}
        </GlassCard>
      </Reveal>
    </div>
  );
}
