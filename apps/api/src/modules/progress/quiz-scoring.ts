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
      return JSON.stringify(submittedAnswer) === JSON.stringify(correctAnswer);
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
