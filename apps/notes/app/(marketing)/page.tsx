import { Spotlight } from "@repo/ui";
import Image from "next/image";
import { getTracks } from "@/lib/actions";
import { TrackCard } from "@/components/TrackCard";

export const revalidate = 3600; // ISR — re-generate at most every hour

export default async function HomePage() {
  const tracks = await getTracks();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <Spotlight className="mx-auto max-w-2xl space-y-8 border-b py-16 text-center">
        <div className="bg-card mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
          <Image
            src="/cloudvidya.png"
            alt=""
            width={20}
            height={20}
            className="rounded-full object-cover"
          />
          <span className="text-muted-foreground">Notes by CloudVidya Academy</span>
        </div>

        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Learn at your own <span className="text-primary">pace</span>
        </h1>
        <p className="text-muted-foreground mx-auto max-w-lg text-lg leading-relaxed">
          Structured learning tracks with Notion-backed notes and quizzes.
        </p>

        {tracks.length > 0 && (
          <div className="text-muted-foreground flex items-center justify-center gap-6 text-sm">
            <span>
              <strong className="text-foreground font-semibold">{tracks.length}</strong>{" "}
              {tracks.length === 1 ? "track" : "tracks"}
            </span>
            <span>
              <strong className="text-foreground font-semibold">
                {tracks.reduce((sum, t) => sum + t.problems.length, 0)}
              </strong>{" "}
              lessons
            </span>
          </div>
        )}
      </Spotlight>

      {/* Track grid */}
      <div id="browse">
        {tracks.length === 0 ? (
          <div className="text-muted-foreground py-20 text-center">
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
                course={track.course}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
