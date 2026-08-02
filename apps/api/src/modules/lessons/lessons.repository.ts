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

  findById(id: string): Promise<Lesson | null> {
    return this.prisma.lesson.findUnique({ where: { id } });
  }

  findByIdWithModuleCourse(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
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
