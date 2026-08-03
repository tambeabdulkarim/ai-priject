import type { ApiErrorBody } from '@phoenix/types';

/**
 * A documented, well-formed API error (docs/16-API-CONTRACT.md "Error
 * Response Standard") — constructed from the real response body, never
 * thrown by the request wrapper. Callers branch on `.code`, matching the
 * whole point of the documented stable error-code contract.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
    this.requestId = body.request_id;
  }
}

/**
 * A genuine transport failure — offline, DNS failure, connection reset.
 * No `error.code` exists to branch on (there was no HTTP response at
 * all), so this is the one case the request wrapper throws instead of
 * returning as a value.
 */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Network request failed.');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/** A request that exceeded its configured timeout (see core/request.ts's timeout policy) — distinguished from a generic NetworkError only by name, since from the UI's perspective both mean "couldn't complete, offer retry." */
export class TimeoutError extends Error {
  constructor() {
    super('Request timed out.');
    this.name = 'TimeoutError';
  }
}
