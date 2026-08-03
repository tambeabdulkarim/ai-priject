import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCourseRequest, UpdateCourseRequest } from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/**
 * "Owned courses" for the Instructor Dashboard/Course Management.
 *
 * REAL BACKEND GAP: `GET /courses` (courses.repository.ts `findMany`)
 * has no `instructor`/`mine` filter parameter — when authenticated, its
 * documented visibility rule is "published courses OR the caller's own
 * courses of ANY status" (courses.repository.ts:33-35), all mixed into
 * one list with everyone else's published courses. There is no way to
 * ask the backend for "only my courses" directly. This hook fetches the
 * maximum page size (100, the documented pagination ceiling) and filters
 * client-side by `instructorId === currentUserId`.
 *
 * This is a best-effort, not a complete solution: if there are more than
 * 100 published courses (from any instructor) ahead of this instructor's
 * own courses in the `-createdAt` default sort, some of their own
 * courses could be missed. No pagination-follow loop is added to paper
 * over this (that would risk unbounded requests against a public list
 * endpoint) — flagged here and in this phase's final report as a real,
 * unresolved gap rather than hidden behind a "working" UI.
 */
export function useMyOwnedCourses(instructorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.instructor.ownedCourses(instructorId ?? ''),
    queryFn: async () => {
      const result = await apiClient.courses.list({ limit: 100 });
      if (result.error) throw result.error;
      return result.data.items.filter((course) => course.instructorId === instructorId);
    },
    enabled: Boolean(instructorId),
  });
}

function useInvalidateInstructorCourses() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['instructor', 'owned-courses'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };
}

/** docs/16-API-CONTRACT.md POST /courses — `course:create` (instructor/content_editor). */
export function useCreateCourse() {
  const invalidate = useInvalidateInstructorCourses();
  return useMutation({
    mutationFn: (body: CreateCourseRequest) => apiClient.courses.create(body),
    onSuccess: (result) => { if (!result.error) invalidate(); },
  });
}

/** docs/16-API-CONTRACT.md PATCH /courses/:id — owner-or-editorial, enforced server-side. */
export function useUpdateCourse() {
  const invalidate = useInvalidateInstructorCourses();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateCourseRequest & { id: string }) => apiClient.courses.update(id, body),
    onSuccess: (result) => { if (!result.error) invalidate(); },
  });
}

/** docs/16-API-CONTRACT.md POST /courses/:id/submit-review — owning-instructor-only. */
export function useSubmitForReview() {
  const invalidate = useInvalidateInstructorCourses();
  return useMutation({
    mutationFn: (id: string) => apiClient.courses.submitForReview(id),
    onSuccess: (result) => { if (!result.error) invalidate(); },
  });
}

/** docs/16-API-CONTRACT.md POST /courses/:id/publish — `course:publish` (content_editor/admin only; NOT instructor). */
export function usePublishCourse() {
  const invalidate = useInvalidateInstructorCourses();
  return useMutation({
    mutationFn: (id: string) => apiClient.courses.publish(id),
    onSuccess: (result) => { if (!result.error) invalidate(); },
  });
}

/** docs/16-API-CONTRACT.md POST /courses/:id/archive — owner-or-editorial. */
export function useArchiveCourse() {
  const invalidate = useInvalidateInstructorCourses();
  return useMutation({
    mutationFn: (id: string) => apiClient.courses.archive(id),
    onSuccess: (result) => { if (!result.error) invalidate(); },
  });
}
