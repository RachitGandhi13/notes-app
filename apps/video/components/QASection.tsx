"use client";

import { cn } from "@repo/ui";
import { CheckCircle2, ChevronDown, ChevronUp, HelpCircle, Plus, Send } from "lucide-react";
import { useState } from "react";
import { addAnswer, addQuestion, acceptAnswer, voteOnQuestion, voteOnAnswer } from "@/lib/community";
import { VoteButtons } from "./VoteButtons";

interface Answer {
  id: string;
  body: string;
  accepted: boolean;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
  votes: { voteType: string; userId: string }[];
}

interface Question {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
  votes: { voteType: string; userId: string }[];
  answers: Answer[];
}

interface QASectionProps {
  contentId: string;
  initialQuestions: Question[];
  currentUserId?: string;
  isAdmin?: boolean;
}

function AnswerItem({
  answer,
  questionAuthorId,
  currentUserId,
  isAdmin,
}: {
  answer: Answer;
  questionAuthorId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const canAccept = currentUserId === questionAuthorId || isAdmin;

  return (
    <div className={cn("rounded-lg border p-4", answer.accepted && "border-green-500 bg-green-50/50 dark:bg-green-950/20")}>
      <div className="flex gap-3">
        {answer.author.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={answer.author.image} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
            {answer.author.name?.[0] ?? "?"}
          </div>
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{answer.author.name ?? "Anonymous"}</span>
            <span className="text-xs text-muted-foreground">{new Date(answer.createdAt).toLocaleDateString()}</span>
            {answer.accepted && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
              </span>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{answer.body}</p>
          <div className="flex items-center gap-3 pt-1">
            <VoteButtons
              votes={answer.votes}
              currentUserId={currentUserId}
              onVote={(type) => voteOnAnswer(answer.id, type)}
            />
            {canAccept && !answer.accepted && (
              <button
                onClick={() => acceptAnswer(answer.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-600"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Accept
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionItem({
  question,
  currentUserId,
  isAdmin,
}: {
  question: Question;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState(question.answers);

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!answerBody.trim()) return;
    setSubmitting(true);
    await addAnswer(question.id, answerBody);
    setAnswers((prev) => [
      ...prev,
      {
        id: `pending-${Date.now()}`,
        body: answerBody,
        accepted: false,
        createdAt: new Date(),
        author: { id: currentUserId!, name: "You", image: null },
        votes: [],
      },
    ]);
    setAnswerBody("");
    setShowAnswerForm(false);
    setOpen(true);
    setSubmitting(false);
  }

  const acceptedAnswer = answers.find((a) => a.accepted);

  return (
    <li className="rounded-xl border bg-card">
      {/* Question header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <VoteButtons
            votes={question.votes}
            currentUserId={currentUserId}
            onVote={(type) => voteOnQuestion(question.id, type)}
          />
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex w-full items-start justify-between gap-2 text-left"
            >
              <div>
                <p className="font-medium leading-snug">{question.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {question.author.name} · {new Date(question.createdAt).toLocaleDateString()} · {answers.length} {answers.length === 1 ? "answer" : "answers"}
                  {acceptedAnswer && <span className="ml-2 text-green-600 dark:text-green-400">✓ Answered</span>}
                </p>
              </div>
              {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-3 pl-10">
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{question.body}</p>
          </div>
        )}
      </div>

      {/* Answers */}
      {open && (
        <div className="border-t px-4 py-3 space-y-3">
          {answers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No answers yet.</p>
          ) : (
            answers.map((answer) => (
              <AnswerItem
                key={answer.id}
                answer={answer}
                questionAuthorId={question.author.id}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            ))
          )}

          {/* Answer form */}
          {currentUserId && (
            showAnswerForm ? (
              <form onSubmit={handleAnswer} className="space-y-2 pt-2">
                <textarea
                  value={answerBody}
                  onChange={(e) => setAnswerBody(e.target.value)}
                  placeholder="Write your answer…"
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting || !answerBody.trim()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    <Send className="h-3.5 w-3.5" />{submitting ? "Posting…" : "Post Answer"}
                  </button>
                  <button type="button" onClick={() => setShowAnswerForm(false)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-accent">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowAnswerForm(true)} className="text-sm text-primary hover:underline">
                + Write an answer
              </button>
            )
          )}
        </div>
      )}
    </li>
  );
}

export function QASection({ contentId, initialQuestions, currentUserId, isAdmin }: QASectionProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await addQuestion(contentId, title, body);
      setQuestions((prev) => [
        {
          id: `pending-${Date.now()}`,
          title,
          body,
          createdAt: new Date(),
          author: { id: currentUserId!, name: "You", image: null },
          votes: [],
          answers: [],
        },
        ...prev,
      ]);
      setTitle("");
      setBody("");
      setShowForm(false);
    } catch (err: any) {
      setError(err?.message ?? "Failed to post question.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <HelpCircle className="h-4 w-4" />
          Q&amp;A
          <span className="text-sm font-normal text-muted-foreground">({questions.length})</span>
        </h3>
        {currentUserId && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Plus className="h-4 w-4" /> Ask a question
          </button>
        )}
      </div>

      {/* Ask form */}
      {showForm && (
        <form onSubmit={handleAsk} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Question title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is your question?"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Details</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your question in detail…"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting || !title.trim() || !body.trim()} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
              <Send className="h-3.5 w-3.5" />{submitting ? "Posting…" : "Post Question"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-accent">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Question list */}
      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions yet. Ask the first one!</p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <QuestionItem
              key={q.id}
              question={q}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
