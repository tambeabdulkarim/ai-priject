// docs/16-API-CONTRACT.md §4 (Courses). docs/15-SYSTEM-WORKFLOWS.md course
// authoring/publish workflow.

import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Course } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { assertOwnerOrEditorial } from '../../common/utils/authorization';
import { slugify } from '../../common/utils/slugify';
import { CategoriesService } from '../categories/categories.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesRepository } from './courses.repository';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly categoriesService: CategoriesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /** docs/16-API-CONTRACT.md GET /courses */
  async list(query: ListCoursesQueryDto, viewerId?: string): Promise<PaginatedResult<Course>> {
    return this.coursesRepository.findMany({
      cursor: query.cursor,
      limit: query.limit,
      categoryId: query.category,
      minPriceCents: query.minPriceCents,
      maxPriceCents: query.maxPriceCents,
      search: query.q,
      viewerId,
    });
  }

  /** docs/16-API-CONTRACT.md GET /courses/:slug */
  async getBySlug(slug: string, viewerId?: string) {
    const course = await this.coursesRepository.findBySlug(slug);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    if (course.status !== 'published' && course.instructorId !== viewerId) {
      throw new NotFoundException('Course not found.');
    }
    return course;
  }

  /** docs/16-API-CONTRACT.md POST /courses */
  async create(instructorId: string, dto: CreateCourseDto): Promise<Course> {
    await this.categoriesService.findById(dto.categoryId);

    const slug = await this.generateUniqueSlug(dto.title);
    const course = await this.coursesRepository.create({
      instructor: { connect: { id: instructorId } },
      category: { connect: { id: dto.categoryId } },
      title: dto.title,
      slug,
      description: dto.description,
      priceCents: dto.priceCents ?? 0,
      status: 'draft',
    });

    await this.auditLogService.record({
      actorUserId: instructorId,
      action: 'course.created',
      targetType: 'Course',
      targetId: course.id,
    });

    return course;
  }

  /** docs/16-API-CONTRACT.md PATCH /courses/:id */
  async update(id: string, dto: UpdateCourseDto, actorId: string, actorRoles: string[]): Promise<Course> {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    assertOwnerOrEditorial(course.instructorId, actorId, actorRoles);

    if (dto.categoryId) {
      await this.categoriesService.findById(dto.categoryId);
    }

    // docs/16-API-CONTRACT.md: audit logging is required "for status-
    // affecting changes" — PATCH never changes status here (that's
    // submit-review/publish/archive, each audited separately), so this
    // path is routine content editing and intentionally not audit-logged.
    return this.coursesRepository.update(id, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
      ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
    });
  }

  /** docs/16-API-CONTRACT.md POST /courses/:id/submit-review — owning instructor only. */
  async submitForReview(id: string, actorId: string): Promise<Course> {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    if (course.instructorId !== actorId) {
      throw new ForbiddenException('Only the owning instructor may submit this course for review.');
    }
    if (course.status !== 'draft') {
      throw new ConflictException(`Cannot submit a course in status "${course.status}" for review.`);
    }

    const moduleCount = await this.countModulesWithLessons(id);
    if (moduleCount === 0) {
      throw new ConflictException('Course must have at least one module with a lesson before review.');
    }

    const updated = await this.coursesRepository.update(id, { status: 'in_review' });
    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'course.submitted_for_review',
      targetType: 'Course',
      targetId: id,
    });
    return updated;
  }

  private async countModulesWithLessons(courseId: string): Promise<number> {
    const full = await this.coursesRepository.findByIdWithModules(courseId);
    return full?.modules.filter((m) => m.lessons.length > 0).length ?? 0;
  }

  /** docs/16-API-CONTRACT.md POST /courses/:id/publish — course:publish permission. */
  async publish(id: string, actorId: string): Promise<Course> {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    if (course.status !== 'in_review') {
      throw new ConflictException('Course must be in review before it can be published.');
    }

    const updated = await this.coursesRepository.update(id, {
      status: 'published',
      publishedAt: new Date(),
    });

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'course.published',
      targetType: 'Course',
      targetId: id,
    });
    return updated;
  }

  /** docs/16-API-CONTRACT.md POST /courses/:id/archive — owning instructor or admin. */
  async archive(id: string, actorId: string, actorRoles: string[]): Promise<Course> {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    assertOwnerOrEditorial(course.instructorId, actorId, actorRoles);

    const updated = await this.coursesRepository.update(id, { status: 'archived' });
    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'course.archived',
      targetType: 'Course',
      targetId: id,
    });
    return updated;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    if (!base) {
      throw new BadRequestException('Title must contain at least one letter or number.');
    }
    let candidate = base;
    let suffix = 1;
    while (await this.coursesRepository.findBySlug(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}
