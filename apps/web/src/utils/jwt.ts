// Client-side JWT payload decoding ONLY — never verification (there's no
// secret on the client to verify a signature with, and pretending to
// verify would be actively misleading). Used exclusively to read the
// `roles`/`sub` claims for UI-convenience checks
// (docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §2.11) — the real
// authorization check always happens server-side, regardless of what
// this decodes.

import type { JwtClaims } from '@phoenix/types';

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  if (typeof atob === 'function') {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  }
  // Server-side (no `atob` global in older Node runtimes) fallback.
  return Buffer.from(padded, 'base64').toString('utf-8');
}

export function decodeJwtPayload(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtClaims;
  } catch {
    return null;
  }
}
