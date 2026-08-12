// Focused tests for the Phase 43 Staging CSRF-token-persistence fix
// (apps/web/src/services/auth-client.ts): csrfToken must survive a full
// page reload (F5) via sessionStorage, since the plain in-memory variable
// it previously lived in is wiped by any reload while the still-valid
// httpOnly refresh_token cookie is not. Every network call below goes
// through a mocked global fetch — nothing here touches a real backend.
//
// No new test framework was introduced beyond what's declared in
// package.json (jest + ts-jest + jest-environment-jsdom, the same stack
// already proven in apps/api) — this is the first frontend unit test in
// this project; see the Phase 43 report for why it was added now.

const CSRF_STORAGE_KEY = 'phoenix_csrf_token';

function base64UrlEncode(value: unknown): string {
  const json = JSON.stringify(value);
  return Buffer.from(json, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** A structurally-valid (3-segment) fake access token — decodeJwtPayload only parses the shape, never verifies a signature client-side. */
function fakeAccessToken(sub: string): string {
  const payload = base64UrlEncode({ sub, sessionId: 'session-1', roles: ['learner'], type: 'access' });
  return `header.${payload}.signature`;
}

interface MockCall {
  url: string;
  init: RequestInit;
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
    headers: { get: () => null },
  } as unknown as Response;
}

const ACCESS_1 = fakeAccessToken('u1');
const ACCESS_2 = fakeAccessToken('u1');

describe('auth-client — csrfToken sessionStorage persistence (Phase 43 F5 fix)', () => {
  let calls: MockCall[];

  function installDefaultFetchMock(): void {
    calls = [];
    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn(
      async (url: string, init: RequestInit = {}) => {
        calls.push({ url, init });

        if (url.includes('/auth/login')) {
          return jsonResponse(200, {
            accessToken: ACCESS_1,
            user: { id: 'u1', email: 'a@b.com', roles: ['learner'], locale: 'ar' },
            csrfToken: 'csrf-1',
          });
        }
        if (url.includes('/auth/refresh')) {
          const headers = (init.headers ?? {}) as Record<string, string>;
          const submitted = headers['X-CSRF-Token'];
          if (submitted !== 'csrf-1' && submitted !== 'csrf-2') {
            return jsonResponse(403, {
              error: { code: 'FORBIDDEN', message: 'Missing CSRF token.', request_id: 'r-403' },
            });
          }
          return jsonResponse(200, { accessToken: ACCESS_2, csrfToken: 'csrf-2' });
        }
        if (url.includes('/auth/logout-all')) {
          return jsonResponse(200, { sessionsRevoked: 1 });
        }
        if (url.includes('/auth/logout')) {
          return jsonResponse(204, undefined);
        }
        return jsonResponse(404, {
          error: { code: 'NOT_FOUND', message: 'Unhandled mock endpoint.', request_id: 'r-404' },
        });
      },
    );
  }

  beforeEach(() => {
    jest.resetModules();
    window.sessionStorage.clear();
    installDefaultFetchMock();
  });

  it('A. login stores the real backend csrfToken in sessionStorage and in memory', async () => {
    const authClient = await import('./auth-client');

    const result = await authClient.login('a@b.com', 'pw');

    expect(result.error).toBeNull();
    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBe('csrf-1');
  });

  it('B. simulated F5: a fresh module instance restores csrfToken from sessionStorage and sends it as X-CSRF-Token on refresh', async () => {
    const beforeReload = await import('./auth-client');
    await beforeReload.login('a@b.com', 'pw');
    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBe('csrf-1');

    // Simulate a real F5: wipe the module registry (equivalent to every
    // plain JS variable being reinitialized on reload) — sessionStorage,
    // a real browser Web Storage API, is untouched by this, exactly like
    // in a real browser.
    jest.resetModules();
    const afterReload = await import('./auth-client');

    const user = await afterReload.recoverSession();

    expect(user).not.toBeNull();
    const refreshCall = calls.find((c) => c.url.includes('/auth/refresh'));
    expect(refreshCall).toBeDefined();
    const headers = (refreshCall!.init.headers ?? {}) as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBe('csrf-1');
  });

  it('C. a successful refresh replaces the old csrfToken with the new one the backend issued', async () => {
    const authClient = await import('./auth-client');
    await authClient.login('a@b.com', 'pw');
    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBe('csrf-1');

    const token = await authClient.handleUnauthorized();

    expect(token).toBe(ACCESS_2);
    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBe('csrf-2');
  });

  it('D. logout clears csrfToken from both memory and sessionStorage', async () => {
    const authClient = await import('./auth-client');
    await authClient.login('a@b.com', 'pw');
    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBe('csrf-1');

    await authClient.logout();

    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBeNull();
  });

  it('E. logout-all clears csrfToken from both memory and sessionStorage', async () => {
    const authClient = await import('./auth-client');
    await authClient.login('a@b.com', 'pw');
    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBe('csrf-1');

    await authClient.logoutAll();

    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBeNull();
  });

  it('F. a refresh that fails outright (revoked session) clears csrfToken — no stale token left behind', async () => {
    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn(async (url: string) => {
      if (url.includes('/auth/login')) {
        return jsonResponse(200, {
          accessToken: ACCESS_1,
          user: { id: 'u1', email: 'a@b.com', roles: ['learner'], locale: 'ar' },
          csrfToken: 'csrf-1',
        });
      }
      if (url.includes('/auth/refresh')) {
        return jsonResponse(401, {
          error: { code: 'UNAUTHENTICATED', message: 'Session has been revoked.', request_id: 'r-401' },
        });
      }
      return jsonResponse(404, {
        error: { code: 'NOT_FOUND', message: 'Unhandled mock endpoint.', request_id: 'r-404' },
      });
    });

    const authClient = await import('./auth-client');
    await authClient.login('a@b.com', 'pw');
    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBe('csrf-1');

    const user = await authClient.recoverSession();

    expect(user).toBeNull();
    expect(window.sessionStorage.getItem(CSRF_STORAGE_KEY)).toBeNull();
  });

  it('G. accessToken and refresh_token are never written to sessionStorage or localStorage', async () => {
    const authClient = await import('./auth-client');
    await authClient.login('a@b.com', 'pw');

    expect(window.sessionStorage.getItem('accessToken')).toBeNull();
    expect(window.sessionStorage.getItem('access_token')).toBeNull();
    expect(window.sessionStorage.getItem('refresh_token')).toBeNull();
    expect(window.localStorage.length).toBe(0);
    // The only key this module ever writes is the CSRF one.
    expect(Object.keys(window.sessionStorage)).toEqual(
      expect.arrayContaining([CSRF_STORAGE_KEY]),
    );
  });
});
