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

/** docs/16-API-CONTRACT.md POST /progress/quizzes/:quizId/attempts */
export function useSubmitQuizAttempt() {
  return useMutation({
    mutationFn: ({ quizId, ...body }: SubmitQuizAttemptRequest & { quizId: string }) =>
      apiClient.progress.submitQuizAttempt(quizId, body),
  });
}
