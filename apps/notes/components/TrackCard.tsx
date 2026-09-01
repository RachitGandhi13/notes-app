import { Badge } from "@repo/ui";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TrackCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  categories: { category: { category: string } }[];
  problemCount: number;
}

export function TrackCard({ id, title, description, image, categories, problemCount }: TrackCardProps) {
  return (
    <Link href={`/tracks/${id}`} className="group block">
      <div className="overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
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
          <h3 className="font-semibold leading-snug line-clamp-1">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{problemCount} {problemCount === 1 ? "lesson" : "lessons"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
