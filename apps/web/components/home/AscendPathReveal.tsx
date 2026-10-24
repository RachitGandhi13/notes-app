"use client";

import { useEffect, useRef, useState } from "react";

// Same ref + IntersectionObserver + one-shot-disconnect pattern as
// components/Reveal.tsx, but toggles a plain CSS class instead of a
// framer-motion variant — the Ascend-path draw-in (stroke-dashoffset,
// staggered dot/card scale + fade) is implemented entirely in CSS
// (globals.css's .ascend-path rules), per the "CSS only" motion spec.
// Never wraps the h1/lead/buttons, so LCP paint never waits on this.
export function AscendPathReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

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
    <div ref={ref} className={`ascend-path${inView ? " is-in-view" : ""} ${className ?? ""}`}>
      {children}
    </div>
  );
}
