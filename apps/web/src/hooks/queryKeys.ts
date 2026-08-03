// Single source of truth for TanStack Query cache keys
// (docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §2.8) — every hook imports
// from here rather than hand-writing a key array, so invalidation stays
// consistent and greppable platform-wide.

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  news: {
    list: (query: Record<string, unknown> = {}) => ['news', 'list', query] as const,
    detail: (slug: string) => ['news', 'detail', slug] as const,
  },
  courses: {
    list: (query: Record<string, unknown> = {}) => ['courses', 'list', query] as const,
    detail: (slug: string) => ['courses', 'detail', slug] as const,
  },
  library: {
    list: (query: Record<string, unknown> = {}) => ['library', 'list', query] as const,
    detail: (slug: string) => ['library', 'detail', slug] as const,
  },
  lessons: {
    detail: (id: string) => ['lessons', 'detail', id] as const,
  },
  notifications: {
    list: (query: Record<string, unknown> = {}) => ['notifications', 'list', query] as const,
  },
  enrollments: {
    list: (query: Record<string, unknown> = {}) => ['enrollments', 'list', query] as const,
    detail: (id: string) => ['enrollments', 'detail', id] as const,
  },
  progress: {
    course: (courseId: string) => ['progress', 'course', courseId] as const,
  },
  certificates: {
    list: (query: Record<string, unknown> = {}) => ['certificates', 'list', query] as const,
    detail: (id: string) => ['certificates', 'detail', id] as const,
    verify: (certificateNumber: string) => ['certificates', 'verify', certificateNumber] as const,
  },
  instructor: {
    /** Owned-courses list is client-filtered from GET /courses (no `?instructor=` query param exists — see hooks/useInstructorCourses.ts) — keyed separately from the public `courses.list` cache since it fetches a different (unfiltered, max-page-size) query. */
    ownedCourses: (instructorId: string) => ['instructor', 'owned-courses', instructorId] as const,
  },
  moderation: {
    queue: (contentType?: string) => ['moderation', 'queue', contentType ?? 'all'] as const,
  },
  admin: {
    auditLogs: (query: Record<string, unknown> = {}) => ['admin', 'audit-logs', query] as const,
    analyticsOverview: (query: Record<string, unknown> = {}) => ['admin', 'analytics-overview', query] as const,
    users: {
      list: (query: Record<string, unknown> = {}) => ['admin', 'users', 'list', query] as const,
      detail: (id: string) => ['admin', 'users', 'detail', id] as const,
    },
    settings: {
      list: () => ['admin', 'settings', 'list'] as const,
    },
  },
} as const;
