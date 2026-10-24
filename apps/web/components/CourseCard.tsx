import { ArrowRight, Lock, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AscendButton, Aurora, Grain } from "@repo/ui";
import { needsUnoptimized } from "@/lib/images";

interface CourseCardProps {
  slug: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  price: number;
  purchased?: boolean;
  /** Set for cards in the first visible row — skips lazy-loading for above-the-fold images. */
  priority?: boolean;
  /** Admins bypass purchase checks everywhere, so an Enrolled/Enroll Now badge would be
   * meaningless noise on their own view — neither one renders when this is true. */
  isAdmin?: boolean;
  /** Cycles the Aurora cover tint and the oversized label across a grid of cards. */
  accentIndex?: number;
}

const ACCENTS = ["#0066FF", "#00F0FF", "#34D399", "#7C5CFF", "#FFB547", "#B4A7FF"];

export function CourseCard({
  slug,
  title,
  description,
  imageUrl,
  price,
  purchased,
  priority,
  isAdmin,
  accentIndex = 0,
}: CourseCardProps) {
  const accent = ACCENTS[accentIndex % ACCENTS.length];
  const label = (title.split(" ")[0] ?? title).toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111113] transition-transform duration-300 hover:-translate-y-1">
      <Link
        href={`/courses/${slug}`}
        className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#111113]"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            unoptimized={needsUnoptimized(imageUrl)}
            alt=""
            fill
            priority={priority}
            className="object-cover opacity-25"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <PlayCircle className="h-12 w-12 text-white/10" />
          </div>
        )}
        <Aurora variant="cover" accent={accent} accent2={accent} />
        <Grain opacity={0.6} />
        <span
          aria-hidden="true"
          className="absolute right-[-30%] top-[-50%] rounded-full border border-white/[0.25]"
          style={{ width: "162%", height: "162%" }}
        />
        <span
          aria-hidden="true"
          className="absolute right-[2%] top-[2%] h-full w-full rounded-full border border-white/40"
        />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
          {price === 0 ? "Free" : `₹${price}`}
        </span>
        <span
          aria-hidden="true"
          className="font-display absolute bottom-3 left-4 bg-clip-text leading-none text-transparent"
          style={{
            fontSize: "clamp(40px, 7vw, 96px)",
            backgroundImage: "linear-gradient(180deg, #FFFFFF, rgb(255 255 255 / 0.55))",
          }}
        >
          {label}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex-1">
          <h3 className="text-[22px] font-semibold leading-7">{title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#A1A1AA]">
            {description}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/[0.08] pt-5">
          {!isAdmin && !purchased && (
            <AscendButton asChild size="sm" icon={<Lock className="h-3.5 w-3.5" />}>
              <Link href={`/courses/${slug}`}>Enroll Now!</Link>
            </AscendButton>
          )}
          <AscendButton asChild variant="secondary" size="sm">
            <Link href={`/courses/${slug}`}>
              View course
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </AscendButton>
        </div>
      </div>
    </div>
  );
}
