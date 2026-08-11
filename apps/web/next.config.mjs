// Foundation-layer config: makes the shared, TypeScript-source workspace
// packages (packages/api-client, packages/types) importable and buildable
// from apps/web without a separate compile step per package — Next.js
// transpiles them itself. Extend this list only when a new shared package
// is actually imported from apps/web.
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@phoenix/api-client', '@phoenix/types'],
  // "Hide unnecessary server headers" (Phase 16 scope item 2) — Next.js
  // sends `X-Powered-By: Next.js` by default; this is the one built-in
  // toggle to remove it.
  poweredByHeader: false,
  // Phase 16: closes the "no HTTP security headers" Critical finding in
  // docs/phase15-production-readiness-report.md (apps/api got the same
  // treatment via helmet in apps/api/src/main.ts — this is the frontend
  // half). Applied to every route via the catch-all matcher.
  //
  // CSP tradeoff, disclosed rather than silently chosen: `script-src`
  // includes 'unsafe-inline' because Next.js's own hydration/RSC payload
  // uses inline <script> tags, and this project has no nonce-issuing
  // middleware to tighten that further without adding new request-time
  // infrastructure (out of this phase's scope — "no architecture
  // changes"). This is still a real improvement over no CSP at all
  // (blocks third-party injected scripts, restricts object/frame/base),
  // just not the strictest possible CSP. Documented, not hidden — see
  // docs/phase16-production-validation-report.md.
  async headers() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // 'https:' (not a fixed origin) is required, not just permissive:
      // media uploads/downloads go direct-to-storage via a presigned URL
      // (packages/api-client/src/resources/files.ts's `xhr.open('PUT',
      // uploadUrl)`) whose host is whatever S3-compatible provider is
      // configured server-side (Backblaze B2 today) — not knowable at
      // build time and not exposed as a NEXT_PUBLIC_ env var. Same
      // reasoning as img-src's 'https:' above, for the same underlying
      // architectural fact (docs/09-PLATFORM-ARCHITECTURE.md §9).
      `connect-src 'self' ${apiOrigin} https:`,
      'upgrade-insecure-requests',
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
