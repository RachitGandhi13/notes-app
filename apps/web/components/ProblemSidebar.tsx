"use client";

import { cn } from "@repo/ui";
import { CheckSquare, ChevronLeft, ChevronRight, Presentation } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddSectionForm } from "@/components/admin/AddSectionForm";

interface Problem {
  problemId: string;
  sortingOrder: number;
  problem: {
    id: string;
    title: string;
    type: string;
    pptUrl: string | null;
    _count: { mcqQuestions: number };
  };
}

interface ProblemSidebarProps {
  trackId: string;
  trackTitle: string;
  problems: Problem[];
  activeProblemId: string;
  /** Shows the "Add section" form for admins. */
  isAdmin?: boolean;
}

export function ProblemSidebar({
  trackId,
  trackTitle,
  problems,
  activeProblemId,
  isAdmin,
}: ProblemSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        // Phones: a full-width block above the lesson. md and up: the
        // collapsible side column.
        "bg-background relative flex w-full flex-col border-b transition-all duration-300 md:h-full md:border-b-0 md:border-r",
        collapsed ? "md:w-12" : "md:w-72"
      )}
    >
      {/* Collapse toggle (side column only) */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="bg-background absolute -right-3 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full border shadow-sm md:flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Always rendered (so phones always get the list); only hidden when the desktop column is collapsed */}
      <div className={cn("flex min-h-0 flex-1 flex-col", collapsed && "md:hidden")}>
        <>
          {/* Track title */}
          <div className="border-b p-4">
            <Link href="/notes" className="text-muted-foreground text-xs hover:underline">
              ← All tracks
            </Link>
            <h2 className="mt-1 text-sm font-semibold leading-snug">{trackTitle}</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {problems.length} {problems.length === 1 ? "section" : "sections"}
            </p>
          </div>

          {/* Problem list */}
          <nav className="max-h-60 flex-1 overflow-y-auto p-2 md:max-h-none">
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
                      {problem.pptUrl ? (
                        <Presentation className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="leading-snug">
                        {problem.title}
                        {problem._count.mcqQuestions > 0 && (
                          <span className="block text-xs opacity-60">
                            {problem._count.mcqQuestions}{" "}
                            {problem._count.mcqQuestions === 1
                              ? "practice question"
                              : "practice questions"}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {isAdmin && (
            <div className="border-t p-2">
              <AddSectionForm trackId={trackId} />
            </div>
          )}
        </>
      </div>
    </aside>
  );
}
