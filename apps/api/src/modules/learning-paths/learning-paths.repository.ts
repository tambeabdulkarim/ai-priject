// Data-access layer for LearningPaths (Phase 26 — docs/16-API-CONTRACT.md §20).
// Same thin-repository shape as CoursesRepository/CertificatesRepository.

import { Injectable } from '@nestjs/common';
import { LearningPath, Prisma } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';

const courseSummarySelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  status: true,
  priceCents: true,
} satisfies Prisma.CourseSelect;

@Injectable()
export class LearningPathsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    cursor?: string;
    limit: number;
    publishedOnly: boolean;
  }): Promise<PaginatedResult<LearningPath & { _count: { courses: number } }>> {
    const { cursor, limit, publishedOnly } = params;
    const items = await this.prisma.learningPath.findMany({
      where: publishedOnly ? { status: 'published' } : undefined,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { courses: true } } },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  findBySlug(slug: string) {
    return this.prisma.learningPath.findUnique({
      where: { slug },
      include: {
        courses: {
          orderBy: { position: 'asc' },
          include: { course: { select: courseSummarySelect } },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.learningPath.findUnique({
      where: { id },
      include: {
        courses: { orderBy: { position: 'asc' } },
      },
    });
  }

  create(data: Prisma.LearningPathCreateInput): Promise<LearningPath> {
    return this.prisma.learningPath.create({ data });
  }

  update(id: string, data: Prisma.LearningPathUpdateInput): Promise<LearningPath> {
    return this.prisma.learningPath.update({ where: { id }, data });
  }

  /**
   * Replaces the full ordered course list for a path in one transaction —
   * simpler and safer than diffing add/remove/reorder operations
   * separately for what is expected to be a low-frequency, small-list
   * admin action (typically single digits of courses per path).
   */
  async replaceCourses(
    learningPathId: string,
    courseIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.learningPathCourse.deleteMany({ where: { learningPathId } }),
      this.prisma.learningPathCourse.createMany({
        data: courseIds.map((courseId, index) => ({
          learningPathId,
          courseId,
          position: index + 1,
        })),
      }),
    ]);
  }

  countCourses(learningPathId: string): Promise<number> {
    return this.prisma.learningPathCourse.count({ where: { learningPathId } });
  }
}
