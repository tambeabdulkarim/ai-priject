// docs/16-API-CONTRACT.md §21 (Projects). Phase 26 — closes the
// architecture gap docs/phase25-content-production-report.md's Database
// Findings #2 documented: project briefs existed (as Lesson rows), but a
// learner's submission and its evaluation had no persistent representation.

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import {
  assertOwnerOrRole,
  canViewAsModerator,
  isOwnerOrRole,
} from '../../common/utils/authorization';
import { CoursesRepository } from '../courses/courses.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { EvaluateSubmissionDto } from './dto/evaluate-submission.dto';
import { ListSubmissionsQueryDto } from './dto/list-submissions-query.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { ProjectsRepository } from './projects.repository';

// Same EDITORIAL_ROLES set used by Courses/Lessons (assertOwnerOrEditorial)
// — reused directly via the generic isOwnerOrRole/assertOwnerOrRole rather
// than re-exporting a second identical constant.
const EDITORIAL_ROLES = ['content_editor', 'admin', 'superadmin'];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  // --- Project ---

  /** docs/16-API-CONTRACT.md GET /courses/:courseId/projects */
  async listForCourse(courseId: string, viewerId?: string) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    return this.projectsRepository.findByCourseId(courseId, viewerId === undefined);
  }

  /** docs/16-API-CONTRACT.md GET /projects/:id */
  async getById(id: string) {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return project;
  }

  /** docs/16-API-CONTRACT.md POST /courses/:courseId/projects */
  async create(courseId: string, actorId: string, actorRoles: string[], dto: CreateProjectDto) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    assertOwnerOrRole(course.instructorId, actorId, actorRoles, EDITORIAL_ROLES);

    if (dto.sourceLessonId) {
      const existing = await this.projectsRepository.findBySourceLessonId(dto.sourceLessonId);
      if (existing) {
        throw new ConflictException('This lesson is already linked to another project.');
      }
    }

    const project = await this.projectsRepository.create({
      course: { connect: { id: courseId } },
      title: dto.title,
      description: dto.description,
      instructions: dto.instructions,
      ...(dto.sourceLessonId ? { sourceLesson: { connect: { id: dto.sourceLessonId } } } : {}),
      position: dto.position ?? 0,
      status: 'draft',
    });

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'project.created',
      targetType: 'Project',
      targetId: project.id,
    });
    return project;
  }

  /** docs/16-API-CONTRACT.md POST /courses/:courseId/projects/:id/publish */
  async publish(courseId: string, id: string, actorId: string, actorRoles: string[]) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    assertOwnerOrRole(course.instructorId, actorId, actorRoles, EDITORIAL_ROLES);

    const project = await this.projectsRepository.findById(id);
    if (!project || project.courseId !== courseId) {
      throw new NotFoundException('Project not found.');
    }

    const updated = await this.projectsRepository.update(id, { status: 'published' });
    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'project.published',
      targetType: 'Project',
      targetId: id,
    });
    return updated;
  }

  // --- ProjectSubmission ---

  /**
   * docs/16-API-CONTRACT.md POST /projects/:id/submissions — "resource
   * owner" here means the learner submitting, verified via the existing
   * Enrollment check (CoursesRepository.hasActiveEnrollment), the same
   * precondition already implicit in PUT /progress/lessons/:lessonId.
   */
  async submit(projectId: string, userId: string, dto: SubmitProjectDto) {
    if (!dto.content && !dto.fileId) {
      throw new BadRequestException('A submission must include content and/or a fileId.');
    }

    const project = await this.projectsRepository.findById(projectId);
    if (!project || project.status !== 'published') {
      throw new NotFoundException('Project not found.');
    }

    const enrolled = await this.coursesRepository.hasActiveEnrollment(userId, project.courseId);
    if (!enrolled) {
      throw new ForbiddenException('You must be enrolled in this project\'s course to submit.');
    }

    const latest = await this.projectsRepository.findLatestAttempt(projectId, userId);
    const attemptNumber = latest ? latest.attemptNumber + 1 : 1;

    const submission = await this.projectsRepository.createSubmission({
      project: { connect: { id: projectId } },
      user: { connect: { id: userId } },
      content: dto.content,
      ...(dto.fileId ? { file: { connect: { id: dto.fileId } } } : {}),
      attemptNumber,
      status: 'submitted',
    });

    await this.auditLogService.record({
      actorUserId: userId,
      action: 'project_submission.created',
      targetType: 'ProjectSubmission',
      targetId: submission.id,
    });
    return submission;
  }

  /** docs/16-API-CONTRACT.md GET /projects/submissions/me */
  listMine(userId: string, cursor: string | undefined, limit: number): Promise<PaginatedResult<unknown>> {
    return this.projectsRepository.findMySubmissions(userId, cursor, limit) as Promise<
      PaginatedResult<unknown>
    >;
  }

  /**
   * docs/16-API-CONTRACT.md GET /courses/:courseId/projects/submissions —
   * owning instructor, content_editor/admin, or moderator (read-only,
   * never a grading right — same narrow allowance as canViewAsModerator
   * elsewhere in this codebase).
   */
  async listSubmissionsForCourse(
    courseId: string,
    actorId: string,
    actorRoles: string[],
    query: ListSubmissionsQueryDto,
  ) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    const canView =
      isOwnerOrRole(course.instructorId, actorId, actorRoles, EDITORIAL_ROLES) ||
      canViewAsModerator(actorRoles);
    if (!canView) {
      throw new ForbiddenException('Not authorized to view this course\'s submissions.');
    }

    return this.projectsRepository.findForCourse(
      courseId,
      { projectId: query.projectId, status: query.status },
      query.cursor,
      query.limit,
    );
  }

  /**
   * docs/16-API-CONTRACT.md GET /projects/submissions/:id — submitting
   * learner, the parent course's owning instructor, content_editor/admin,
   * or moderator (read-only).
   */
  async getSubmissionById(id: string, actorId: string, actorRoles: string[]) {
    const submission = await this.projectsRepository.findSubmissionById(id);
    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }
    const course = await this.coursesRepository.findById(submission.project.courseId);
    const canView =
      submission.userId === actorId ||
      (course !== null && isOwnerOrRole(course.instructorId, actorId, actorRoles, EDITORIAL_ROLES)) ||
      canViewAsModerator(actorRoles);
    if (!canView) {
      throw new ForbiddenException('Not authorized to view this submission.');
    }
    return submission;
  }

  /**
   * docs/16-API-CONTRACT.md POST /projects/submissions/:id/evaluate —
   * grading is conceptually an edit action on course-owned content
   * (same reasoning as Courses' PATCH), so it uses the ownership-OR-
   * editorial pattern rather than a standalone permission key.
   */
  async evaluateSubmission(
    submissionId: string,
    evaluatorId: string,
    evaluatorRoles: string[],
    dto: EvaluateSubmissionDto,
  ) {
    const submission = await this.projectsRepository.findSubmissionById(submissionId);
    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    const course = await this.coursesRepository.findById(submission.project.courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    // Phase 42 audit fix: authorization must be checked before any
    // business-state check (like "already evaluated") that would
    // otherwise let an unauthorized caller learn a submission's
    // evaluation status via 409-vs-403 response codes.
    assertOwnerOrRole(course.instructorId, evaluatorId, evaluatorRoles, EDITORIAL_ROLES);

    if (submission.evaluation) {
      throw new ConflictException(
        'This submission already has an evaluation. Ask the learner to resubmit for a new attempt instead.',
      );
    }

    const evaluation = await this.projectsRepository.createEvaluation(submissionId, {
      evaluator: { connect: { id: evaluatorId } },
      scorePercent: dto.scorePercent,
      passed: dto.passed,
      feedback: dto.feedback,
      method: 'manual',
      status: 'completed',
    });

    await this.auditLogService.record({
      actorUserId: evaluatorId,
      action: 'project_submission.evaluated',
      targetType: 'ProjectEvaluation',
      targetId: evaluation.id,
      afterState: { scorePercent: dto.scorePercent, passed: dto.passed },
    });
    return evaluation;
  }
}
