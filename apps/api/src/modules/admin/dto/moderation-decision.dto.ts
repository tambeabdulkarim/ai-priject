// docs/16-API-CONTRACT.md POST /admin/moderation/comments/:id/decision —
// Request Body: `decision` (approve/hide), `reason`. Validation Rules: none
// — so beyond `decision` being one of the two documented values and
// `reason` being the documented string field, no extra constraint (e.g. a
// minimum length) is enforced. (Corrected during the Phase 13 final audit:
// an earlier `@MinLength(3)` on `reason` was stricter than the doc allows.)

import { IsIn, IsString } from 'class-validator';

export class ModerationDecisionDto {
  @IsIn(['approve', 'hide'])
  decision!: 'approve' | 'hide';

  @IsString()
  reason!: string;
}
