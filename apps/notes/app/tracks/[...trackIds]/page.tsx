import { notFound } from "next/navigation";
import { getTrack, getProblem, hasTrackAccess } from "@/lib/actions";
import { ProblemSidebar } from "@/components/ProblemSidebar";
import { PPTViewer } from "@/components/PPTViewer";
import { MCQQuiz } from "@/components/MCQQuiz";
import { TrackPaywall } from "@/components/TrackPaywall";

interface Props {
  params: { trackIds: string[] };
}

export default async function TrackPage({ params }: Props) {
  const [trackId, problemId] = params.trackIds;

  if (!trackId) notFound();

  const track = await getTrack(trackId);
  if (!track) notFound();

  const hasAccess = await hasTrackAccess(track);
  if (!hasAccess && track.course) {
    return <TrackPaywall trackTitle={track.title} course={track.course} />;
  }

  // Default to first problem if none specified
  const activeProblemId = problemId ?? track.problems[0]?.problem.id;

  if (!activeProblemId) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        <ProblemSidebar
          trackId={trackId}
          trackTitle={track.title}
          problems={track.problems}
          activeProblemId=""
        />
        <div className="text-muted-foreground flex flex-1 items-center justify-center">
          This track has no lessons yet.
        </div>
      </div>
    );
  }

  const problem = await getProblem(activeProblemId);
  if (!problem) notFound();

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <ProblemSidebar
        trackId={trackId}
        trackTitle={track.title}
        problems={track.problems}
        activeProblemId={activeProblemId}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <h1 className="mb-6 text-2xl font-bold">{problem.title}</h1>

          {problem.type === "PPT" && problem.pptUrl && (
            <PPTViewer pptUrl={problem.pptUrl} title={problem.title} />
          )}

          {problem.type === "MCQ" && (
            <MCQQuiz problemId={problem.id} questions={problem.mcqQuestions} />
          )}
        </div>
      </div>
    </div>
  );
}

// Generate static params for ISR — pre-render first problem of each track
export async function generateStaticParams() {
  const { prisma } = await import("@repo/db/client");
  const tracks = await prisma.track.findMany({
    where: { hidden: false },
    include: { problems: { orderBy: { sortingOrder: "asc" }, take: 1 } },
  });
  return tracks.map((t) => ({
    trackIds: t.problems[0] ? [t.id, t.problems[0].problemId] : [t.id],
  }));
}
