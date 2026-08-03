// Mirrors docs/16-API-CONTRACT.md "Error Response Standard" exactly, and
// the real error envelope produced by apps/api's AllExceptionsFilter
// (common/filters/all-exceptions.filter.ts): { error: { code, message,
// details?, request_id } }. Field names here are camelCase to match the
// ACTUAL wire format this backend returns (verified against
// apps/api/src/common/filters/all-exceptions.filter.ts and
// apps/api/src/main.ts — there is no ClassSerializerInterceptor or
// case-conversion layer in the real backend, so despite docs/16's
// "JSON field names are snake_case" naming standard, this specific
// backend actually emits camelCase directly. This package follows the
// verified backend contract, not the idealized doc convention, per this
// phase's explicit instruction).

/** Every stable, documented error code this backend's AllExceptionsFilter maps a status to, plus the generic fallback it uses for anything else. */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'PAYMENT_REQUIRED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_EARLY'
  | 'RATE_LIMITED'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL_SERVER_ERROR'
  | 'UNEXPECTED_ERROR';

export interface ApiErrorBody {
  code: ErrorCode | string;
  message: string;
  details?: unknown;
  /**
   * Deliberately snake_case, unlike every other field in this backend's
   * responses — verified directly against
   * apps/api/src/common/filters/all-exceptions.filter.ts line 44
   * (`request_id: requestId`), a literal, hardcoded exception rather than
   * a naming-convention drift. Kept as-is here rather than "corrected" to
   * camelCase, since this type must match the real wire format exactly.
   */
  request_id: string;
}

/** A documented, well-formed API error response — never thrown, always returned as a value (see packages/api-client's request wrapper). */
export interface ApiErrorResult {
  status: number;
  error: ApiErrorBody;
}
