import { ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";

export function JoinBanner({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="container pb-20">
      <div className="from-primary relative overflow-hidden rounded-3xl bg-gradient-to-r via-blue-600 to-violet-600 px-8 py-14 text-center text-white shadow-2xl sm:px-14">
        <div className="animate-blob absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-2xl motion-reduce:animate-none" />
        <div className="animate-blob absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-cyan-300/25 blur-2xl [animation-delay:-9s] motion-reduce:animate-none" />
        <div className="relative">
          <GraduationCap className="mx-auto h-10 w-10 text-white/90" />
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {signedIn ? "Keep the momentum going" : "Start your cloud journey today"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            {signedIn
              ? "Jump back into your courses and notes where you left off."
              : "Create a free account to enrol in courses, practise with quizzes and track your progress."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={signedIn ? "/profile" : "/auth?tab=register"}
              className="text-primary inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold shadow-lg transition-all hover:gap-3"
            >
              {signedIn ? "Go to my profile" : "Join now, it's free"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#browse"
              className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
