// docs/16-API-CONTRACT.md §18 (Administration) — moderation queue and
// comment decisions.

import { Injectable, NotFoundException } from '@nestjs/common';
import { Comment, Course } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { ListModerationQueueQueryDto } from './dto/list-moderation-queue-query.dto';
import { ModerationDecisionDto } from './dto/moderation-decision.dto';
import { ModerationRepository } from './moderation.repository';

export interface ModerationQueueResult {
  courses?: PaginatedResult<Course>;
  comments?: PaginatedResult<Comment>;
}

@Injectable()
export class ModerationService {
  constructor(
    private readonly moderationRepository: ModerationRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * docs/16-API-CONTRACT.md GET /admin/moderation/queue.
   *
   * Bug fixed during the Phase 13 final audit: when no `content_type`
   * filter is given, this previously passed the single incoming `cursor`
   * value to BOTH the Course and Comment queries. A cursor is a record id
   * from one specific table — reused against the other table, Prisma's
   * `cursor: { id }` throws (the id doesn't exist in that table) once a
   * caller tried to paginate past page 1 of the combined view, surfacing
   * as an unhandled 500. A single cursor cannot unambiguously paginate two
   * different entity types at once without a documented composite-cursor
   * scheme (none exists in doc16). Fix: cursor pagination is only applied
   * when `content_type` narrows the query to a single table; the combined
   * (unfiltered) view always returns each list's first page.
   */
  async listQueue(query: ListModerationQueueQueryDto): Promise<ModerationQueueResult> {
    if (query.content_type === 'course') {
      return {
        courses: await this.moderationRepository.findCoursesInReview({
          cursor: query.cursor,
          limit: query.limit,
        }),
      };
    }
    if (query.content_type === 'comment') {
      return {
        comments: await this.moderationRepository.findFlaggedComments({
          cursor: query.cursor,
          limit: query.limit,
        }),
      };
    }

    const [courses, comments] = await Promise.all([
      this.moderationRepository.findCoursesInReview({ limit: query.limit }),
      this.moderationRepository.findFlaggedComments({ limit: query.limit }),
    ]);
    return { courses, comments };
  }

  /** docs/16-API-CONTRACT.md POST /admin/moderation/comments/:id/decision — Audit Logging: Yes, mandatory. */
  async decideComment(id: string, dto: ModerationDecisionDto, actorId: string): Promise<Comment> {
    const comment = await this.moderationRepository.findCommentById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    const newStatus = dto.decision === 'approve' ? 'visible' : 'hidden';
    const updated = await this.moderationRepository.updateCommentStatus(id, newStatus);

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'comment.moderation_decision',
      targetType: 'Comment',
      targetId: id,
      beforeState: { status: comment.status },
      afterState: { status: newStatus, decision: dto.decision, reason: dto.reason },
    });

    return updated;
  }
}
