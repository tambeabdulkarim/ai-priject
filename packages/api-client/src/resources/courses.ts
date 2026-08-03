import type {
  CourseDetail,
  CourseSummary,
  CreateCourseRequest,
  ListCoursesQuery,
  PaginatedResponse,
  UpdateCourseRequest,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §4 (Courses).
 *
 * `list`/`getBySlug` are public (`@Public()` on the real backend);
 * draft-visibility and lesson-body redaction are entirely server-side
 * decisions driven by whatever token this client attaches (owner/
 * editorial roles see drafts and full lesson bodies, everyone else sees
 * the published/redacted view) — this client does not duplicate that
 * logic client-side, it only reflects whatever the server actually
 * returns.
 *
 * `create` requires `course:create` (instructor/content_editor).
 * `update`/`archive` are owner-or-editorial (enforced server-side, not
 * duplicated here). `submitForReview` is owning-instructor-only.
 * `publish` requires `course:publish` (content_editor/admin — NOT
 * instructor; verified in prisma/seed.ts's EXPLICIT_ROLE_GRANTS) — a
 * plain instructor calling this gets a real 403, matching the documented
 * editorial-review workflow.
 */
export function createCoursesResource(request: RequestFn) {
  return {
    list: (query: ListCoursesQuery = {}) =>
      request<PaginatedResponse<CourseSummary>>({
        method: 'GET',
        path: '/courses',
        query: {
          cursor: query.cursor,
          limit: query.limit,
          category: query.category,
          minPriceCents: query.minPriceCents,
          maxPriceCents: query.maxPriceCents,
          q: query.q,
        },
      }),

    getBySlug: (slug: string) => request<CourseDetail>({ method: 'GET', path: `/courses/${slug}` }),

    create: (body: CreateCourseRequest) => request<CourseSummary>({ method: 'POST', path: '/courses', body }),

    update: (id: string, body: UpdateCourseRequest) =>
      request<CourseSummary>({ method: 'PATCH', path: `/courses/${id}`, body }),

    submitForReview: (id: string) => request<CourseSummary>({ method: 'POST', path: `/courses/${id}/submit-review` }),

    publish: (id: string) => request<CourseSummary>({ method: 'POST', path: `/courses/${id}/publish` }),

    archive: (id: string) => request<CourseSummary>({ method: 'POST', path: `/courses/${id}/archive` }),
  };
}

export type CoursesResource = ReturnType<typeof createCoursesResource>;
