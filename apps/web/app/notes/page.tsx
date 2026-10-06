import { BookOpen, ClipboardCheck, Presentation } from "lucide-react";
import Image from "next/image";
import { getTracks } from "@/lib/track-actions";
import { getUserPurchases } from "@/lib/actions";
import { TrackCard } from "@/components/TrackCard";
import { AnimatedBackdrop } from "@/components/home/AnimatedBackdrop";

// Rendered per request. Prerendering at build time would need the database and
// Redis during `next build`, which the Docker build doesn't have. The track list
// is still cached in Redis (see lib/track-actions.ts).
export const dynamic = "force-dynamic";

const STEPS = [
  { Icon: BookOpen, title: "Pick a track", text: "Choose a topic and see its sections in order." },
  {
    Icon: Presentation,
    title: "Study the slides",
    text: "Every section has a slide deck, right on the page.",
  },
  {
    Icon: ClipboardCheck,
    title: "Practise",
    text: "Answer the practice questions and try again until it clicks.",
  },
];

export default async function NotesPage() {
  const tracks = await getTracks();
  const purchasedCourseIds = new Set((await getUserPurchases()).map((p) => p.courseId));
  const sectionCount = tracks.reduce((sum, t) => sum + t.problems.length, 0);

  const stats = [
    tracks.length > 0 && {
      value: String(tracks.length),
      label: tracks.length === 1 ? "Track" : "Tracks",
    },
    sectionCount > 0 && {
      value: String(sectionCount),
      label: sectionCount === 1 ? "Section" : "Sections",
    },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl border px-5 py-10 text-center sm:px-12 sm:py-20">
        <AnimatedBackdrop />

        <div className="mx-auto max-w-2xl space-y-7">
          <div className="bg-card/80 animate-fade-up inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm shadow-sm backdrop-blur">
            <Image
              src="/cloudvidya.png"
              alt=""
              width={20}
              height={20}
              className="rounded-full object-cover"
            />
            <span className="text-muted-foreground">Notes by CloudVidya Academy</span>
          </div>

          <h1 className="animate-fade-up text-5xl font-extrabold leading-[1.08] tracking-tight [animation-delay:80ms] sm:text-6xl">
            Learn at your own{" "}
            <span className="animate-gradient-shift from-primary bg-gradient-to-r via-cyan-400 to-violet-500 bg-[length:200%_auto] bg-clip-text text-transparent motion-reduce:animate-none">
              pace
            </span>
          </h1>
          <p className="text-muted-foreground animate-fade-up mx-auto max-w-lg text-lg leading-relaxed [animation-delay:160ms]">
            Structured learning tracks with slides and practice quizzes, bundled with our video
            courses.
          </p>

          {stats.length > 0 && (
            <dl className="animate-fade-up mx-auto flex max-w-xs justify-center gap-3 [animation-delay:240ms]">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-card/80 flex min-w-[6.5rem] flex-col rounded-xl border px-5 py-3 backdrop-blur"
                >
                  <dd className="text-2xl font-extrabold tracking-tight">{value}</dd>
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* How it works */}
      <section aria-label="How notes work" className="grid gap-5 sm:grid-cols-3">
        {STEPS.map(({ Icon, title, text }, i) => (
          <div
            key={title}
            className="bg-card hover:border-primary/40 group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <span className="text-primary/15 absolute right-4 top-2 text-6xl font-extrabold">
              {i + 1}
            </span>
            <span className="from-primary relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br to-cyan-400 text-white shadow-lg transition-transform group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="relative mt-4 font-bold">{title}</h3>
            <p className="text-muted-foreground relative mt-1.5 text-sm leading-relaxed">{text}</p>
          </div>
        ))}
      </section>

      {/* Track grid */}
      <div id="browse" className="scroll-mt-20">
        {tracks.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center sm:py-20">
            No tracks yet. Ask an admin to add one.
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <p className="text-primary text-sm font-semibold uppercase tracking-wide">Tracks</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                Choose what to <span className="text-primary">study</span>
              </h2>
            </div>
            {/* A single card in a three-column grid would leave two thirds of the row empty */}
            <div
              className={`grid gap-6 sm:grid-cols-2 ${
                tracks.length > 2
                  ? "lg:grid-cols-3"
                  : tracks.length === 1
                    ? "mx-auto max-w-md sm:grid-cols-1"
                    : "mx-auto max-w-3xl"
              }`}
            >
              {tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  id={track.id}
                  title={track.title}
                  description={track.description}
                  image={track.image}
                  categories={track.categories}
                  problemCount={track.problems.length}
                  course={
                    track.course
                      ? {
                          price: track.course.price,
                          owned: purchasedCourseIds.has(track.course.id),
                        }
                      : null
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
