// Phase 7 (Quiz System) — Scoring. docs/13-DATABASE-BLUEPRINT.md
// QuizQuestion.questionType: "single | multiple | text". Naive JSON
// equality (the Phase 6 placeholder) is wrong for two of these three
// types: "multiple" answers submitted in a different order are still
// correct, and "text" answers with different casing/whitespace are still
// correct. This is the type-aware replacement.

export type QuestionType = 'single' | 'multiple' | 'text';

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

// "single" answers are conceptually one atomic value, but real seeded
// content (prisma/seed-phase27-content.ts) consistently stores
// correctAnswer as a one-element array (e.g. ["True"]) rather than a bare
// string, while both the frontend and this function's own submittedAnswer
// contract use a bare string. Unwrap a one-element array on either side so
// the comparison is shape-tolerant instead of requiring both sides to
// happen to be encoded identically.
function normalizeSingle(value: unknown): unknown {
  return Array.isArray(value) && value.length === 1 ? value[0] : value;
}

function setsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  const normalizedA = [...a].map((v) => JSON.stringify(v)).sort();
  const normalizedB = [...b].map((v) => JSON.stringify(v)).sort();
  return normalizedA.every((v, i) => v === normalizedB[i]);
}

export function isAnswerCorrect(
  questionType: string,
  correctAnswer: unknown,
  submittedAnswer: unknown,
): boolean {
  switch (questionType as QuestionType) {
    case 'single':
      return (
        JSON.stringify(normalizeSingle(submittedAnswer)) ===
        JSON.stringify(normalizeSingle(correctAnswer))
      );
    case 'multiple':
      return setsEqual(asArray(correctAnswer), asArray(submittedAnswer));
    case 'text':
      return normalizeText(submittedAnswer) === normalizeText(correctAnswer);
    default:
      // Unknown question_type — fall back to strict equality rather than
      // silently marking everything correct or throwing mid-scoring.
      return JSON.stringify(submittedAnswer) === JSON.stringify(correctAnswer);
  }
}
