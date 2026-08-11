// docs/16-API-CONTRACT.md §15 (AI). Verified against
// apps/api/src/modules/ai/{ai.controller.ts,ai.service.ts,ai.repository.ts,
// dto/create-ai-request.dto.ts} and prisma/schema.prisma's
// AiRequest/AiUsage/AiCost models.
//
// CRITICAL REAL BACKEND GAP, quoted verbatim from ai.service.ts's own
// header comment: `POST /ai/requests` is deliberately BLOCKED BY
// DOCUMENTATION — `docs/12-AI-INTEGRATION-BIBLE.md` "is a
// governance/philosophy document, not an implementation spec." It never
// defines a feature catalog, per-feature input schemas, feature-specific
// permission keys, real provider adapter behavior, or quota thresholds.
// The endpoint validates the generic envelope DTO then unconditionally
// throws `NotImplementedException` (HTTP 501) — no AI provider is ever
// called, nothing is ever persisted. There is consequently:
//  - NO way to create/submit a real AI request through this API.
//  - NO list/history endpoint at all (not even documented) — only
//    single-request-by-id lookup exists, for a request's own owner.
//  - NO dedicated quota endpoint — `quotaLimit` is one field bundled
//    into `GET /ai/usage/me`'s response, itself only ever a real
//    zero/null state unless an `AiUsage` row was provisioned out of
//    band (nothing in the app provisions one automatically).
//  - NO quota-exceeded (402/429) enforcement anywhere — doc16 documents
//    those codes for POST /ai/requests, but the code never reaches that
//    logic since dispatch itself is blocked.

/** Mirrors the Prisma `AiRequest` model, returned as-is by GET /ai/requests/:id (owner-only). `promptRedacted`/`responseRedacted` are the redacted forms — the raw prompt/response are never returned by this endpoint. */
export interface AiRequestRecord {
  id: string;
  userId: string | null;
  modelId: string;
  promptTemplateId: string | null;
  feature: string;
  status: 'success' | 'error' | 'moderation_blocked';
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  promptRedacted: string | null;
  responseRedacted: string | null;
  createdAt: string;
  cost: AiCostRecord | null;
}

/** Mirrors the Prisma `AiCost` model (Decimal serialized as string). */
export interface AiCostRecord {
  id: string;
  aiRequestId: string;
  providerCostUsd: string;
  billedAt: string;
}

/**
 * GET /ai/usage/me's real response — either the current period's real
 * `AiUsage` row (a subset of its fields), or an explicit all-null/zero
 * state when no row exists for "now" (ai.service.ts's own comment: "no
 * usage has been tracked yet... reporting a real zero state rather than
 * inventing a quota_limit value"). Both branches are represented here
 * exactly — never collapsed into a single always-present shape.
 */
export type AiUsageResponse =
  | {
      periodStart: string;
      periodEnd: string;
      requestsUsed: number;
      tokensUsed: number;
      quotaLimit: number;
    }
  | { periodStart: null; periodEnd: null; requestsUsed: 0; tokensUsed: 0; quotaLimit: null };

/**
 * POST /ai/requests's real request DTO — validated server-side (generic
 * envelope only, per doc16), but the call ALWAYS fails with HTTP 501
 * regardless of what's sent. Included here only so the "blocked request"
 * demonstration UI can make a real, honest call against the real
 * endpoint rather than fabricate the 501 response client-side.
 */
export interface CreateAiRequestInput {
  feature: string;
  input: Record<string, unknown>;
  promptTemplateVersion?: string;
}
