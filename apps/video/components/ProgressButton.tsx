"use client";

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
      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
    >
      {watched ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      {watched ? "Marked as watched" : "Mark as watched"}
    </button>
  );
}
