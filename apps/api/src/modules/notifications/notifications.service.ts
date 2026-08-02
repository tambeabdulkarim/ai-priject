import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsRepository } from './notifications.repository';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
  sourceEventId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  /**
   * Used by other domain services to emit the in-app notifications
   * docs/15-SYSTEM-WORKFLOWS.md requires (e.g. Workflow 8 "You're
   * enrolled", completion milestones, certificate issuance). `channel` is
   * always `in_app` here — email/push delivery is a separate, unbuilt
   * integration (docs/SESSION-HANDOFF.md Blocker: no email provider).
   */
  create(params: CreateNotificationParams): Promise<Notification> {
    return this.notificationsRepository.create({
      user: { connect: { id: params.userId } },
      type: params.type,
      title: params.title,
      body: params.body,
      linkUrl: params.linkUrl,
      channel: 'in_app',
      sourceEventId: params.sourceEventId,
    });
  }

  /** docs/16-API-CONTRACT.md GET /notifications/me */
  async listForUser(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<PaginatedResult<Notification> & { unreadCount: number }> {
    const [{ items, nextCursor }, unreadCount] = await Promise.all([
      this.notificationsRepository.findMany({
        userId,
        cursor: query.cursor,
        limit: query.limit,
        status: query.status,
      }),
      this.notificationsRepository.countUnread(userId),
    ]);
    return { items, nextCursor, unreadCount };
  }

  /** docs/16-API-CONTRACT.md PATCH /notifications/:id/read — resource-owner only. */
  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('Not the owner of this notification.');
    }
    if (notification.readAt) {
      return notification;
    }
    return this.notificationsRepository.markRead(id);
  }

  /** docs/16-API-CONTRACT.md POST /notifications/read-all */
  async markAllRead(userId: string): Promise<number> {
    const result = await this.notificationsRepository.markAllRead(userId);
    return result.count;
  }
}
