// docs/10-SECURITY-BIBLE.md §7: claims kept minimal — subject, session,
// role scope, issued-at, expiry. No PII beyond what's operationally
// necessary is embedded in the token payload.

export interface JwtPayload {
  /** Subject — the authenticated user's id. */
  sub: string;
  /** The session this access token was issued for (enables revocation lookups). */
  sessionId: string;
  /** Role names granted to the user at issuance time. */
  roles: string[];
  /** Set only when the token carries the elevated admin session scope. */
  adminScope?: boolean;
  iat?: number;
  exp?: number;
  iss?: string;
}
