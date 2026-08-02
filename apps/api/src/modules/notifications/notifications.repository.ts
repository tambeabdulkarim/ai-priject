// Data-access layer for Notifications (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    userId: string;
    cursor?: string;
    limit: number;
    status?: 'read' | 'unread';
  }): Promise<{ items: Notification[]; nextCursor: string | null }> {
    const where: Prisma.NotificationWhereInput = {
      userId: params.userId,
      ...(params.status === 'unread' ? { readAt: null } : {}),
      ...(params.status === 'read' ? { readAt: { not: null } } : {}),
    };

    const items = await this.prisma.notification.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;

    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  markRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  markAllRead(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }
}
