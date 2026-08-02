// docs/16-API-CONTRACT.md GET /admin/moderation/queue — pagination,
// filter by content type. The only content types the queue documents are
// courses (in_review) and comments (flagged) — "etc." names nothing else
// concretely, so no other type is invented here.

import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const MODERATION_CONTENT_TYPES = ['course', 'comment'] as const;
export type ModerationContentType = (typeof MODERATION_CONTENT_TYPES)[number];

export class ListModerationQueueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(MODERATION_CONTENT_TYPES)
  content_type?: ModerationContentType;
}
