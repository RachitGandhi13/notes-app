"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// Avra-style scroll reveal — words brighten in sequence, staggered, the first
// time the paragraph scrolls into view (once only, not on every scroll pass).
// Stays within the site's existing muted-foreground/foreground palette — this
// only animates opacity, not color or position.
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } },
};

const word: Variants = {
  hidden: { opacity: 0.12 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function ScrollReveal({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <p className={className}>{text}</p>;
  }

  return (
    <motion.p
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={container}
    >
      {words.map((w, i) => (
        <motion.span key={i} variants={word} className="text-muted-foreground">
          {w}{" "}
        </motion.span>
      ))}
    </motion.p>
  );
}
