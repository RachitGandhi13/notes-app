import { Spotlight } from "@repo/ui";
import { getTracks } from "@/lib/actions";
import { TrackCard } from "@/components/TrackCard";

export const revalidate = 3600; // ISR — re-generate at most every hour

export default async function HomePage() {
  const tracks = await getTracks();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <Spotlight className="rounded-2xl border bg-card p-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Learn at your own pace
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Structured learning tracks with Notion-backed notes and quizzes.
          Press{" "}
          <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">
            Ctrl K
          </kbd>{" "}
          to search.
        </p>
      </Spotlight>

      {/* Track grid */}
      {tracks.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          No tracks yet. Ask an admin to add one.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              id={track.id}
              title={track.title}
              description={track.description}
              image={track.image}
              categories={track.categories}
              problemCount={track.problems.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
