import { cn } from "@repo/ui";

// Decorative background for a hero: a faint grid that fades out toward the
// edges plus three slowly drifting blurred colour blobs. Pure CSS, no
// JavaScript, and the motion switches off for people who ask for reduced
// motion. Place it inside a `relative` container; it fills it.
export function AnimatedBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div className="from-primary/[0.07] absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-70 [-webkit-mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)] [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" />
      <div className="bg-primary/25 animate-blob absolute -left-28 top-6 h-80 w-80 rounded-full blur-3xl motion-reduce:animate-none" />
      <div className="animate-blob absolute right-[-4rem] top-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl [animation-delay:-6s] motion-reduce:animate-none" />
      <div className="animate-blob absolute bottom-[-3rem] left-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl [animation-delay:-12s] motion-reduce:animate-none" />
    </div>
  );
}
