import type {
  CourseProgressResponse,
  QuizForLearner,
  SubmitQuizAttemptRequest,
  SubmitQuizAttemptResponse,
  UpdateLessonProgressRequest,
  UpdateLessonProgressResponse,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/** docs/16-API-CONTRACT.md §7 (Progress) — all require an active enrollment (enforced server-side; see progress.service.ts's requireActiveEnrollment). */
export function createProgressResource(request: RequestFn) {
  return {
    /** docs/16-API-CONTRACT.md GET /progress/quizzes/:quizId — Phase 28. `correctAnswer` is never present in this response (stripped server-side). */
    getQuiz: (quizId: string) =>
      request<QuizForLearner>({ method: 'GET', path: `/progress/quizzes/${quizId}` }),

    updateLessonProgress: (lessonId: string, body: UpdateLessonProgressRequest) =>
      request<UpdateLessonProgressResponse>({
        method: 'PUT',
        path: `/progress/lessons/${lessonId}`,
        body,
      }),

    getCourseProgress: (courseId: string) =>
      request<CourseProgressResponse>({ method: 'GET', path: `/progress/courses/${courseId}` }),

    submitQuizAttempt: (quizId: string, body: SubmitQuizAttemptRequest) =>
      request<SubmitQuizAttemptResponse>({
        method: 'POST',
        path: `/progress/quizzes/${quizId}/attempts`,
        body,
      }),
  };
}

export type ProgressResource = ReturnType<typeof createProgressResource>;
