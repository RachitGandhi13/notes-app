"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@repo/ui";

interface Vote {
  voteType: string;
  userId: string;
}

interface VoteButtonsProps {
  votes: Vote[];
  currentUserId?: string;
  onVote: (type: "UPVOTE" | "DOWNVOTE") => Promise<void>;
}

function countVotes(votes: Vote[]) {
  const up = votes.filter((v) => v.voteType === "UPVOTE").length;
  const down = votes.filter((v) => v.voteType === "DOWNVOTE").length;
  return { up, down, net: up - down };
}

export function VoteButtons({ votes, currentUserId, onVote }: VoteButtonsProps) {
  const [optimisticVotes, setOptimisticVotes] = useState(votes);
  const [loading, setLoading] = useState(false);

  const { up, down, net } = countVotes(optimisticVotes);
  const myVote = currentUserId
    ? optimisticVotes.find((v) => v.userId === currentUserId)?.voteType
    : undefined;

  async function handleVote(type: "UPVOTE" | "DOWNVOTE") {
    if (!currentUserId || loading) return;
    setLoading(true);

    // Optimistic update
    setOptimisticVotes((prev) => {
      const filtered = prev.filter((v) => v.userId !== currentUserId);
      // Toggle off if same vote
      if (myVote === type) return filtered;
      return [...filtered, { voteType: type, userId: currentUserId }];
    });

    await onVote(type);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote("UPVOTE")}
        disabled={!currentUserId || loading}
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors hover:bg-accent disabled:opacity-40",
          myVote === "UPVOTE" && "text-green-600 dark:text-green-400"
        )}
        aria-label="Upvote"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span>{up}</span>
      </button>
      <button
        onClick={() => handleVote("DOWNVOTE")}
        disabled={!currentUserId || loading}
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors hover:bg-accent disabled:opacity-40",
          myVote === "DOWNVOTE" && "text-red-600 dark:text-red-400"
        )}
        aria-label="Downvote"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span>{down}</span>
      </button>
    </div>
  );
}
