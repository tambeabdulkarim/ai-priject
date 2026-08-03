// Typed route-path constants — the one source of truth for path strings,
// per docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §3/§6.
//
// Frontend Phase 2 (Foundation Layer) defined the auth lifecycle +
// dashboard/403 placeholders. Frontend Phase 3 (Public Foundation Pages)
// added the public News/Courses/Library catalogue+detail routes.
// Frontend Phase 4 (Authenticated User Experience) adds Profile,
// Notifications, My Courses, the Course Learning View, Certificates
// (mine/detail/public-verify), and Account Settings. `[slug]`/`[id]`
// segments are filled the same way `[lang]` is — callers `.replace()`
// the literal placeholder (see components/News.tsx for the pattern).
//
// Locale-prefixed per docs/09-PLATFORM-ARCHITECTURE.md §2 (`/[lang]/...`).

export const ROUTES = {
  home: '/[lang]',
  login: '/[lang]/login',
  register: '/[lang]/register',
  forgotPassword: '/[lang]/forgot-password',
  resetPassword: '/[lang]/reset-password',
  verifyEmail: '/[lang]/verify-email',
  dashboard: '/[lang]/dashboard',
  forbidden: '/[lang]/403',
  newsList: '/[lang]/news',
  newsDetail: '/[lang]/news/[slug]',
  coursesList: '/[lang]/courses',
  courseDetail: '/[lang]/courses/[slug]',
  libraryList: '/[lang]/library',
  libraryDetail: '/[lang]/library/[slug]',
  profile: '/[lang]/profile',
  notifications: '/[lang]/notifications',
  myCourses: '/[lang]/my-courses',
  courseLearn: '/[lang]/courses/[slug]/learn',
  lessonLearn: '/[lang]/courses/[slug]/learn/[lessonId]',
  certificatesList: '/[lang]/certificates',
  certificateDetail: '/[lang]/certificates/[id]',
  certificateVerify: '/[lang]/certificates/verify/[certificateNumber]',
  settings: '/[lang]/settings',
  instructorDashboard: '/[lang]/instructor',
  instructorCourseNew: '/[lang]/instructor/courses/new',
  instructorCourseEdit: '/[lang]/instructor/courses/[id]/edit',
  moderatorDashboard: '/[lang]/moderator',
  moderationQueue: '/[lang]/moderator/queue',
  moderatorCourseReview: '/[lang]/moderator/courses/[slug]',
  adminDashboard: '/[lang]/admin',
  adminAuditLogs: '/[lang]/admin/audit-logs',
  adminAnalytics: '/[lang]/admin/analytics',
  adminSettings: '/[lang]/admin/settings',
  adminUsers: '/[lang]/admin/users',
  adminUserDetail: '/[lang]/admin/users/[id]',
  marketplaceHome: '/[lang]/marketplace',
  marketplaceProductDetail: '/[lang]/marketplace/[slug]',
  checkout: '/[lang]/checkout',
  ordersList: '/[lang]/orders',
  orderDetail: '/[lang]/orders/[id]',
  aiDashboard: '/[lang]/ai',
  aiQuota: '/[lang]/ai/quota',
  aiRequestDetail: '/[lang]/ai/requests/[id]',
} as const;

/**
 * `POST /orders`'s real success/cancel URLs (orders.service.ts) are
 * hardcoded server-side as `${NEXT_PUBLIC_SITE_URL}/checkout/success` /
 * `.../checkout/cancel` — NOT locale-prefixed, unlike every other route
 * in this app. These are deliberately NOT part of `ROUTES`/`withLang`
 * (which assume a `[lang]` segment) — the actual pages live at
 * `app/checkout/success/page.tsx` and `app/checkout/cancel/page.tsx`,
 * outside the `[lang]` segment, to match the backend's real redirect
 * target exactly.
 */
export const CHECKOUT_SUCCESS_PATH = '/checkout/success';
export const CHECKOUT_CANCEL_PATH = '/checkout/cancel';

export type RouteKey = keyof typeof ROUTES;

/** Fills the `[lang]` segment — the only dynamic part every route above shares. */
export function withLang(route: (typeof ROUTES)[RouteKey], lang: string): string {
  return route.replace('[lang]', lang);
}

/** Route-group membership used by middleware.ts and the guard components — mirrors docs/09-PLATFORM-ARCHITECTURE.md §2's `(auth)`/`(app)` groups for the routes this phase actually defines. */
export const PUBLIC_ONLY_ROUTES: readonly (typeof ROUTES)[RouteKey][] = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.verifyEmail,
];

export const AUTH_REQUIRED_ROUTES: readonly (typeof ROUTES)[RouteKey][] = [
  ROUTES.dashboard,
  ROUTES.profile,
  ROUTES.notifications,
  ROUTES.myCourses,
  ROUTES.courseLearn,
  ROUTES.lessonLearn,
  ROUTES.certificatesList,
  ROUTES.certificateDetail,
  ROUTES.settings,
  ROUTES.instructorDashboard,
  ROUTES.instructorCourseNew,
  ROUTES.instructorCourseEdit,
  ROUTES.moderatorDashboard,
  ROUTES.moderationQueue,
  ROUTES.moderatorCourseReview,
  ROUTES.adminDashboard,
  ROUTES.adminAuditLogs,
  ROUTES.adminAnalytics,
  ROUTES.adminSettings,
  ROUTES.adminUsers,
  ROUTES.adminUserDetail,
  ROUTES.checkout,
  ROUTES.ordersList,
  ROUTES.orderDetail,
  ROUTES.aiDashboard,
  ROUTES.aiQuota,
  ROUTES.aiRequestDetail,
];

/**
 * Roles that hold `course:create` per prisma/seed.ts's
 * EXPLICIT_ROLE_GRANTS (`'course:create': ['instructor', 'content_editor']`)
 * — verified exactly, NOT including plain `admin` (only `superadmin` gets
 * every permission by default; `admin` itself is not separately granted
 * `course:create`). The real gate for the whole /instructor route group.
 */
export const INSTRUCTOR_ROLES = ['instructor', 'content_editor', 'superadmin'] as const;

/** Roles that hold `course:publish` per prisma/seed.ts (`['content_editor', 'admin']` + implicit superadmin) — a plain `instructor` is NOT in this list, matching the real documented editorial-review gate. Used to hide/disable the Publish action for instructors who'd just get a real 403. */
export const COURSE_PUBLISH_ROLES = ['content_editor', 'admin', 'superadmin'] as const;

/**
 * Roles that hold `moderation:read` + `comment:moderate` per
 * prisma/seed.ts (`['moderator', 'admin']` + implicit superadmin) — the
 * real gate for the whole /moderator route group.
 */
export const MODERATOR_ROLES = ['moderator', 'admin', 'superadmin'] as const;

/** Roles that hold `audit:read` per prisma/seed.ts (`['admin']` + implicit superadmin) — a plain `moderator` is deliberately NOT in this list. Used to hide the audit-log/recent-activity view from moderators who'd just get a real 403. */
export const AUDIT_READ_ROLES = ['admin', 'superadmin'] as const;

/**
 * Roles that hold `user:list`/`user:read`/`user:ban` and `analytics:read`
 * per prisma/seed.ts (`['admin']` each + implicit superadmin) — the real
 * gate for the whole /admin route group (dashboard, audit logs,
 * analytics, user list/detail/ban).
 */
export const ADMIN_ROLES = ['admin', 'superadmin'] as const;

/**
 * Roles that hold `settings:read`/`settings:write` per prisma/seed.ts —
 * NEITHER has an explicit EXPLICIT_ROLE_GRANTS entry, so only
 * `superadmin` (implicit blanket grant) can reach either endpoint. A
 * plain `admin` gets a real 403 on Settings — reflected by gating the
 * Settings screen to this narrower list, not the wider ADMIN_ROLES.
 */
export const SETTINGS_ROLES = ['superadmin'] as const;

/** `user:assign_role` has no explicit grant in prisma/seed.ts either — superadmin only. Used to hide/disable the role editor for a plain `admin`, who would get a real 403. */
export const ROLE_ASSIGN_ROLES = ['superadmin'] as const;
