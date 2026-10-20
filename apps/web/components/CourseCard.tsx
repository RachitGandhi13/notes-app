import { ArrowRight, Lock, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { needsUnoptimized } from "@/lib/images";

interface CourseCardProps {
  slug: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  purchased?: boolean;
  /** Set for cards in the first visible row — skips lazy-loading for above-the-fold images. */
  priority?: boolean;
  /** Admins bypass purchase checks everywhere, so an Enrolled/Enroll Now badge would be
   * meaningless noise on their own view — neither one renders when this is true. */
  isAdmin?: boolean;
}

export function CourseCard({
  slug,
  title,
  description,
  imageUrl,
  purchased,
  priority,
  isAdmin,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${slug}`} className="group block">
      <div className="bg-card hover:border-primary/30 overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]">
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              unoptimized={needsUnoptimized(imageUrl)}
              alt={title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="from-muted to-muted/60 flex h-full items-center justify-center bg-gradient-to-br">
              <PlayCircle className="text-muted-foreground/40 h-14 w-14" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {!isAdmin && purchased && (
            <div className="absolute right-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              Enrolled
            </div>
          )}
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

          <div className="flex items-center border-t pt-3">
            {/* Purchased already has its own badge on the thumbnail above — repeating
                "Enrolled" down here was redundant. Only the unpurchased prompt lives here. */}
            {!isAdmin && !purchased && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Lock className="h-3.5 w-3.5" />
                Enroll Now!
              </span>
            )}
            <span className="text-primary ml-auto flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              View course <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
