// docs/16-API-CONTRACT.md POST /progress/quizzes/:quizId/attempts

import { IsObject } from 'class-validator';

export class SubmitQuizAttemptDto {
  /** Map of questionId -> submitted answer. Shape mirrors QuizQuestion.correctAnswer (docs/13-DATABASE-BLUEPRINT.md). */
  @IsObject()
  answers!: Record<string, unknown>;
}
