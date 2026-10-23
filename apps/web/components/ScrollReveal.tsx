"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@repo/ui";

// Avra-style scroll reveal — words brighten in sequence, staggered, the first
// time the paragraph scrolls into view (once only, not on every scroll pass).
// Stays within the site's existing muted-foreground/foreground palette — this
// only animates brightness, not color or position.
export function ScrollReveal({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className={cn(
            "transition-colors duration-700 ease-out motion-reduce:transition-none motion-reduce:duration-0",
            revealed ? "text-muted-foreground" : "text-muted-foreground/15"
          )}
          style={{ transitionDelay: `${i * 30}ms` }}
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
