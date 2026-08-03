import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateLessonRequest, UpdateLessonRequest } from '@phoenix/types';
import { apiClient } from '../services/api-client';

/** docs/16-API-CONTRACT.md POST .../lessons, PATCH /lessons/:id, POST .../lessons/reorder — all real and documented. */
export function useCreateLesson(courseSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, moduleId, ...body }: CreateLessonRequest & { courseId: string; moduleId: string }) =>
      apiClient.lessons.createLesson(courseId, moduleId, body),
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['courses', 'detail', courseSlug] });
    },
  });
}

export function useUpdateLesson(courseSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateLessonRequest & { id: string }) => apiClient.lessons.updateLesson(id, body),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['courses', 'detail', courseSlug] });
        queryClient.invalidateQueries({ queryKey: ['lessons', 'detail'] });
      }
    },
  });
}

export function useReorderLessons(courseSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, moduleId, lessonIds }: { courseId: string; moduleId: string; lessonIds: string[] }) =>
      apiClient.lessons.reorderLessons(courseId, moduleId, { lessonIds }),
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['courses', 'detail', courseSlug] });
    },
  });
}
