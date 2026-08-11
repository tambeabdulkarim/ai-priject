// Data-access layer for Enrollments (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Course, Enrollment, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type EnrollmentWithCourse = Enrollment & { course: Course };

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  }

  findById(id: string): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({ where: { id } });
  }

  /** Used by refund() to resolve the linked Order for a purchased enrollment's OrderItem. */
  async findOrderIdForOrderItem(orderItemId: string): Promise<string | null> {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { orderId: true },
    });
    return orderItem?.orderId ?? null;
  }

  create(data: Prisma.EnrollmentCreateInput): Promise<Enrollment> {
    return this.prisma.enrollment.create({ data });
  }

  update(id: string, data: Prisma.EnrollmentUpdateInput): Promise<Enrollment> {
    return this.prisma.enrollment.update({ where: { id }, data });
  }

  async findManyForUser(params: {
    userId: string;
    cursor?: string;
    limit: number;
    status?: string;
  }): Promise<{ items: EnrollmentWithCourse[]; nextCursor: string | null }> {
    const items = await this.prisma.enrollment.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where: { userId: params.userId, ...(params.status ? { status: params.status } : {}) },
      orderBy: { enrolledAt: 'desc' },
      include: { course: true },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }
}
