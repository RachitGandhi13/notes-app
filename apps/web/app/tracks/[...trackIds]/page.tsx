import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSession } from "@repo/auth";
import { getTrack, getProblem, hasTrackAccess } from "@/lib/track-actions";
import { ProblemSidebar } from "@/components/ProblemSidebar";
import { PPTViewer } from "@/components/PPTViewer";
import { MCQQuiz } from "@/components/MCQQuiz";
import { TrackPaywall } from "@/components/TrackPaywall";
import { SectionAdminPanel } from "@/components/admin/SectionAdminPanel";

// Depends on who is looking (admins see editing tools) and is edited live by
// the admin, so it is always rendered on request rather than pre-built.
export const dynamic = "force-dynamic";

interface Props {
  params: { trackIds: string[] };
}

export default async function TrackPage({ params }: Props) {
  const [trackId, problemId] = params.trackIds;

  if (!trackId) notFound();

  const track = await getTrack(trackId);
  if (!track) notFound();

  const session = await getSession();
  const isAdmin = !!session?.user?.admin;

  // Admins can always open a track, even a bundled one they haven't "bought".
  const hasAccess = isAdmin || (await hasTrackAccess(track));
  if (!hasAccess && track.course) {
    return <TrackPaywall trackTitle={track.title} course={track.course} />;
  }

  // Default to first section if none specified
  const activeProblemId = problemId ?? track.problems[0]?.problem.id;

  if (!activeProblemId) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-4rem)] md:min-h-0 md:flex-row">
        <ProblemSidebar
          trackId={trackId}
          trackTitle={track.title}
          problems={track.problems}
          activeProblemId=""
          isAdmin={isAdmin}
        />
        <div className="text-muted-foreground flex flex-1 items-center justify-center px-6 py-16 text-center">
          {isAdmin
            ? "This track has no sections yet — use “Add section” in the sidebar."
            : "This track has no sections yet."}
        </div>
      </div>
    );
  }

  const problem = await getProblem(activeProblemId);
  // The section must belong to this track — the URL is otherwise user-controlled.
  const index = track.problems.findIndex((tp) => tp.problemId === activeProblemId);
  if (!problem || index === -1) notFound();

  const previous = track.problems[index - 1]?.problem;
  const next = track.problems[index + 1]?.problem;
  const hasContent = !!problem.pptUrl || problem.mcqQuestions.length > 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-4rem)] md:min-h-0 md:flex-row">
      <ProblemSidebar
        trackId={trackId}
        trackTitle={track.title}
        problems={track.problems}
        activeProblemId={activeProblemId}
        isAdmin={isAdmin}
      />

      <div className="flex-1 md:overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <h1 className="text-2xl font-bold">{problem.title}</h1>
          {problem.description && (
            <p className="text-muted-foreground mt-2 leading-relaxed">{problem.description}</p>
          )}

          <div className="mt-6 space-y-10">
            {problem.pptUrl && <PPTViewer pptUrl={problem.pptUrl} title={problem.title} />}

            {problem.mcqQuestions.length > 0 && (
              // key: a fresh quiz (no carried-over answers) for every section
              <MCQQuiz key={problem.id} problemId={problem.id} questions={problem.mcqQuestions} />
            )}

            {!hasContent && (
              <p className="text-muted-foreground rounded-lg border border-dashed px-6 py-12 text-center">
                {isAdmin
                  ? "This section is empty — open “Edit this section” below to upload slides or add practice questions."
                  : "Content for this section is coming soon."}
              </p>
            )}
          </div>

          {(previous || next) && (
            <nav className="mt-12 flex items-center justify-between gap-4 border-t pt-6 text-sm">
              {previous ? (
                <Link
                  href={`/tracks/${trackId}/${previous.id}`}
                  className="hover:bg-accent flex min-w-0 items-center gap-2 rounded-lg border px-4 py-2"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  href={`/tracks/${trackId}/${next.id}`}
                  className="hover:bg-accent flex min-w-0 items-center gap-2 rounded-lg border px-4 py-2"
                >
                  <span className="truncate">{next.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Link>
              )}
            </nav>
          )}

          {isAdmin && (
            <SectionAdminPanel
              key={problem.id}
              trackId={trackId}
              problem={{
                id: problem.id,
                title: problem.title,
                description: problem.description,
                pptUrl: problem.pptUrl,
              }}
              questions={problem.mcqQuestions.map((q) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctOption: q.correctOption,
              }))}
              isFirst={index === 0}
              isLast={index === track.problems.length - 1}
            />
          )}
        </div>
      </div>
    </div>
  );
}
