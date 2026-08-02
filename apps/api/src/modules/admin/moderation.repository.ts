// docs/16-API-CONTRACT.md GET /admin/moderation/queue — "items pending
// review (courses in_review, flagged comments, etc.)". Queried directly
// here (not via CoursesRepository) so the locked Courses module stays
// untouched — this is Phase 13's own read model over existing tables.

import { Injectable } from '@nestjs/common';
import { Comment, Course } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCoursesInReview(params: {
    cursor?: string;
    limit: number;
  }): Promise<{ items: Course[]; nextCursor: string | null }> {
    const items = await this.prisma.course.findMany({
      where: { status: 'in_review' },
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      orderBy: { updatedAt: 'asc' },
    });
    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  async findFlaggedComments(params: {
    cursor?: string;
    limit: number;
  }): Promise<{ items: Comment[]; nextCursor: string | null }> {
    const items = await this.prisma.comment.findMany({
      where: { status: 'flagged' },
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      orderBy: { updatedAt: 'asc' },
    });
    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  findCommentById(id: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  updateCommentStatus(id: string, status: 'visible' | 'hidden'): Promise<Comment> {
    return this.prisma.comment.update({ where: { id }, data: { status } });
  }
}
