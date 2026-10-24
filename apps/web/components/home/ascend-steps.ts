// Plain data, no "use client" — shared between AscendHero.tsx (server) and
// AscendPathLayer.tsx (client). A client module's non-component exports
// (like a plain array) aren't reliably readable from server code once
// webpack wraps the module as a client reference in a production build,
// even though it can appear to work in dev — so this stays its own module
// rather than being exported from AscendPathLayer.
export const STEPS = [
  { n: "STEP 01", title: "Learn the foundations", description: "Video lessons, notes and slides" },
  {
    n: "STEP 02",
    title: "Build real projects",
    description: "Learn by building, not just watching",
  },
  { n: "STEP 03", title: "Test yourself", description: "Section reviews and quizzes" },
  { n: "STEP 04", title: "Get certified on AWS", description: "With cloud experts" },
] as const;
