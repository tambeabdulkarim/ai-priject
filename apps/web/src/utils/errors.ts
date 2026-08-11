// Maps a documented ApiError (packages/api-client) to a user-facing
// message. i18n wiring (per-locale message tables) is deferred to when
// the i18n provider itself is built — this phase provides the mapping
// function's shape and a sane English default so callers have something
// real to render, not a placeholder string.

import { ApiError, NetworkError, TimeoutError } from '@phoenix/api-client';
import type { ErrorCode } from '@phoenix/types';

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  VALIDATION_ERROR:
    'Some of the information you entered isn’t valid. Please check the highlighted fields.',
  UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
  PAYMENT_REQUIRED: 'This requires a completed purchase.',
  FORBIDDEN: 'You don’t have access to do that.',
  RESOURCE_NOT_FOUND: 'We couldn’t find what you’re looking for.',
  CONFLICT: 'That action can’t be completed in the current state.',
  UNPROCESSABLE_ENTITY: 'That request couldn’t be processed.',
  TOO_EARLY: 'This is still being processed — try again shortly.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  NOT_IMPLEMENTED: 'This isn’t available yet.',
  INTERNAL_SERVER_ERROR: 'Something went wrong on our end. Please try again.',
  UNEXPECTED_ERROR: 'Something went wrong on our end. Please try again.',
};

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_MESSAGE = 'Couldn’t reach the server. Check your connection and try again.';
const TIMEOUT_MESSAGE = 'That took too long to respond. Please try again.';

/** Accepts anything a request can produce (ApiResult['error'] or a caught throw) so call sites don't need their own instanceof chain. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code as ErrorCode] ?? error.message ?? FALLBACK_MESSAGE;
  }
  if (error instanceof TimeoutError) {
    return TIMEOUT_MESSAGE;
  }
  if (error instanceof NetworkError) {
    return NETWORK_MESSAGE;
  }
  return FALLBACK_MESSAGE;
}
