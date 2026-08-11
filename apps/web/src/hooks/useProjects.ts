import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EvaluateSubmissionRequest,
  ListSubmissionsQuery,
  SubmitProjectRequest,
} from '@phoenix/types';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /courses/:courseId/projects — public. */
export function useProjectsForCourse(courseId: string) {
  return useQuery({
    queryKey: queryKeys.projects.forCourse(courseId),
    queryFn: async () => {
      const result = await apiClient.projects.listForCourse(courseId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: courseId.length > 0,
  });
}

/** docs/16-API-CONTRACT.md GET /projects/:id — public. */
export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async () => {
      const result = await apiClient.projects.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
  });
}

/**
 * docs/16-API-CONTRACT.md POST /projects/:id/submissions — requires an
 * active enrollment (enforced server-side, ProjectsService.submit; a
 * learner not enrolled gets a real 403, not a client-side guess).
 */
export function useSubmitProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: SubmitProjectRequest) => {
      const result = await apiClient.projects.submit(projectId, body);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.mySubmissions() });
    },
  });
}

/** docs/16-API-CONTRACT.md GET /projects/submissions/me — always scoped to the caller. */
export function useMySubmissions(query: ListSubmissionsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.projects.mySubmissions(query as Record<string, unknown>),
    queryFn: async () => {
      const result = await apiClient.projects.listMySubmissions(query);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/**
 * docs/16-API-CONTRACT.md GET /courses/:courseId/projects/submissions —
 * resource owner (course's instructor) or content_editor/admin/moderator
 * (read-only), enforced entirely server-side (ProjectsService.
 * listSubmissionsForCourse) — a learner calling this gets a real 403.
 */
export function useCourseSubmissions(courseId: string, query: ListSubmissionsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.projects.courseSubmissions(courseId, query as Record<string, unknown>),
    queryFn: async () => {
      const result = await apiClient.projects.listSubmissionsForCourse(courseId, query);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: courseId.length > 0,
  });
}

/** docs/16-API-CONTRACT.md GET /projects/submissions/:id — owner/editorial/moderator, enforced server-side. */
export function useSubmission(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.submissionDetail(id),
    queryFn: async () => {
      const result = await apiClient.projects.getSubmissionById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: id.length > 0,
  });
}

/**
 * docs/16-API-CONTRACT.md POST /projects/submissions/:id/evaluate —
 * ownership-OR-editorial against the submission's course, enforced
 * entirely server-side (ProjectsService.evaluateSubmission) — this hook
 * does not implement or duplicate that authorization, it only reflects
 * whatever the server returns (a real 403 for an unauthorized caller).
 */
export function useEvaluateSubmission(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: EvaluateSubmissionRequest) => {
      const result = await apiClient.projects.evaluateSubmission(submissionId, body);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.submissionDetail(submissionId) });
    },
  });
}
