import { Badge } from "@repo/ui";
import { ArrowRight, BookOpen, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TrackCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  categories: { category: { category: string } }[];
  problemCount: number;
  course?: { price: number } | null;
}

export function TrackCard({
  id,
  title,
  description,
  image,
  categories,
  problemCount,
  course,
}: TrackCardProps) {
  return (
    <Link href={`/tracks/${id}`} className="group block">
      <div className="bg-card hover:border-primary/30 overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="space-y-3 p-5">
          <div>
            {categories.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <Badge
                    key={c.category.category}
                    variant="secondary"
                    className="rounded-full px-2.5 py-0.5 text-xs"
                  >
                    {c.category.category}
                  </Badge>
                ))}
              </div>
            )}
            <h3 className="line-clamp-1 text-base font-semibold leading-snug tracking-tight">
              {title}
            </h3>
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {course ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  {course.price > 0 ? `₹${course.price} bundle` : "Requires enrollment"}
                </>
              ) : (
                <>
                  <BookOpen className="h-3.5 w-3.5" />
                  {problemCount} {problemCount === 1 ? "lesson" : "lessons"}
                </>
              )}
            </span>
            <span className="text-primary flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              View track <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
