import { ArrowRight, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { needsUnoptimized } from "@/lib/images";

interface CourseNoteCardProps {
  trackId: string;
  title: string;
  description: string;
  image: string | null;
  owned: boolean;
  /** Admins bypass purchase checks everywhere, so an Enrolled/Enroll Now badge would be
   * meaningless noise on their own view — neither one renders when this is true. */
  isAdmin?: boolean;
}

// Mirrors TrackCard's layout so a course card and a track card sit together
// consistently on /notes — links into the course's own dedicated notes track
// (sidebar, slides/image viewer, quizzes), not the course's video page.
export function CourseNoteCard({
  trackId,
  title,
  description,
  image,
  owned,
  isAdmin,
}: CourseNoteCardProps) {
  return (
    <Link href={`/tracks/${trackId}`} className="group block">
      <div className="bg-card hover:border-primary/30 overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={title}
              unoptimized={needsUnoptimized(image)}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="from-muted to-muted/60 flex h-full items-center justify-center bg-gradient-to-br">
              <PlayCircle className="text-muted-foreground/40 h-14 w-14" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h3 className="line-clamp-1 text-base font-semibold leading-snug tracking-tight">
              {title}
            </h3>
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            {!isAdmin && (
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  owned
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {owned ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Enrolled
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Enroll Now!
                  </>
                )}
              </span>
            )}
            <span className="text-primary ml-auto flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              View notes <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
