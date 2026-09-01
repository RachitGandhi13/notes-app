import { Badge } from "@repo/ui";
import { PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CourseCardProps {
  slug: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  price: number;
  purchased?: boolean;
}

export function CourseCard({ slug, title, description, imageUrl, price, purchased }: CourseCardProps) {
  return (
    <Link href={`/courses/${slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <PlayCircle className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {purchased && (
            <div className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
              Enrolled
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold leading-snug line-clamp-1">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
          <div className="mt-3 flex items-center justify-between">
            <Badge variant={price === 0 ? "secondary" : "default"}>
              {price === 0 ? "Free" : `$${price}`}
            </Badge>
            <span className="text-xs text-muted-foreground group-hover:underline">
              View course →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
