"use client";

import { useEffect, useRef, useState } from "react";
import { m, type Variants } from "framer-motion";

// Generic below-the-fold reveal: fades/slides a section in once, the first
// time it scrolls into view. Deliberately NOT framer-motion's `whileInView`
// — profiling on the home page showed it forces a synchronous layout read
// (getBoundingClientRect, to check whether the element starts already in
// view) during its mount effect, which under mobile CPU throttling competed
// directly with the hero's own LCP paint for the main thread (confirmed by
// isolation testing: 5 whileInView instances cost ~1.9s of LCP). A plain,
// manually-registered IntersectionObserver is purely callback-driven and
// never forces a layout pass, so it can't compete with the hero's paint.
// Transform-only animation — MotionConfig's sitewide reducedMotion="user"
// (see providers.tsx) already skips the y-transform (keeps the opacity
// crossfade) when the OS has reduced motion enabled, so this needs no
// reduced-motion handling of its own.
export function Reveal({
  children,
  className,
  distance = 24,
}: {
  children: React.ReactNode;
  className?: string;
  /** Initial y-offset in px, animated to 0. Defaults to 24 (below-the-fold
   * sections); the auth-card mount reveal uses a subtler 8. */
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const variants: Variants = {
    hidden: { opacity: 0, y: distance },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <m.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </m.div>
  );
}
