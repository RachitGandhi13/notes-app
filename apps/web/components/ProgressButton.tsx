"use client";

import { cn } from "@repo/ui";
import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { markProgress } from "@/lib/actions";

interface ProgressButtonProps {
  contentId: string;
  initialWatched: boolean;
}

export function ProgressButton({ contentId, initialWatched }: ProgressButtonProps) {
  const [watched, setWatched] = useState(initialWatched);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await markProgress(contentId, !watched);
    setWatched((w) => !w);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50",
        watched
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.15)] hover:bg-emerald-500/15"
          : "hover:border-blue-500/30 hover:bg-blue-500/5"
      )}
    >
      {watched ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      ) : (
        <Circle className="text-muted-foreground h-4 w-4" />
      )}
      {watched ? "Marked as watched" : "Mark as watched"}
    </button>
  );
}
