import { Badge } from "@repo/ui";
import { ArrowRight, BadgeCheck, PlayCircle, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface FeaturedCourseProps {
  slug: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  price: number;
  purchased?: boolean;
  enrolledCount?: number;
}

// Used when there is only one course: a single card in a three-column grid
// leaves two thirds of the row empty, so it gets the whole row instead.
export function FeaturedCourse({
  slug,
  title,
  description,
  imageUrl,
  price,
  purchased,
  enrolledCount,
}: FeaturedCourseProps) {
  return (
    <Link href={`/courses/${slug}`} className="group block">
      <div className="bg-card hover:border-primary/40 grid overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-2xl lg:grid-cols-5">
        <div className="bg-muted relative aspect-video overflow-hidden lg:col-span-3">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="from-primary/30 flex h-full items-center justify-center bg-gradient-to-br to-violet-500/30">
              <PlayCircle className="text-primary/60 h-20 w-20" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <span className="bg-primary text-primary-foreground absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-lg">
            {purchased ? "Enrolled" : "Featured course"}
          </span>
        </div>

        <div className="flex flex-col justify-center gap-5 p-7 sm:p-9 lg:col-span-2">
          <div>
            <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {title}
            </h3>
            <p className="text-muted-foreground mt-3 line-clamp-4 leading-relaxed">{description}</p>
          </div>

          <ul className="text-muted-foreground space-y-2 text-sm">
            {["Lifetime access", "Progress tracking & bookmarks", "Q&A on every lesson"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-green-500" />
                  {item}
                </li>
              )
            )}
          </ul>

          <div className="flex flex-wrap items-center gap-4 border-t pt-5">
            <Badge
              variant={price === 0 ? "secondary" : "default"}
              className="rounded-full px-3 py-1 text-sm font-semibold"
            >
              {price === 0 ? "Free" : `₹${price}`}
            </Badge>
            {!!enrolledCount && enrolledCount > 0 && (
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4" />
                {enrolledCount.toLocaleString()} enrolled
              </span>
            )}
            <span className="bg-primary text-primary-foreground ml-auto flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-md transition-all group-hover:gap-3 group-hover:shadow-lg">
              {purchased ? "Continue learning" : "View course"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
