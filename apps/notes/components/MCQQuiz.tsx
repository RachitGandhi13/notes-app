"use client";

import { cn } from "@repo/ui";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { submitQuizScore } from "@/lib/actions";

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

  const totalAnswered = Object.keys(answers).length;
  const allAnswered = totalAnswered === questions.length;

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctOption).length
    : 0;

  async function handleSubmit() {
    if (!allAnswered || submitted) return;
    setSubmitting(true);
    await submitQuizScore(problemId, score);
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quiz</h2>
        <p className="text-sm text-muted-foreground">
          {questions.length} questions — answer all before submitting.
        </p>
      </div>

      {questions.map((q, idx) => {
        const chosen = answers[q.id];
        const isCorrect = submitted && chosen === q.correctOption;
        const isWrong = submitted && chosen !== q.correctOption;

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
                      onClick={() =>
                        !submitted && setAnswers((a) => ({ ...a, [q.id]: opt }))
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                        !submitted && isChosen && "border-primary bg-primary/10",
                        !submitted && !isChosen && "hover:bg-accent",
                        submitted && isAnswer && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                        submitted && isChosen && !isAnswer && "border-destructive bg-destructive/10 text-destructive"
                      )}
                    >
                      {submitted && isAnswer && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                      {submitted && isChosen && !isAnswer && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                      {(!submitted || (!isAnswer && !isChosen)) && (
                        <span className={cn("h-4 w-4 shrink-0 rounded-full border-2", isChosen ? "border-primary bg-primary" : "border-muted-foreground")} />
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
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : `Submit (${totalAnswered}/${questions.length} answered)`}
        </button>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-3xl font-bold">
            {score} / {questions.length}
          </p>
          <p className="mt-1 text-muted-foreground">
            {score === questions.length
              ? "Perfect score! 🎉"
              : score >= questions.length / 2
              ? "Good job! Keep it up."
              : "Review the material and try again."}
          </p>
        </div>
      )}
    </div>
  );
}
