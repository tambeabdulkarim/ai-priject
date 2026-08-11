#!/usr/bin/env node
/**
 * Phoenix Platform — Production Smoke Test (Phase 21)
 *
 * Read-only by default. Every check that would create real data, spend
 * real money (AI provider calls), or send a real email is skipped unless
 * explicitly enabled — never fabricated as passing. Run with `--help` for
 * usage. Reuses the existing Playwright E2E suite (apps/web/tests/e2e) for
 * anything requiring a real authenticated browser session (role
 * dashboards) rather than re-implementing that coverage here — this
 * script covers what a plain HTTP client can verify: backend health,
 * route/guard behavior, security headers, and page-level HTTP status.
 *
 * Usage:
 *   node scripts/production-smoke-test.js
 *   API_BASE_URL=https://api.example.com WEB_BASE_URL=https://example.com node scripts/production-smoke-test.js
 *   node scripts/production-smoke-test.js --deep   (also runs auth-required and write-adjacent checks — see README)
 *
 * Env vars:
 *   API_BASE_URL         default: http://localhost:4000
 *   WEB_BASE_URL          default: http://localhost:3000
 *   SMOKE_TEST_EMAIL      fixture account email, required for --deep auth checks
 *   SMOKE_TEST_PASSWORD   fixture account password, required for --deep auth checks
 *   SMOKE_TEST_LANG        locale prefix for frontend routes, default: en
 *
 * Exit code: 0 if no FAIL, 1 if any FAIL. WARNING never affects exit code.
 */

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Phoenix Platform — Production Smoke Test

Flags:
  --deep    Also run checks that require a fixture login (SMOKE_TEST_EMAIL /
            SMOKE_TEST_PASSWORD) — session validation, JWT refresh, logout,
            notifications, certificates, AI quota, storage upload-URL issuance.
            Without --deep, these report WARNING (skipped), never FAIL.
  --help    Show this message.

Never creates a new user, never places a real order, never calls an AI
provider, never generates a certificate. Every write-adjacent action either
uses an existing fixture account's read endpoints or checks guard/validation
behavior (e.g. "does this endpoint correctly reject bad input") without
performing the real underlying action.
`);
  process.exit(0);
}

const DEEP = args.includes('--deep');
const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const WEB_BASE_URL = (process.env.WEB_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const LANG = process.env.SMOKE_TEST_LANG || 'en';
const EMAIL = process.env.SMOKE_TEST_EMAIL;
const PASSWORD = process.env.SMOKE_TEST_PASSWORD;

const API = (path) => `${API_BASE_URL}/api/v1${path}`;
const WEB = (path) => `${WEB_BASE_URL}${path}`;

const results = [];
let accessToken = null;
let refreshCookie = null;

function record(category, name, status, message) {
  results.push({ category, name, status, message });
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️ ' : '❌';
  console.log(`${icon} [${category}] ${name} — ${status}: ${message}`);
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, { redirect: 'manual', ...options });
    return { ok: true, res };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ---------------------------------------------------------------------
// FRONTEND
// ---------------------------------------------------------------------
async function checkFrontendPage(name, path) {
  const { ok, res, error } = await safeFetch(WEB(path));
  if (!ok) return record('Frontend', name, 'FAIL', `Request failed: ${error.message}`);
  if (res.status >= 200 && res.status < 400) {
    return record('Frontend', name, 'PASS', `HTTP ${res.status}`);
  }
  record('Frontend', name, 'FAIL', `Unexpected HTTP ${res.status}`);
}

async function runFrontendChecks() {
  await checkFrontendPage('Homepage loads', '/');
  await checkFrontendPage('Login page loads', `/${LANG}/login`);
  await checkFrontendPage('Register page loads', `/${LANG}/register`);
  record(
    'Frontend',
    'Student/Instructor/Admin dashboards',
    'WARN',
    'Requires an authenticated browser session — not checkable via plain HTTP. ' +
      'Covered by apps/web/tests/e2e/{user,instructor,admin}/workspace.spec.ts (run `npm run test:e2e` in apps/web). Not duplicated here.',
  );
}

// ---------------------------------------------------------------------
// BACKEND / DATABASE / STORAGE / EMAIL / PAYMENTS CONFIG (via /health)
// ---------------------------------------------------------------------
async function runHealthChecks() {
  const { ok, res, error } = await safeFetch(API('/health'));
  if (!ok) {
    record('Backend', 'API availability', 'FAIL', `Request failed: ${error.message}`);
    record('Database', 'Connectivity', 'FAIL', 'Could not reach health endpoint to determine DB status.');
    return null;
  }
  record('Backend', 'API availability', res.ok ? 'PASS' : 'FAIL', `HTTP ${res.status}`);

  let body;
  try {
    body = await res.json();
  } catch {
    record('Backend', 'Health endpoint JSON', 'FAIL', 'Response was not valid JSON.');
    return null;
  }

  record(
    'Backend',
    'Health endpoint',
    body.status === 'ok' ? 'PASS' : 'WARN',
    `status=${body.status}. Checks: ${JSON.stringify(body.checks)}`,
  );

  const c = body.checks || {};
  record('Database', 'Connectivity (SELECT 1 via /health)', c.database ? 'PASS' : 'FAIL', c.database ? 'Database reachable.' : 'Database unreachable — see backend logs.');
  record('Database', 'Migration status', 'WARN', 'Not checkable via HTTP. Run `npx prisma migrate status` against DATABASE_URL as a companion CLI step before deploying — see docs/deployment-checklist.md.');
  record('Storage', 'Configuration present', c.storage ? 'PASS' : 'FAIL', c.storage ? 'STORAGE_ENDPOINT/STORAGE_BUCKET configured.' : 'Storage not configured — uploads will fail.');
  record('Notifications', 'Email provider configured', c.email ? 'PASS' : 'WARN', c.email ? 'Postmark configured.' : 'Postmark not configured — EmailService will log instead of send (safe, not production-ready).');
  record('Payments', 'Stripe configured', c.stripe ? 'PASS' : 'FAIL', c.stripe ? 'STRIPE_SECRET_KEY present.' : 'Stripe not configured — checkout will fail.');

  return body;
}

// ---------------------------------------------------------------------
// SECURITY — headers, CORS, cookies
// ---------------------------------------------------------------------
async function runSecurityChecks() {
  const { ok, res, error } = await safeFetch(API('/health'));
  if (!ok) return record('Security', 'Backend security headers', 'FAIL', `Request failed: ${error.message}`);

  const headers = res.headers;
  const csp = headers.get('content-security-policy');
  record('Security', 'CSP header present (backend)', csp ? 'PASS' : 'WARN', csp ? 'Present.' : 'Not present on this endpoint — confirm helmet CSP is applied globally in apps/api/src/main.ts.');

  const helmetHeaders = ['x-content-type-options', 'x-frame-options', 'strict-transport-security'];
  for (const h of helmetHeaders) {
    const v = headers.get(h);
    record('Security', `Helmet header: ${h}`, v ? 'PASS' : 'WARN', v ? `Present (${v}).` : 'Not present — verify helmet() is active for this route.');
  }

  const isHttps = API_BASE_URL.startsWith('https://');
  record(
    'Security',
    'HTTPS readiness',
    isHttps ? 'PASS' : 'WARN',
    isHttps ? 'API_BASE_URL is https.' : 'API_BASE_URL is not https — expected for local dev. In production, confirm the hosting provider enforces HTTPS and HTTP requests redirect (Vercel/Railway do this automatically for custom domains).',
  );

  // CORS
  const { ok: corsOk, res: corsRes } = await safeFetch(API('/health'), {
    headers: { Origin: WEB_BASE_URL },
  });
  if (corsOk) {
    const allowOrigin = corsRes.headers.get('access-control-allow-origin');
    record(
      'Security',
      'CORS allow-origin',
      allowOrigin ? 'PASS' : 'WARN',
      allowOrigin ? `Access-Control-Allow-Origin: ${allowOrigin}` : 'No Access-Control-Allow-Origin header returned for a same-stack Origin — confirm CORS_ORIGIN / enableCors config matches the real frontend URL before launch.',
    );
  }

  record(
    'Security',
    'Cookies (HttpOnly/Secure/SameSite)',
    DEEP ? undefined : 'WARN',
    DEEP ? undefined : 'Requires a real login response to inspect Set-Cookie — run with --deep and SMOKE_TEST_EMAIL/PASSWORD set.',
  );
}

// ---------------------------------------------------------------------
// AUTH / DEEP CHECKS (require fixture credentials)
// ---------------------------------------------------------------------
async function runGuardChecks() {
  // Endpoints that MUST reject unauthenticated requests — checkable without any credentials.
  const guarded = [
    { name: 'Session validation guard (notifications/me)', path: '/notifications/me' },
    { name: 'Session validation guard (certificates/me)', path: '/certificates/me' },
    { name: 'Session validation guard (ai/usage/me)', path: '/ai/usage/me' },
    { name: 'Session validation guard (orders/me)', path: '/orders/me' },
  ];
  for (const g of guarded) {
    const { ok, res, error } = await safeFetch(API(g.path));
    if (!ok) {
      record('Authentication', g.name, 'FAIL', `Request failed: ${error.message}`);
      continue;
    }
    record('Authentication', g.name, res.status === 401 ? 'PASS' : 'FAIL', `Expected 401 without a token, got HTTP ${res.status}.`);
  }

  // Payments webhook signature verification — MUST reject an unsigned/invalid payload.
  const { ok, res, error } = await safeFetch(API('/payments/webhooks/stripe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'smoke-test.invalid' }),
  });
  if (!ok) {
    record('Payments', 'Webhook signature verification', 'FAIL', `Request failed: ${error.message}`);
  } else {
    record(
      'Payments',
      'Webhook signature verification',
      res.status === 400 ? 'PASS' : 'WARN',
      res.status === 400 ? 'Correctly rejected an unsigned payload (HTTP 400).' : `Expected HTTP 400 for an invalid signature, got ${res.status} — verify signature checking is active.`,
    );
  }
}

async function login() {
  const { ok, res, error } = await safeFetch(API('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!ok) {
    record('Authentication', 'Login', 'FAIL', `Request failed: ${error.message}`);
    return false;
  }
  if (!res.ok) {
    record('Authentication', 'Login', 'FAIL', `HTTP ${res.status} — check SMOKE_TEST_EMAIL/SMOKE_TEST_PASSWORD are valid, and that the account isn't rate-limited from repeated smoke-test runs.`);
    return false;
  }
  const body = await res.json();
  accessToken = body.accessToken || body.access_token;
  const setCookie = res.headers.get('set-cookie');
  refreshCookie = setCookie;
  if (setCookie) {
    const hasHttpOnly = /httponly/i.test(setCookie);
    const hasSameSite = /samesite/i.test(setCookie);
    record(
      'Security',
      'Cookies (HttpOnly/Secure/SameSite)',
      hasHttpOnly && hasSameSite ? 'PASS' : 'WARN',
      `Set-Cookie flags — HttpOnly: ${hasHttpOnly}, SameSite present: ${hasSameSite}. Secure flag cannot be confirmed over local HTTP; verify manually over HTTPS in production.`,
    );
  }
  record('Authentication', 'Login', accessToken ? 'PASS' : 'FAIL', accessToken ? 'Received access token.' : 'No access token in response body.');
  return Boolean(accessToken);
}

async function authedGet(path) {
  return safeFetch(API(path), { headers: { Authorization: `Bearer ${accessToken}` } });
}

async function runDeepChecks() {
  if (!EMAIL || !PASSWORD) {
    record('Authentication', 'Deep checks (login-dependent)', 'WARN', '--deep was passed but SMOKE_TEST_EMAIL/SMOKE_TEST_PASSWORD are not set — skipping all login-dependent checks.');
    return;
  }

  const loggedIn = await login();
  if (!loggedIn) {
    record('Authentication', 'Deep checks (login-dependent)', 'WARN', 'Login failed — skipping all checks that depend on an authenticated session.');
    return;
  }

  // Session validation — authenticated request should now succeed.
  {
    const { ok, res, error } = await authedGet('/notifications/me');
    if (!ok) record('Authentication', 'Session validation', 'FAIL', `Request failed: ${error.message}`);
    else record('Authentication', 'Session validation', res.ok ? 'PASS' : 'FAIL', `Authenticated request to /notifications/me returned HTTP ${res.status}.`);
  }

  // JWT refresh
  {
    const { ok, res, error } = await safeFetch(API('/auth/refresh'), {
      method: 'POST',
      headers: refreshCookie ? { Cookie: refreshCookie } : {},
    });
    if (!ok) record('Authentication', 'JWT refresh', 'FAIL', `Request failed: ${error.message}`);
    else record('Authentication', 'JWT refresh', res.ok ? 'PASS' : 'WARN', `HTTP ${res.status}. If WARN/FAIL, confirm the refresh-token cookie was captured correctly (some environments require the cookie jar, not a single header).`);
  }

  // Notifications pipeline
  {
    const { ok, res, error } = await authedGet('/notifications/me');
    if (!ok) record('Notifications', 'Pipeline reachable', 'FAIL', `Request failed: ${error.message}`);
    else record('Notifications', 'Pipeline reachable', res.ok ? 'PASS' : 'FAIL', `HTTP ${res.status}.`);
  }

  // Certificates
  {
    const { ok, res, error } = await authedGet('/certificates/me');
    if (!ok) record('Certificates', 'List reachable', 'FAIL', `Request failed: ${error.message}`);
    else record('Certificates', 'List reachable', res.ok ? 'PASS' : 'FAIL', `HTTP ${res.status}.`);
    record(
      'Certificates',
      'PDF download',
      'WARN',
      'Not exercised — certificate PDF generation is a disclosed, not-yet-implemented v1.0 gap (pdfFileId is always null; see docs/version-1.0-freeze.md). Expected to report empty/absent, not a failure.',
    );
  }

  // AI quota
  {
    const { ok, res, error } = await authedGet('/ai/usage/me');
    if (!ok) record('AI', 'Quota endpoint', 'FAIL', `Request failed: ${error.message}`);
    else record('AI', 'Quota endpoint', res.ok ? 'PASS' : 'FAIL', `HTTP ${res.status}.`);
    record('AI', 'Request endpoint', 'WARN', 'Not exercised — POST /ai/requests calls a real, billed AI provider. Skipped to avoid real cost/side effects; confirm manually once in a controlled staging run.');
  }

  // Storage upload-URL issuance (does not perform a real upload)
  {
    const { ok, res, error } = await safeFetch(API('/files/upload-url'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'smoke-test.txt', mimeType: 'text/plain', size: 12 }),
    });
    if (!ok) record('Storage', 'File upload (presigned URL issuance)', 'FAIL', `Request failed: ${error.message}`);
    else record('Storage', 'File upload (presigned URL issuance)', res.ok ? 'PASS' : 'FAIL', `HTTP ${res.status}. A real file write is intentionally not performed by this script.`);
    record('Storage', 'File retrieval', 'WARN', 'Not exercised — requires a known, already-uploaded file ID. Verify manually with a real object once one exists.');
  }

  // Checkout — guard/validation only, does not place a real order
  {
    const { ok, res, error } = await safeFetch(API('/orders'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // deliberately invalid — checks validation, not a real purchase
    });
    if (!ok) record('Payments', 'Checkout validation', 'FAIL', `Request failed: ${error.message}`);
    else record('Payments', 'Checkout validation', res.status === 400 ? 'PASS' : 'WARN', `Expected HTTP 400 for an empty order payload, got ${res.status}. A real checkout is intentionally not performed by this script — verify end-to-end manually with a real product and Stripe test card before launch.`);
  }

  // Logout — run last, invalidates the session
  {
    const { ok, res, error } = await safeFetch(API('/auth/logout'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, Cookie: refreshCookie || '' },
    });
    if (!ok) record('Authentication', 'Logout', 'FAIL', `Request failed: ${error.message}`);
    else record('Authentication', 'Logout', res.ok ? 'PASS' : 'FAIL', `HTTP ${res.status}.`);
  }
}

// ---------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------
async function main() {
  console.log(`\nPhoenix Platform — Production Smoke Test`);
  console.log(`API: ${API_BASE_URL}   WEB: ${WEB_BASE_URL}   Mode: ${DEEP ? '--deep' : 'standard (read-only)'}\n`);

  await runFrontendChecks();
  await runHealthChecks();
  await runSecurityChecks();
  await runGuardChecks();
  if (DEEP) {
    await runDeepChecks();
  } else {
    record('Authentication', 'Register/Login/Logout/Refresh (functional)', 'WARN', 'Run with --deep and SMOKE_TEST_EMAIL/SMOKE_TEST_PASSWORD set to exercise these.');
  }

  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const pass = results.filter((r) => r.status === 'PASS').length;

  console.log(`\n--- Summary ---`);
  console.log(`PASS: ${pass}   WARN: ${warn}   FAIL: ${fail}`);
  const overall = fail > 0 ? 'FAIL' : warn > 0 ? 'PASS WITH WARNINGS' : 'PASS';
  console.log(`Overall: ${overall}\n`);
  console.log('See docs/production-verification-report-template.md to record this run\'s results formally.');

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
