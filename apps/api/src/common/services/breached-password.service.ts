// docs/10-SECURITY-BIBLE.md §4: "Passwords are checked against a breached-
// password list (e.g., Have I Been Pwned range API) at registration and
// password-change time; a match is rejected regardless of complexity."
// docs/16-API-CONTRACT.md POST /auth/register Validation Rules: "breached-
// password check". Fixed during the Phase 13 final audit — this control
// was entirely missing from the implementation despite being unambiguously
// required, with the exact mechanism named.
//
// Uses the HIBP k-anonymity range API: only the first 5 hex characters of
// the password's SHA-1 hash are ever sent, never the password or full
// hash — the real password never leaves the server. Fails OPEN (logs a
// warning, does not block the request) on network/API failure — a
// third-party outage should degrade a defense-in-depth check, not take
// down registration/password-change entirely.

import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/';

@Injectable()
export class BreachedPasswordService {
  private readonly logger = new Logger(BreachedPasswordService.name);

  async isBreached(plainPassword: string): Promise<boolean> {
    const sha1 = createHash('sha1').update(plainPassword).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    try {
      const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      });
      if (!response.ok) {
        this.logger.warn(`HIBP range API returned ${response.status} — breached-password check skipped.`);
        return false;
      }
      const body = await response.text();
      return body.split('\n').some((line) => line.trim().split(':')[0] === suffix);
    } catch (error) {
      this.logger.warn(`HIBP range API unreachable — breached-password check skipped: ${(error as Error).message}`);
      return false;
    }
  }
}
