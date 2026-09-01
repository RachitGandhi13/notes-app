"use client";

import { CheckCircle2, Trash2 } from "lucide-react";
import { useState } from "react";
import { approveComment, deleteComment } from "@/lib/community";

interface PendingComment {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string | null; email: string | null };
  content: { title: string };
}

export function ModerationPanel({ initialComments }: { initialComments: PendingComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setLoading(id);
    await approveComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
    setLoading(null);
  }

  async function handleDelete(id: string) {
    setLoading(id);
    await deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
    setLoading(null);
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/40 py-12 text-center text-muted-foreground">
        No pending comments. You&apos;re all caught up!
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{c.author.name ?? "Unknown"}</span>
                {" · "}
                {c.author.email}
                {" · on "}
                <span className="italic">{c.content.title}</span>
                {" · "}
                {new Date(c.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          </div>

          <div className="flex gap-2 border-t pt-3">
            <button
              onClick={() => handleApprove(c.id)}
              disabled={loading === c.id}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={loading === c.id}
              className="flex items-center gap-1.5 rounded-lg border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
