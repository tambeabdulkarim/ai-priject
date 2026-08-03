import type { ApiErrorBody } from '@phoenix/types';
import type { ApiClientConfig, ApiResult, RequestOptions } from './client-config';
import { ApiError, NetworkError, TimeoutError } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestInput extends RequestOptions {
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

const DEFAULT_TIMEOUT_MS = 15_000;

function buildUrl(baseUrl: string, path: string, query?: RequestInput['query']): string {
  const url = new URL(`${baseUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function isDocumentedErrorBody(value: unknown): value is { error: ApiErrorBody } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'object'
  );
}

/**
 * Creates the single low-level request function every resource module
 * (auth, users, files, ...) is built on. Retry policy note (avoids
 * duplicated logic per this phase's validation requirement): this
 * function does NOT implement generic exponential-backoff retry for
 * transient network/5xx failures — that's TanStack Query's job
 * (apps/web/src/providers/QueryProvider.tsx's `defaultOptions.queries.retry`),
 * configured once, not reimplemented per call site. The ONE retry this
 * function performs is the documented auth-flow requirement (401 →
 * refresh → retry original request exactly once), which is not a generic
 * transient-failure retry and doesn't belong in TanStack Query's config.
 */
export function createRequestFn(config: ApiClientConfig) {
  async function requestOnce<T>(input: RequestInput, accessTokenOverride?: string | null): Promise<Response> {
    const url = buildUrl(config.baseUrl, input.path, input.query);
    const token = accessTokenOverride !== undefined ? accessTokenOverride : config.getAccessToken();

    const headers: Record<string, string> = {};
    if (input.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (token && !input.skipAuthHeader) {
      headers.Authorization = `Bearer ${token}`;
    }

    const timeoutMs = input.timeoutMs ?? config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    // Compose the caller-provided signal (e.g. React Query's own
    // cancellation) with this wrapper's timeout signal, so either one
    // aborts the request.
    const signals = [timeoutController.signal, input.signal].filter(
      (s): s is AbortSignal => s !== undefined,
    );
    // AbortSignal.any is not universally available across the target
    // runtime range yet — feature-detected and cast defensively rather
    // than relied on at the type level, so this compiles regardless of
    // the configured DOM lib version.
    const abortSignalAny = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any;
    const signal = signals.length > 1 && abortSignalAny ? abortSignalAny(signals) : timeoutController.signal;

    try {
      return await fetch(url, {
        method: input.method,
        headers,
        credentials: 'include', // required for the httpOnly refresh_token cookie on /auth/* calls (auth.controller.ts's cookie path is scoped to /api/v1/auth) — harmless no-op on every other path.
        body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
        signal,
      });
    } catch (cause) {
      if (timeoutController.signal.aborted) {
        throw new TimeoutError();
      }
      throw new NetworkError(cause);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function parseResult<T>(response: Response): Promise<ApiResult<T>> {
    // 204 No Content (e.g. POST /auth/logout) — no body to parse.
    if (response.status === 204) {
      return { data: undefined as T, error: null };
    }

    const text = await response.text();
    const parsed: unknown = text.length > 0 ? JSON.parse(text) : undefined;

    if (response.ok) {
      return { data: parsed as T, error: null };
    }

    if (isDocumentedErrorBody(parsed)) {
      return { data: null, error: new ApiError(response.status, parsed.error) };
    }

    // Not the documented envelope at all — a genuinely unexpected server
    // response shape. Still surfaced as an ApiError (never thrown) so
    // callers keep one code path, with a code that can't collide with a
    // real backend-issued one.
    return {
      data: null,
      error: new ApiError(response.status, {
        code: 'UNEXPECTED_ERROR',
        message: 'The server returned an unexpected response.',
        request_id: response.headers.get('x-request-id') ?? 'unknown',
      }),
    };
  }

  return async function request<T>(input: RequestInput): Promise<ApiResult<T>> {
    const response = await requestOnce<T>(input);

    if (response.status === 401 && !input.skipAuthRetry) {
      const newToken = await config.onUnauthorized();
      if (newToken) {
        const retried = await requestOnce<T>(input, newToken);
        return parseResult<T>(retried);
      }
      // Refresh itself failed — surface the original 401 as a documented
      // ApiError rather than throwing; UsersProvider/AuthProvider decides
      // what "session genuinely gone" means for the UI (redirect to
      // login), not this low-level function.
      return parseResult<T>(response);
    }

    const result = await parseResult<T>(response);
    if (result.error?.status === 403) {
      config.onForbidden?.(result.error);
    }
    return result;
  };
}

export type RequestFn = ReturnType<typeof createRequestFn>;
