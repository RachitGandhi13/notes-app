"use client";

import { cn } from "@repo/ui";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { submitQuizScore } from "@/lib/track-actions";

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: string;
}

interface MCQQuizProps {
  problemId: string;
  questions: MCQQuestion[];
}

type AnswerMap = Record<string, string>; // questionId → chosen option

export function MCQQuiz({ problemId, questions }: MCQQuizProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // false = we tried to save the score and couldn't (e.g. not signed in)
  const [scoreSaved, setScoreSaved] = useState(true);

  const totalAnswered = Object.keys(answers).length;
  const allAnswered = totalAnswered === questions.length;

  const score = submitted ? questions.filter((q) => answers[q.id] === q.correctOption).length : 0;

  async function handleSubmit() {
    if (!allAnswered || submitted) return;
    setSubmitting(true);
    // Practice must work for everyone: a visitor who isn't signed in still
    // sees their result, it just isn't saved to a profile.
    const finalScore = questions.filter((q) => answers[q.id] === q.correctOption).length;
    try {
      await submitQuizScore(problemId, finalScore);
      setScoreSaved(true);
    } catch {
      setScoreSaved(false);
    }
    setSubmitted(true);
    setSubmitting(false);
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
    setScoreSaved(true);
  }

  return (
    <section className="space-y-8" aria-labelledby="practice-heading">
      <div className="space-y-1 border-t pt-8">
        <h2 id="practice-heading" className="text-xl font-semibold">
          Practice questions
        </h2>
        <p className="text-muted-foreground text-sm">
          {questions.length} {questions.length === 1 ? "question" : "questions"}. Answer all, then
          submit to see the correct answers. You can try again as many times as you like.
        </p>
      </div>

      {questions.map((q, idx) => {
        const chosen = answers[q.id];

        return (
          <div key={q.id} className="space-y-3">
            <p className="font-medium">
              {idx + 1}. {q.question}
            </p>
            <ul className="space-y-2">
              {q.options.map((opt) => {
                const isChosen = chosen === opt;
                const isAnswer = submitted && opt === q.correctOption;

                return (
                  <li key={opt}>
                    <button
                      disabled={submitted}
                      onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                        !submitted && isChosen && "border-primary bg-primary/10",
                        !submitted && !isChosen && "hover:bg-accent",
                        submitted &&
                          isAnswer &&
                          "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                        submitted &&
                          isChosen &&
                          !isAnswer &&
                          "border-destructive bg-destructive/10 text-destructive"
                      )}
                    >
                      {submitted && isAnswer && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      )}
                      {submitted && isChosen && !isAnswer && (
                        <XCircle className="text-destructive h-4 w-4 shrink-0" />
                      )}
                      {(!submitted || (!isAnswer && !isChosen)) && (
                        <span
                          className={cn(
                            "h-4 w-4 shrink-0 rounded-full border-2",
                            isChosen ? "border-primary bg-primary" : "border-muted-foreground"
                          )}
                        />
                      )}
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {/* Submit / Score */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : `Submit (${totalAnswered}/${questions.length} answered)`}
        </button>
      ) : (
        <div className="bg-card space-y-4 rounded-lg border p-6 text-center">
          <div>
            <p className="text-3xl font-bold">
              {score} / {questions.length}
            </p>
            <p className="text-muted-foreground mt-1">
              {score === questions.length
                ? "Perfect score! 🎉"
                : score >= questions.length / 2
                  ? "Good job! Keep it up."
                  : "Review the material and try again."}
            </p>
          </div>
          {!scoreSaved && (
            <p className="text-muted-foreground text-sm">
              <Link href="/auth" className="text-primary underline">
                Sign in
              </Link>{" "}
              to save your scores to your profile.
            </p>
          )}
          <button
            onClick={handleRetry}
            className="hover:bg-accent mx-auto flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
