// docs/16-API-CONTRACT.md §20 (Learning Paths). Phase 26 — closes the
// architecture gap docs/phase25-content-production-report.md's Database
// Findings #1 documented: a learning path previously existed only as
// documentation, not a real, queryable/enrollable resource.

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LearningPath } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { slugify } from '../../common/utils/slugify';
import { CoursesRepository } from '../courses/courses.repository';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { ListLearningPathsQueryDto } from './dto/list-learning-paths-query.dto';
import { SetLearningPathCoursesDto } from './dto/set-learning-path-courses.dto';
import { UpdateLearningPathDto } from './dto/update-learning-path.dto';
import { LearningPathsRepository } from './learning-paths.repository';

@Injectable()
export class LearningPathsService {
  constructor(
    private readonly learningPathsRepository: LearningPathsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  /** docs/16-API-CONTRACT.md GET /learning-paths */
  async list(
    query: ListLearningPathsQueryDto,
    viewerId?: string,
  ): Promise<PaginatedResult<LearningPath>> {
    // Same "published unless authenticated" simplification as Courses'
    // public list — a full role-aware draft-visibility list isn't needed
    // for the minimum stable architecture this phase targets; authenticated
    // staff can still reach a specific draft path via getBySlug once they
    // know its slug (same as an unpublished Course today).
    return this.learningPathsRepository.findMany({
      cursor: query.cursor,
      limit: query.limit,
      publishedOnly: viewerId === undefined,
    });
  }

  /** docs/16-API-CONTRACT.md GET /learning-paths/:slug */
  async getBySlug(slug: string, viewerId?: string) {
    const path = await this.learningPathsRepository.findBySlug(slug);
    if (!path) {
      throw new NotFoundException('Learning path not found.');
    }
    if (path.status !== 'published' && viewerId === undefined) {
      throw new NotFoundException('Learning path not found.');
    }
    return path;
  }

  /** docs/16-API-CONTRACT.md POST /learning-paths */
  async create(actorId: string, dto: CreateLearningPathDto): Promise<LearningPath> {
    const slug = await this.generateUniqueSlug(dto.title);
    const path = await this.learningPathsRepository.create({
      title: dto.title,
      slug,
      description: dto.description,
      status: 'draft',
    });

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'learning_path.created',
      targetType: 'LearningPath',
      targetId: path.id,
    });
    return path;
  }

  /** docs/16-API-CONTRACT.md PATCH /learning-paths/:id */
  async update(id: string, dto: UpdateLearningPathDto): Promise<LearningPath> {
    const path = await this.learningPathsRepository.findById(id);
    if (!path) {
      throw new NotFoundException('Learning path not found.');
    }
    return this.learningPathsRepository.update(id, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    });
  }

  /** docs/16-API-CONTRACT.md POST /learning-paths/:id/publish */
  async publish(id: string, actorId: string): Promise<LearningPath> {
    const path = await this.learningPathsRepository.findById(id);
    if (!path) {
      throw new NotFoundException('Learning path not found.');
    }
    const courseCount = await this.learningPathsRepository.countCourses(id);
    if (courseCount === 0) {
      throw new ConflictException(
        'Learning path must have at least one course before it can be published.',
      );
    }

    const updated = await this.learningPathsRepository.update(id, { status: 'published' });
    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'learning_path.published',
      targetType: 'LearningPath',
      targetId: id,
    });
    return updated;
  }

  /**
   * docs/16-API-CONTRACT.md PUT /learning-paths/:id/courses — replaces the
   * full ordered course list. Every referenced course must exist; the
   * DTO's own `@ArrayUnique` catches a client-side duplicate before this
   * runs, and `LearningPathCourse`'s DB unique constraint is the final
   * guard against duplicate membership regardless.
   */
  async setCourses(id: string, actorId: string, dto: SetLearningPathCoursesDto): Promise<LearningPath> {
    const path = await this.learningPathsRepository.findById(id);
    if (!path) {
      throw new NotFoundException('Learning path not found.');
    }

    for (const courseId of dto.courseIds) {
      const course = await this.coursesRepository.findById(courseId);
      if (!course) {
        throw new BadRequestException(`Course ${courseId} not found.`);
      }
    }

    const before = path.courses.map((c) => c.courseId);
    await this.learningPathsRepository.replaceCourses(id, dto.courseIds);

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'learning_path.courses_updated',
      targetType: 'LearningPath',
      targetId: id,
      beforeState: { courseIds: before },
      afterState: { courseIds: dto.courseIds },
    });

    const updated = await this.learningPathsRepository.findBySlug(path.slug);
    if (!updated) {
      throw new NotFoundException('Learning path not found.');
    }
    return updated as unknown as LearningPath;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    if (!base) {
      throw new BadRequestException('Title must contain at least one letter or number.');
    }
    let candidate = base;
    let suffix = 1;
    while (await this.learningPathsRepository.findBySlug(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}
