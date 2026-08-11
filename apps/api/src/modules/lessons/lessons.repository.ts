// Data-access layer for Modules/Lessons (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Lesson, Module as ModuleModel, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LessonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findModuleById(id: string): Promise<ModuleModel | null> {
    return this.prisma.module.findUnique({ where: { id } });
  }

  findModuleWithCourse(id: string) {
    return this.prisma.module.findUnique({ where: { id }, include: { course: true } });
  }

  createModule(data: Prisma.ModuleCreateInput): Promise<ModuleModel> {
    return this.prisma.module.create({ data });
  }

  updateModule(id: string, data: Prisma.ModuleUpdateInput): Promise<ModuleModel> {
    return this.prisma.module.update({ where: { id }, data });
  }

  countModulesByCourse(courseId: string): Promise<number> {
    return this.prisma.module.count({ where: { courseId } });
  }

  findManyByModule(moduleId: string): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({ where: { moduleId }, orderBy: { position: 'asc' } });
  }

  /**
   * docs/16-API-CONTRACT.md GET .../lessons — "Response Body: ordered list
   * of lesson summaries (title, type, duration, is_preview)". Fixed during
   * the Phase 13 final audit: `findManyByModule` (above) returns the full
   * row including `body`, which this public, unauthenticated-by-default
   * endpoint was leaking for every lesson (including non-preview ones)
   * regardless of viewer entitlement. This method returns only the
   * documented summary fields; `findManyByModule` is kept for internal
   * callers (`reorder`) that need full rows.
   */
  findSummariesByModule(moduleId: string) {
    return this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        title: true,
        contentType: true,
        durationSeconds: true,
        isPreview: true,
        position: true,
      },
    });
  }

  findById(id: string): Promise<Lesson | null> {
    return this.prisma.lesson.findUnique({ where: { id } });
  }

  // Phase 28: `quizzes` selected minimally (id only) so the frontend can
  // discover a quiz-type lesson's real quiz ID to call the new
  // GET /progress/quizzes/:quizId with — the same approved gap-closing
  // change as that endpoint, not a separate decision. Never exposes
  // question content or answers here; only an id.
  findByIdWithModuleCourse(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } }, quizzes: { select: { id: true } } },
    });
  }

  create(data: Prisma.LessonCreateInput): Promise<Lesson> {
    return this.prisma.lesson.create({ data });
  }

  update(id: string, data: Prisma.LessonUpdateInput): Promise<Lesson> {
    return this.prisma.lesson.update({ where: { id }, data });
  }

  countByModule(moduleId: string): Promise<number> {
    return this.prisma.lesson.count({ where: { moduleId } });
  }

  reorder(orderedIds: string[]): Promise<void> {
    return this.prisma
      .$transaction(
        orderedIds.map((id, index) =>
          this.prisma.lesson.update({
            where: { id },
            data: { position: index },
          }),
        ),
      )
      .then(() => undefined);
  }

  /** Read-only entitlement check — Enrollment belongs to the same `courses` schema/domain as Lessons. */
  hasActiveEnrollment(userId: string, courseId: string): Promise<boolean> {
    return this.prisma.enrollment
      .findFirst({ where: { userId, courseId, status: 'active' } })
      .then((e) => e !== null);
  }
}
