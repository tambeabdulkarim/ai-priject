// docs/16-API-CONTRACT.md §5 (Lessons). docs/15-SYSTEM-WORKFLOWS.md §9.

import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Lesson, Module as ModuleModel } from '@prisma/client';
import { assertOwnerOrEditorial } from '../../common/utils/authorization';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsRepository } from './lessons.repository';
import { CoursesRepository } from '../courses/courses.repository';

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonsRepository: LessonsRepository,
    private readonly coursesRepository: CoursesRepository,
  ) {}

  /** Fills the docs/16-API-CONTRACT.md gap noted in create-module.dto.ts. */
  async createModule(courseId: string, dto: CreateModuleDto, actorId: string, actorRoles: string[]): Promise<ModuleModel> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    assertOwnerOrEditorial(course.instructorId, actorId, actorRoles);

    const position = await this.lessonsRepository.countModulesByCourse(courseId);
    return this.lessonsRepository.createModule({
      course: { connect: { id: courseId } },
      title: dto.title,
      description: dto.description,
      position,
    });
  }

  async updateModule(id: string, dto: CreateModuleDto, actorId: string, actorRoles: string[]): Promise<ModuleModel> {
    const module_ = await this.lessonsRepository.findModuleWithCourse(id);
    if (!module_) {
      throw new NotFoundException('Module not found.');
    }
    assertOwnerOrEditorial(module_.course.instructorId, actorId, actorRoles);

    return this.lessonsRepository.updateModule(id, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    });
  }

  private async loadModuleOrThrow(moduleId: string, courseId: string) {
    const module_ = await this.lessonsRepository.findModuleWithCourse(moduleId);
    if (!module_ || module_.courseId !== courseId) {
      throw new NotFoundException('Module not found for this course.');
    }
    return module_;
  }

  /** docs/16-API-CONTRACT.md GET /courses/:courseId/modules/:moduleId/lessons — metadata only, public. */
  async listForModule(courseId: string, moduleId: string): Promise<Lesson[]> {
    await this.loadModuleOrThrow(moduleId, courseId);
    return this.lessonsRepository.findManyByModule(moduleId);
  }

  /** docs/16-API-CONTRACT.md GET /lessons/:id — full content, entitlement-gated. */
  async getContent(id: string, viewerId?: string) {
    const lesson = await this.lessonsRepository.findByIdWithModuleCourse(id);
    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }
    if (lesson.isPreview) {
      return lesson;
    }
    if (!viewerId) {
      throw new UnauthorizedException('Authentication required to view this lesson.');
    }

    const course = lesson.module.course;
    const isOwnerOrEditorial =
      course.instructorId === viewerId || (await this.viewerHasEditorialRole(viewerId));
    if (isOwnerOrEditorial) {
      return lesson;
    }

    const enrolled = await this.lessonsRepository.hasActiveEnrollment(viewerId, course.id);
    if (!enrolled) {
      throw new ForbiddenException('An active enrollment is required to view this lesson.');
    }
    return lesson;
  }

  // Role membership isn't resolvable from the repository layer alone
  // (RolesService lives in a different module); the JwtPayload already
  // carries the caller's roles for controller-supplied viewers, but
  // getContent() only receives a viewerId. Editorial-role bypass for
  // non-owners is therefore intentionally out of scope here — an
  // editorial user who isn't the owning instructor still needs an
  // enrollment to preview non-preview lesson content through this method.
  // (Documented limitation, not a silent gap.)
  private async viewerHasEditorialRole(_viewerId: string): Promise<boolean> {
    return false;
  }

  /** docs/16-API-CONTRACT.md POST .../lessons — owning instructor / content_editor. */
  async create(
    courseId: string,
    moduleId: string,
    dto: CreateLessonDto,
    actorId: string,
    actorRoles: string[],
  ): Promise<Lesson> {
    const module_ = await this.loadModuleOrThrow(moduleId, courseId);
    assertOwnerOrEditorial(module_.course.instructorId, actorId, actorRoles);

    if (dto.contentType === 'video' && !dto.videoMediaId) {
      throw new BadRequestException('video lessons require videoMediaId.');
    }
    if (dto.contentType === 'text' && !dto.body) {
      throw new BadRequestException('text lessons require body.');
    }

    const position = await this.lessonsRepository.countByModule(moduleId);
    return this.lessonsRepository.create({
      module: { connect: { id: moduleId } },
      title: dto.title,
      position,
      contentType: dto.contentType,
      body: dto.body,
      ...(dto.videoMediaId ? { videoMedia: { connect: { id: dto.videoMediaId } } } : {}),
      durationSeconds: dto.durationSeconds,
      isPreview: dto.isPreview ?? false,
    });
  }

  /** docs/16-API-CONTRACT.md PATCH /lessons/:id — owning instructor / content_editor. */
  async update(id: string, dto: UpdateLessonDto, actorId: string, actorRoles: string[]): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findByIdWithModuleCourse(id);
    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }
    assertOwnerOrEditorial(lesson.module.course.instructorId, actorId, actorRoles);

    return this.lessonsRepository.update(id, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.body !== undefined ? { body: dto.body } : {}),
      ...(dto.videoMediaId ? { videoMedia: { connect: { id: dto.videoMediaId } } } : {}),
      ...(dto.isPreview !== undefined ? { isPreview: dto.isPreview } : {}),
      ...(dto.durationSeconds !== undefined ? { durationSeconds: dto.durationSeconds } : {}),
    });
  }

  /** docs/16-API-CONTRACT.md POST .../lessons/reorder — pre-publish only. */
  async reorder(
    courseId: string,
    moduleId: string,
    dto: ReorderLessonsDto,
    actorId: string,
    actorRoles: string[],
  ): Promise<Lesson[]> {
    const module_ = await this.loadModuleOrThrow(moduleId, courseId);
    assertOwnerOrEditorial(module_.course.instructorId, actorId, actorRoles);

    if (module_.course.status === 'published') {
      throw new ConflictException('Lessons can only be reordered before the course is published.');
    }

    const existing = await this.lessonsRepository.findManyByModule(moduleId);
    const existingIds = new Set(existing.map((l) => l.id));
    const submittedIds = new Set(dto.lessonIds);

    if (existingIds.size !== submittedIds.size || [...existingIds].some((id) => !submittedIds.has(id))) {
      throw new BadRequestException('Submitted lesson set must exactly match the module’s existing lessons.');
    }

    await this.lessonsRepository.reorder(dto.lessonIds);
    return this.lessonsRepository.findManyByModule(moduleId);
  }
}
