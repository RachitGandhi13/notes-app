"use client";

import { cn } from "@repo/ui";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ContentItem {
  id: string;
  type: string;
  title: string;
  children?: ContentItem[];
}

interface ContentSidebarProps {
  courseSlug: string;
  courseTitle: string;
  items: ContentItem[];
  activeContentId: string;
  watchedIds: Set<string>;
}

function ContentNode({
  item,
  courseSlug,
  activeContentId,
  watchedIds,
  depth = 0,
}: {
  item: ContentItem;
  courseSlug: string;
  activeContentId: string;
  watchedIds: Set<string>;
  depth?: number;
}) {
  const [open, setOpen] = useState(true);
  const isFolder = item.type === "FOLDER";
  const isActive = item.id === activeContentId;
  const isWatched = watchedIds.has(item.id);

  if (isFolder) {
    return (
      <li>
        <button
          onClick={() => setOpen((o) => !o)}
          className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          <Folder className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{item.title}</span>
        </button>
        {open && item.children && item.children.length > 0 && (
          <ul>
            {item.children.map((child) => (
              <ContentNode
                key={child.id}
                item={child}
                courseSlug={courseSlug}
                activeContentId={activeContentId}
                watchedIds={watchedIds}
                depth={depth + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const Icon = item.type === "NOTION" ? FileText : PlayCircle;

  return (
    <li>
      <Link
        href={`/courses/${courseSlug}/${item.id}`}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        {isWatched ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
        ) : (
          <Icon className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{item.title}</span>
      </Link>
    </li>
  );
}

export function ContentSidebar({
  courseSlug,
  courseTitle,
  items,
  activeContentId,
  watchedIds,
}: ContentSidebarProps) {
  const totalLeaves = items.filter((i) => i.type !== "FOLDER").length;
  const watched = items.filter((i) => watchedIds.has(i.id)).length;
  const pct = totalLeaves > 0 ? Math.round((watched / totalLeaves) * 100) : 0;

  return (
    <aside className="bg-background flex h-full w-72 shrink-0 flex-col border-r">
      {/* Header */}
      <div className="border-b p-4">
        <Link
          href={`/courses/${courseSlug}`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← Course overview
        </Link>
        <h2 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug">{courseTitle}</h2>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-muted-foreground text-xs font-medium">Your progress</span>
            <span
              className={cn("text-xs font-bold", pct === 100 ? "text-green-600" : "text-primary")}
            >
              {pct}%
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pct === 100 ? "bg-green-600" : "bg-primary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1.5 text-xs">
            {watched} of {totalLeaves} {totalLeaves === 1 ? "lesson" : "lessons"} completed
          </p>
        </div>
      </div>

      {/* Content tree */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <ContentNode
              key={item.id}
              item={item}
              courseSlug={courseSlug}
              activeContentId={activeContentId}
              watchedIds={watchedIds}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}
