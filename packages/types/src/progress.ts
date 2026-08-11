// docs/16-API-CONTRACT.md §7 (Progress). Verified against
// apps/api/src/modules/progress/{progress.service.ts,progress.controller.ts,dto/*.ts}.

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  progressPercent: number;
  lastPositionSeconds: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLessonProgressRequest {
  progressPercent: number;
  lastPositionSeconds?: number;
}

export interface UpdateLessonProgressResponse {
  progress: LessonProgress;
  completionPercent: number;
}

export interface CourseProgressResponse {
  completionPercent: number;
  lessons: LessonProgress[];
}

export interface SubmitQuizAttemptRequest {
  /** questionId -> submitted answer, shape mirrors the question's own `correctAnswer` (opaque here, not modeled — no quiz-authoring surface exists in this frontend). */
  answers: Record<string, unknown>;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, unknown>;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
}

export interface SubmitQuizAttemptResponse {
  attempt: QuizAttempt;
  perQuestionCorrectness: Record<string, boolean>;
}

/**
 * docs/16-API-CONTRACT.md GET /progress/quizzes/:quizId — Phase 28.
 * Deliberately has no `correctAnswer` field anywhere — the backend never
 * sends it (stripped server-side in ProgressService.getQuizForLearner).
 */
export interface QuizQuestionForLearner {
  id: string;
  prompt: string;
  questionType: 'single' | 'multiple' | 'text';
  options: unknown;
  position: number;
}

export interface QuizForLearner {
  id: string;
  title: string;
  passingScorePercent: number;
  maxAttempts: number | null;
  questions: QuizQuestionForLearner[];
}
