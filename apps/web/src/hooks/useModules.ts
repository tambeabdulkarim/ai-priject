import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateModuleRequest } from '@phoenix/types';
import { apiClient } from '../services/api-client';

/**
 * Module create/update — real, functional endpoints, but NOT documented
 * in docs/16-API-CONTRACT.md (see packages/types/src/modules.ts). No
 * module-reorder endpoint exists anywhere in the real backend, so no
 * `useReorderModules` hook is offered here — building one would mean
 * calling an endpoint that doesn't exist.
 */
export function useCreateModule(courseSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...body }: CreateModuleRequest & { courseId: string }) =>
      apiClient.lessons.createModule(courseId, body),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['courses', 'detail', courseSlug] });
      }
    },
  });
}

export function useUpdateModule(courseSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      moduleId,
      ...body
    }: CreateModuleRequest & { courseId: string; moduleId: string }) =>
      apiClient.lessons.updateModule(courseId, moduleId, body),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['courses', 'detail', courseSlug] });
      }
    },
  });
}
