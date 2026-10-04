// Rules for a practice question, shared by the admin form (so the admin sees a
// clear message immediately) and by the server actions (which stay the real
// gatekeeper). It lives outside track-actions.ts because that file is a
// "use server" module, which can only export async functions.
//
// The form needs its own copy of the check because Next.js hides the message
// of any error thrown from a server action in production builds — the admin
// would only ever see a generic failure.

export interface QuestionInput {
  question: string;
  options: string[];
  correctOption: string;
}

export type QuestionCheck = { ok: true; value: QuestionInput } | { ok: false; error: string };

export function validateQuestion(q: QuestionInput): QuestionCheck {
  const question = q.question.trim();
  if (!question) return { ok: false, error: "Question text is required." };

  const options = q.options.map((o) => o.trim()).filter(Boolean);
  if (options.length < 2) return { ok: false, error: "Add at least 2 options." };
  // The quiz identifies a chosen option by its text, so duplicates would be
  // indistinguishable to the student.
  if (new Set(options).size !== options.length) {
    return { ok: false, error: "Every option must be different." };
  }

  const correctOption = q.correctOption.trim();
  if (!options.includes(correctOption)) {
    return { ok: false, error: "Mark one of the options as correct." };
  }

  return { ok: true, value: { question, options, correctOption } };
}
