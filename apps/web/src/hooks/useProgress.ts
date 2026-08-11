import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubmitQuizAttemptRequest, UpdateLessonProgressRequest } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /progress/courses/:courseId */
export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: queryKeys.progress.course(courseId),
    queryFn: async () => {
      const result = await apiClient.progress.getCourseProgress(courseId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: courseId.length > 0,
  });
}

/**
 * docs/16-API-CONTRACT.md PUT /progress/lessons/:lessonId. Invalidates
 * both the course-progress query (this call's own effect) and the
 * enrollments list (`Enrollment.completionPercent` — shown on the "My
 * Courses" page — changes as a side effect of this same backend call,
 * per progress.service.ts's `upsertProgressAndRecomputeCompletion`).
 */
export function useUpdateLessonProgress(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, ...body }: UpdateLessonProgressRequest & { lessonId: string }) =>
      apiClient.progress.updateLessonProgress(lessonId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.course(courseId) });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'list'] });
    },
  });
}

/**
 * docs/16-API-CONTRACT.md POST /progress/quizzes/:quizId/attempts.
 *
 * Phase 28 fix: this hook previously returned the raw `ApiResult` wrapper
 * without unwrapping `result.error` into a real thrown/mutation error —
 * unlike every other mutation hook in this file/module (see
 * `useUpdateLessonProgress`/`useSubmitProject` etc.), which all follow
 * the "unwrap and throw" pattern so `mutation.isError`/`mutation.error`
 * work correctly. Since this phase is this hook's first real UI
 * consumer (no quiz-taking screen existed before), and Part 5/10 of this
 * phase explicitly require a real, non-fabricated success/failure state
 * (never a false "success" on a real backend error), this was corrected
 * to match the codebase's own dominant, already-established convention —
 * not a new pattern invented here.
 */
export function useSubmitQuizAttempt() {
  return useMutation({
    mutationFn: async ({ quizId, ...body }: SubmitQuizAttemptRequest & { quizId: string }) => {
      const result = await apiClient.progress.submitQuizAttempt(quizId, body);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/**
 * docs/16-API-CONTRACT.md GET /progress/quizzes/:quizId — Phase 28. Real
 * questions only, `correctAnswer` is never present in the response
 * (stripped server-side, not filtered here).
 */
export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: queryKeys.quiz.detail(quizId),
    queryFn: async () => {
      const result = await apiClient.progress.getQuiz(quizId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: quizId.length > 0,
    retry: false,
  });
}
