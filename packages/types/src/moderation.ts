// docs/16-API-CONTRACT.md §18 (Administration) — GET /admin/moderation/queue,
// POST /admin/moderation/comments/:id/decision, GET /admin/audit-logs.
// Verified against apps/api/src/modules/admin/{admin.controller.ts,
// moderation.service.ts,moderation.repository.ts,dto/*}.
//
// REAL BACKEND GAPS (see this phase's report for full detail, not worked
// around here):
//  - No endpoint anywhere sets a Comment's status to `flagged` — the
//    queue can only ever surface comments that reached that status via
//    direct DB/seed manipulation, never via any real user-facing flow.
//  - No course reject/request-changes endpoint exists — `publish` (via
//    course:publish) or `archive` (ownership-or-editorial, neither of
//    which a plain `moderator` holds) are the only ways to move a course
//    out of `in_review`.
//  - No `total`/count field exists on any paginated response, and the
//    unfiltered (no content_type) queue view is capped to each list's
//    first page only (moderation.service.ts's own documented Phase 13
//    fix — a single cursor can't paginate two tables at once). Dashboard
//    counts are therefore NOT exact totals — see hooks/useModeration.ts.

import type { CourseSummary } from './courses';
import type { PaginatedResponse } from './pagination';

/** Mirrors the Prisma `Comment` model, returned as-is (schema.prisma news.comments). Comments are hard-tied to `News` only — no course/lesson comment thread exists in this backend despite the moderation queue's generic `content_type` naming. */
export interface CommentRecord {
  id: string;
  userId: string;
  newsId: string;
  parentCommentId: string | null;
  body: string;
  status: 'visible' | 'hidden' | 'flagged';
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ModerationContentType = 'course' | 'comment';

export interface ModerationQueueQuery {
  cursor?: string;
  limit?: number;
  content_type?: ModerationContentType;
}

/** Only the key matching the requested `content_type` is populated; both are present (each capped at page 1) when no filter is given. */
export interface ModerationQueueResponse {
  courses?: PaginatedResponse<CourseSummary>;
  comments?: PaginatedResponse<CommentRecord>;
}

export interface ModerationDecisionRequest {
  decision: 'approve' | 'hide';
  /** Required on every decision, no minimum length (a stricter `@MinLength(3)` was removed from the real backend during its own Phase 13 audit for being stricter than docs/16 documents). */
  reason: string;
}

export interface ListAuditLogsQuery {
  cursor?: string;
  limit?: number;
  actor?: string;
  action?: string;
  target_type?: string;
  from?: string;
  to?: string;
}

/** Mirrors the Prisma `AuditLog` model (schema.prisma auth.audit_logs). `GET /admin/audit-logs` requires `audit:read`, held only by admin/superadmin — NOT the moderator role (prisma/seed.ts EXPLICIT_ROLE_GRANTS). */
export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  beforeState: unknown;
  afterState: unknown;
  ipAddress: string | null;
  occurredAt: string;
}
