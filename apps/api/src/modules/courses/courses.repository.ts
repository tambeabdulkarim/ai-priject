// Data-access layer for Courses (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Course, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface ListCoursesParams {
  cursor?: string;
  limit: number;
  categoryId?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  search?: string;
  /** When set, published courses OR drafts owned by this instructor are included. Otherwise, published only. */
  viewerId?: string;
}

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    params: ListCoursesParams,
  ): Promise<{ items: Course[]; nextCursor: string | null }> {
    const priceFilter =
      params.minPriceCents !== undefined || params.maxPriceCents !== undefined
        ? {
            priceCents: {
              ...(params.minPriceCents !== undefined ? { gte: params.minPriceCents } : {}),
              ...(params.maxPriceCents !== undefined ? { lte: params.maxPriceCents } : {}),
            },
          }
        : {};

    const visibility: Prisma.CourseWhereInput = params.viewerId
      ? { OR: [{ status: 'published' }, { instructorId: params.viewerId }] }
      : { status: 'published' };

    const where: Prisma.CourseWhereInput = {
      AND: [
        visibility,
        params.categoryId ? { categoryId: params.categoryId } : {},
        priceFilter,
        params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const items = await this.prisma.course.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  findBySlug(slug: string) {
    return this.prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { position: 'asc' },
          include: { lessons: { orderBy: { position: 'asc' } } },
        },
      },
    });
  }

  findById(id: string): Promise<Course | null> {
    return this.prisma.course.findUnique({ where: { id } });
  }

  findByIdWithModules(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: { modules: { include: { lessons: true } } },
    });
  }

  create(data: Prisma.CourseCreateInput): Promise<Course> {
    return this.prisma.course.create({ data });
  }

  update(id: string, data: Prisma.CourseUpdateInput): Promise<Course> {
    return this.prisma.course.update({ where: { id }, data });
  }

  /**
   * Kept local to CoursesRepository (a small, self-contained duplicate of
   * the identical query in LessonsRepository) rather than importing
   * LessonsModule/EnrollmentsModule here — both of those modules already
   * import CoursesModule, so the reverse import would create a circular
   * module dependency. Same trivial one-line query, no business logic to
   * diverge.
   */
  hasActiveEnrollment(userId: string, courseId: string): Promise<boolean> {
    return this.prisma.enrollment
      .findFirst({ where: { userId, courseId, status: 'active' } })
      .then((e) => e !== null);
  }
}
