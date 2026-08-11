// docs/16-API-CONTRACT.md §15 (AI).
//
// BLOCKED BY DOCUMENTATION — POST /ai/requests dispatch: docs/12-AI-
// INTEGRATION-BIBLE.md is a governance/philosophy document, not an
// implementation spec. It never defines:
//  - An actual feature catalog (what values `feature` may take).
//  - Per-feature `input` schemas ("varies per feature" per doc16, but no
//    feature's schema is given anywhere in doc12).
//  - The "feature-specific permission" keys doc16 requires for
//    authorization ("varies by AI feature" — no keys named).
//  - Concrete provider adapter behavior — doc12 §2-§4 describe the
//    Gateway abstraction conceptually (interface names like
//    generateCompletion/streamChat) but specify no real provider API
//    calls, no request/response mapping, and AI_PROVIDER_OPENAI_API_KEY /
//    AI_PROVIDER_ANTHROPIC_API_KEY are blank in every env file.
//  - Quota thresholds — doc12 §9 requires quota enforcement "before
//    dispatch" but never states a number or a plan-tier mapping.
// Implementing dispatch would require inventing all of the above, which
// this session's rules forbid. The two read endpoints below have no such
// gap (they read already-shaped rows from the existing AiRequest/AiUsage
// tables) and are fully implemented.

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { AiRequest, AiUsage } from '@prisma/client';
import { AiRepository } from './ai.repository';

@Injectable()
export class AiService {
  constructor(private readonly aiRepository: AiRepository) {}

  /** docs/16-API-CONTRACT.md POST /ai/requests — see file header. */
  createRequest(): never {
    throw new NotImplementedException(
      'BLOCKED BY DOCUMENTATION: docs/12-AI-INTEGRATION-BIBLE.md defines no feature catalog, ' +
        'no per-feature input schema, no feature-specific permission keys, and no provider adapter ' +
        'implementation — see ai.service.ts header for the full list.',
    );
  }

  /** docs/16-API-CONTRACT.md GET /ai/requests/:id — resource owner. */
  async getRequestById(id: string, actorId: string): Promise<AiRequest> {
    const request = await this.aiRepository.findRequestById(id);
    if (!request) {
      throw new NotFoundException('AI request not found.');
    }
    if (request.userId !== actorId) {
      throw new ForbiddenException('Not authorized to view this AI request.');
    }
    return request;
  }

  /** docs/16-API-CONTRACT.md GET /ai/usage/me — resource owner. */
  async getMyUsage(userId: string): Promise<
    | Pick<AiUsage, 'periodStart' | 'periodEnd' | 'requestsUsed' | 'tokensUsed' | 'quotaLimit'>
    | {
        periodStart: null;
        periodEnd: null;
        requestsUsed: 0;
        tokensUsed: 0;
        quotaLimit: null;
      }
  > {
    const usage = await this.aiRepository.findCurrentUsage(userId, new Date());
    if (!usage) {
      // No AI_Usage row exists for the current period — genuinely no
      // usage has been tracked yet (nothing provisions one automatically;
      // see ai.repository.ts). Reporting a real zero state rather than
      // inventing a quota_limit value that appears nowhere in the docs.
      return {
        periodStart: null,
        periodEnd: null,
        requestsUsed: 0,
        tokensUsed: 0,
        quotaLimit: null,
      };
    }
    return {
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
      requestsUsed: usage.requestsUsed,
      tokensUsed: usage.tokensUsed,
      quotaLimit: usage.quotaLimit,
    };
  }
}
