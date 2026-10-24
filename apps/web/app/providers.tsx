"use client";

import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { RecoilRoot } from "recoil";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RecoilRoot>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {/* Site-wide: every motion.* component skips transform/layout animation
              (keeps opacity) when the OS has reduced-motion enabled, so individual
              components don't each need their own useReducedMotion() check. */}
          <MotionConfig reducedMotion="user">
            <LazyMotion features={domAnimation} strict>
              {children}
            </LazyMotion>
          </MotionConfig>
        </ThemeProvider>
      </RecoilRoot>
    </SessionProvider>
  );
}
