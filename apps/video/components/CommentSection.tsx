"use client";

import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { addComment, voteOnComment } from "@/lib/community";
import { VoteButtons } from "./VoteButtons";

interface Comment {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
  votes: { voteType: string; userId: string }[];
}

interface CommentSectionProps {
  contentId: string;
  initialComments: Comment[];
  currentUserId?: string;
}

export function CommentSection({ contentId, initialComments, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await addComment(contentId, body);
      setBody("");
      // Optimistically add pending comment to the list
      setComments((prev) => [
        {
          id: `pending-${Date.now()}`,
          body,
          createdAt: new Date(),
          author: { id: currentUserId!, name: "You", image: null },
          votes: [],
        },
        ...prev,
      ]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="flex items-center gap-2 font-semibold">
        <MessageSquare className="h-4 w-4" />
        Comments
        <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
      </h3>

      {/* Add comment */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Comments are reviewed before publishing.</p>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to leave a comment.</p>
      )}

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              {comment.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.author.image}
                  alt={comment.author.name ?? ""}
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {comment.author.name?.[0] ?? "?"}
                </div>
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.author.name ?? "Anonymous"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {comment.id.startsWith("pending-") && (
                    <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      Pending review
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.body}</p>
                {!comment.id.startsWith("pending-") && (
                  <VoteButtons
                    votes={comment.votes}
                    currentUserId={currentUserId}
                    onVote={(type) => voteOnComment(comment.id, type)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
