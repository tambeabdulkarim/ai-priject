import type {
  Enrollment,
  EnrollmentWithCourse,
  ListEnrollmentsQuery,
  PaginatedResponse,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §6 (Enrollments) — the authenticated learner's
 * own read surface only (`POST /enrollments`, `GET /enrollments/me`,
 * `GET /enrollments/:id`). `POST /enrollments/:id/refund` is admin/
 * support-only (`order:refund`) and belongs to the not-yet-built Admin
 * feature area, deliberately excluded here.
 */
export function createEnrollmentsResource(request: RequestFn) {
  return {
    listMine: (query: ListEnrollmentsQuery = {}) =>
      request<PaginatedResponse<EnrollmentWithCourse>>({
        method: 'GET',
        path: '/enrollments/me',
        query: { cursor: query.cursor, limit: query.limit, status: query.status },
      }),

    getById: (id: string) => request<Enrollment>({ method: 'GET', path: `/enrollments/${id}` }),
  };
}

export type EnrollmentsResource = ReturnType<typeof createEnrollmentsResource>;
