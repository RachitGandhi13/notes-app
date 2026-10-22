"use client";

import { cn } from "@repo/ui";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { toggleBookmark } from "@/lib/actions";

interface BookmarkButtonProps {
  contentId: string;
  initialBookmarked: boolean;
}

export function BookmarkButton({ contentId, initialBookmarked }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const added = await toggleBookmark(contentId);
    setBookmarked(added);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50",
        bookmarked
          ? "border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.15)] hover:bg-blue-500/15"
          : "hover:border-blue-500/30 hover:bg-blue-500/5"
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this video"}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-blue-400" />
      ) : (
        <Bookmark className="text-muted-foreground h-4 w-4" />
      )}
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
