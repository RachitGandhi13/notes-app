"use client";

import { cn } from "@repo/ui";
import { BookOpen, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Problem {
  problemId: string;
  sortingOrder: number;
  problem: { id: string; title: string; type: string };
}

interface ProblemSidebarProps {
  trackId: string;
  trackTitle: string;
  problems: Problem[];
  activeProblemId: string;
}

export function ProblemSidebar({
  trackId,
  trackTitle,
  problems,
  activeProblemId,
}: ProblemSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-12" : "w-72"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {!collapsed && (
        <>
          {/* Track title */}
          <div className="border-b p-4">
            <Link href="/" className="text-xs text-muted-foreground hover:underline">
              ← All tracks
            </Link>
            <h2 className="mt-1 text-sm font-semibold leading-snug">{trackTitle}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {problems.length} {problems.length === 1 ? "lesson" : "lessons"}
            </p>
          </div>

          {/* Problem list */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-0.5">
              {problems.map(({ problem, sortingOrder }) => {
                const isActive = problem.id === activeProblemId;
                return (
                  <li key={problem.id}>
                    <Link
                      href={`/tracks/${trackId}/${problem.id}`}
                      className={cn(
                        "flex items-start gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <span className="mt-0.5 shrink-0 text-xs opacity-60">{sortingOrder}.</span>
                      {problem.type === "MCQ" ? (
                        <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="leading-snug">{problem.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </aside>
  );
}
