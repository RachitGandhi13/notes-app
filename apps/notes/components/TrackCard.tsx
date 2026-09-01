import { Badge } from "@repo/ui";
import { BookOpen, Lock } from "lucide-react";
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
      <div className="bg-card overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <Badge key={c.category.category} variant="secondary" className="text-xs">
                {c.category.category}
              </Badge>
            ))}
          </div>
          <h3 className="line-clamp-1 font-semibold leading-snug">{title}</h3>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{description}</p>
          <div className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
            {course ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>{course.price > 0 ? `₹${course.price} bundle` : "Requires enrollment"}</span>
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" />
                <span>
                  {problemCount} {problemCount === 1 ? "lesson" : "lessons"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
