// Data-access layer for Project/ProjectSubmission/ProjectEvaluation
// (Phase 26 — docs/16-API-CONTRACT.md §21). Same thin-repository shape as
// CoursesRepository/CertificatesRepository.

import { Injectable } from '@nestjs/common';
import { Prisma, Project, ProjectSubmission } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Project ---

  findByCourseId(courseId: string, publishedOnly: boolean): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { courseId, ...(publishedOnly ? { status: 'published' } : {}) },
      orderBy: { position: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: { sourceLesson: { select: { id: true, title: true } } },
    });
  }

  findBySourceLessonId(sourceLessonId: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { sourceLessonId } });
  }

  create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data });
  }

  // --- ProjectSubmission ---

  findLatestAttempt(projectId: string, userId: string): Promise<ProjectSubmission | null> {
    return this.prisma.projectSubmission.findFirst({
      where: { projectId, userId },
      orderBy: { attemptNumber: 'desc' },
    });
  }

  createSubmission(data: Prisma.ProjectSubmissionCreateInput): Promise<ProjectSubmission> {
    return this.prisma.projectSubmission.create({ data });
  }

  findSubmissionById(id: string) {
    return this.prisma.projectSubmission.findUnique({
      where: { id },
      include: {
        evaluation: true,
        project: { select: { id: true, courseId: true, title: true } },
      },
    });
  }

  async findMySubmissions(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<PaginatedResult<ProjectSubmission>> {
    const items = await this.prisma.projectSubmission.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { evaluation: true, project: { select: { id: true, title: true } } },
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  async findForCourse(
    courseId: string,
    filters: { projectId?: string; status?: string },
    cursor: string | undefined,
    limit: number,
  ): Promise<PaginatedResult<ProjectSubmission>> {
    const where: Prisma.ProjectSubmissionWhereInput = {
      project: { courseId },
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const items = await this.prisma.projectSubmission.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { evaluation: true, project: { select: { id: true, title: true } } },
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  updateSubmissionStatus(id: string, status: string): Promise<ProjectSubmission> {
    return this.prisma.projectSubmission.update({ where: { id }, data: { status } });
  }

  // --- ProjectEvaluation (created transactionally with the submission-status update) ---

  async createEvaluation(
    submissionId: string,
    data: Omit<Prisma.ProjectEvaluationCreateInput, 'submission'>,
  ) {
    const [, evaluation] = await this.prisma.$transaction([
      this.prisma.projectSubmission.update({
        where: { id: submissionId },
        data: { status: 'evaluated' },
      }),
      this.prisma.projectEvaluation.create({
        data: { ...data, submission: { connect: { id: submissionId } } },
      }),
    ]);
    return evaluation;
  }
}
