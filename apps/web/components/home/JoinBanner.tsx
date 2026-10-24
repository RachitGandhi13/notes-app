import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AscendButton, Aurora, Grain, ThemedLogo } from "@repo/ui";

export function JoinBanner({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="sm:py-21 px-5 py-16 sm:px-8">
      <div className="bg-card border-border dark:border-white/12 relative mx-auto max-w-7xl overflow-hidden rounded-[40px] border px-5 py-16 text-center shadow-[0_20px_40px_-20px_rgb(0_0_0_/_0.15)] sm:px-8 sm:py-[116px] dark:shadow-none">
        <Aurora variant="panel" accent="#0066FF" accent2="#00F0FF" />
        <Grain opacity={0.9} />
        <div className="relative mx-auto max-w-2xl">
          <ThemedLogo
            layout="mark"
            height={120}
            title=""
            className="mx-auto dark:[filter:drop-shadow(0_0_40px_rgb(0_240_255_/_0.6))]"
          />
          <h2
            className="font-display mt-6"
            style={{ fontSize: "clamp(42px, 6vw, 88px)", lineHeight: 1.02 }}
          >
            {signedIn ? (
              "Keep the momentum going"
            ) : (
              <>
                Start your cloud journey <span className="serif-accent">today</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#52525B] dark:text-[#A1A1AA]">
            {signedIn
              ? "Jump back into your courses and notes where you left off."
              : "Create a free account to enrol in courses, practise with quizzes and track your progress."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AscendButton asChild size="lg" icon={<ArrowRight className="h-4 w-4" />}>
              <Link href={signedIn ? "/profile" : "/auth?tab=register"}>
                {signedIn ? "Go to my profile" : "Join now, it's free"}
              </Link>
            </AscendButton>
            <AscendButton asChild variant="secondary" size="lg">
              <Link href="/#browse">Browse courses</Link>
            </AscendButton>
          </div>
        </div>
      </div>
    </section>
  );
}
