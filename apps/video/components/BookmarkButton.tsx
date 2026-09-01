"use client";

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
      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this video"}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4 text-muted-foreground" />
      )}
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
