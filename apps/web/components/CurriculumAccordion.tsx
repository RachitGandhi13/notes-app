"use client";

import { ChevronDown, Circle, FileText, PlayCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { needsUnoptimized } from "@/lib/images";
import { MaterialViewer } from "@/components/MaterialViewer";

interface LessonItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
}

interface ChapterGroup {
  id: string;
  title: string;
  thumbnail?: string | null;
  materialKind?: "pdf" | "image" | null;
  lessons: LessonItem[];
}

function LessonRow({ lesson, index }: { lesson: LessonItem; index: number }) {
  const Icon = lesson.type === "NOTION" ? FileText : PlayCircle;

  return (
    <li className="hover:bg-muted/40 flex items-center gap-4 px-5 py-4 transition-colors">
      <div className="bg-muted relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
        {lesson.thumbnail ? (
          <Image
            src={lesson.thumbnail}
            alt=""
            fill
            unoptimized={needsUnoptimized(lesson.thumbnail)}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="text-muted-foreground/50 h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">
          Lesson {index + 1}: {lesson.title}
        </p>
        {lesson.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs leading-relaxed">
            {lesson.description}
          </p>
        )}
      </div>
      <Circle className="text-muted-foreground/40 h-4 w-4 shrink-0" />
    </li>
  );
}

function ChapterPanel({
  chapter,
  index,
  purchased,
}: {
  chapter: ChapterGroup;
  index: number;
  purchased: boolean;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="bg-card overflow-hidden rounded-2xl border">
      <div className="flex w-full items-center justify-between gap-3 px-5 py-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          {chapter.thumbnail && (
            <div className="bg-muted relative hidden h-14 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
              <Image
                src={chapter.thumbnail}
                alt=""
                fill
                sizes="96px"
                unoptimized={needsUnoptimized(chapter.thumbnail)}
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Chapter {index + 1}
            </p>
            <h3 className="mt-0.5 text-lg font-bold">{chapter.title}</h3>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-muted-foreground text-xs">
            {chapter.lessons.length} {chapter.lessons.length === 1 ? "lesson" : "lessons"}
          </span>
          {chapter.materialKind && (
            <MaterialViewer
              contentId={chapter.id}
              kind={chapter.materialKind}
              label="View material"
              locked={!purchased}
            />
          )}
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? "Collapse" : "Expand"}>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>
      {open && (
        <ul className="divide-y border-t">
          {chapter.lessons.map((lesson, i) => (
            <LessonRow key={lesson.id} lesson={lesson} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function CurriculumAccordion({
  chapters,
  purchased,
}: {
  chapters: ChapterGroup[];
  purchased: boolean;
}) {
  return (
    <div className="space-y-4">
      {chapters.map((chapter, i) => (
        <ChapterPanel key={chapter.id} chapter={chapter} index={i} purchased={purchased} />
      ))}
    </div>
  );
}
