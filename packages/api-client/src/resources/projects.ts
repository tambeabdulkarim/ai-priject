import type {
  EvaluateSubmissionRequest,
  ListSubmissionsQuery,
  PaginatedResponse,
  Project,
  ProjectDetail,
  ProjectEvaluation,
  ProjectSubmission,
  ProjectSubmissionWithEvaluation,
  SubmitProjectRequest,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §21 (Projects, Phase 26).
 *
 * `listForCourse`/`getById` are public. `submit` requires an active
 * enrollment (enforced server-side, ProjectsService.submit). `evaluate`
 * is ownership-OR-editorial against the submission's course (enforced
 * server-side, ProjectsService.evaluateSubmission) — this client never
 * duplicates that check, it only reflects whatever the server returns
 * (a real 403 for an unauthorized caller, not a client-side guess).
 */
export function createProjectsResource(request: RequestFn) {
  return {
    listForCourse: (courseId: string) =>
      request<Project[]>({ method: 'GET', path: `/courses/${courseId}/projects` }),

    getById: (id: string) => request<ProjectDetail>({ method: 'GET', path: `/projects/${id}` }),

    submit: (projectId: string, body: SubmitProjectRequest) =>
      request<ProjectSubmission>({
        method: 'POST',
        path: `/projects/${projectId}/submissions`,
        body,
      }),

    listMySubmissions: (query: ListSubmissionsQuery = {}) =>
      request<PaginatedResponse<ProjectSubmissionWithEvaluation>>({
        method: 'GET',
        path: '/projects/submissions/me',
        query: { cursor: query.cursor, limit: query.limit },
      }),

    listSubmissionsForCourse: (courseId: string, query: ListSubmissionsQuery = {}) =>
      request<PaginatedResponse<ProjectSubmissionWithEvaluation>>({
        method: 'GET',
        path: `/courses/${courseId}/projects/submissions`,
        query: {
          cursor: query.cursor,
          limit: query.limit,
          projectId: query.projectId,
          status: query.status,
        },
      }),

    getSubmissionById: (id: string) =>
      request<ProjectSubmissionWithEvaluation>({
        method: 'GET',
        path: `/projects/submissions/${id}`,
      }),

    evaluateSubmission: (submissionId: string, body: EvaluateSubmissionRequest) =>
      request<ProjectEvaluation>({
        method: 'POST',
        path: `/projects/submissions/${submissionId}/evaluate`,
        body,
      }),
  };
}

export type ProjectsResource = ReturnType<typeof createProjectsResource>;
