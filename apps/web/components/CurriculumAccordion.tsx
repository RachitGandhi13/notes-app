"use client";

import { ChevronDown, FileText, PlayCircle } from "lucide-react";
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

function LessonRow({ lesson }: { lesson: LessonItem }) {
  const Icon = lesson.type === "NOTION" ? FileText : PlayCircle;

  return (
    <li className="border-border flex items-center gap-3 border-t px-5 py-3 first:border-t-0 dark:border-white/[0.06]">
      <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5">{lesson.title}</p>
        {lesson.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs leading-relaxed">
            {lesson.description}
          </p>
        )}
      </div>
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
    <div
      className={`bg-card dark:border-white/8 overflow-hidden rounded-[24px] border transition-colors dark:bg-[#111113] ${
        open ? "dark:border-white/14 dark:[box-shadow:inset_0_1px_0_rgb(0_240_255_/_0.25)]" : ""
      }`}
    >
      <div className="flex w-full items-center justify-between gap-3 px-5 py-5">
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
            <span className="font-mono text-xs text-[#0052CC] dark:text-[#00F0FF]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display mt-0.5 text-[20px] font-semibold leading-[28px]">
              {chapter.title}
            </h3>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          {chapter.lessons.length > 0 && (
            <span className="text-muted-foreground rounded-full bg-white/5 px-2.5 py-1 font-mono text-xs">
              {chapter.lessons.length} {chapter.lessons.length === 1 ? "lesson" : "lessons"}
            </span>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Collapse" : "Expand"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-[144ms] ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-border animate-in fade-in-0 slide-in-from-top-1 border-t duration-[144ms] dark:border-white/[0.06]">
          {chapter.materialKind && (
            <div className="p-5 pb-0">
              <MaterialViewer
                contentId={chapter.id}
                kind={chapter.materialKind}
                label="Section material"
                locked={!purchased}
              />
            </div>
          )}
          <ul>
            {chapter.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </ul>
        </div>
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
    <div className="space-y-3">
      {chapters.map((chapter, i) => (
        <ChapterPanel key={chapter.id} chapter={chapter} index={i} purchased={purchased} />
      ))}
    </div>
  );
}
