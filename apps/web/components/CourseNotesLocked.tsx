import { Lock } from "lucide-react";
import Link from "next/link";

interface CourseNotesLockedProps {
  trackTitle: string;
  courseSlug: string;
}

// Shown instead of a course-mirrored track's content when the viewer hasn't bought the
// course it belongs to. Unlike TrackPaywall (a combo bundle with its own Razorpay
// purchase), there's no separate purchase here — the only way in is buying the course
// itself, so this just points there rather than opening a second checkout flow.
export function CourseNotesLocked({ trackTitle, courseSlug }: CourseNotesLockedProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <Lock className="text-muted-foreground h-6 w-6" />
      </span>
      <h1 className="text-2xl font-bold">{trackTitle}</h1>
      <p className="text-muted-foreground">
        These notes are part of a course you haven&apos;t enrolled in yet. Enroll in the course to
        unlock its sections, slides and practice questions.
      </p>
      <Link
        href={`/courses/${courseSlug}`}
        className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 font-semibold transition-opacity hover:opacity-90"
      >
        Go to course
      </Link>
    </div>
  );
}
