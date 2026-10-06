import { Badge } from "@repo/ui";
import { ArrowRight, CheckCircle2, PlayCircle, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { needsUnoptimized } from "@/lib/images";

interface CourseCardProps {
  slug: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  price: number;
  purchased?: boolean;
  enrolledCount?: number;
}

export function CourseCard({
  slug,
  title,
  description,
  imageUrl,
  price,
  purchased,
  enrolledCount,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${slug}`} className="group block">
      <div className="bg-card hover:border-primary/30 overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              unoptimized={needsUnoptimized(imageUrl)}
              alt={title}
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
          {purchased && (
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

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-3">
              {purchased ? (
                // Students who own the course see this instead of the price.
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Enrolled
                </Badge>
              ) : (
                <Badge
                  variant={price === 0 ? "secondary" : "default"}
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                >
                  {price === 0 ? "Free" : `₹${price}`}
                </Badge>
              )}
              {!!enrolledCount && enrolledCount > 0 && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  {enrolledCount.toLocaleString()} enrolled
                </span>
              )}
            </div>
            <span className="text-primary flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              View course <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
