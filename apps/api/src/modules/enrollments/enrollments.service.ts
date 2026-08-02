// docs/16-API-CONTRACT.md §6 (Enrollments).
//
// ENTITLEMENT INTEGRATION SEAM (documented, not implemented — see the
// "Entitlement Architecture Report" from the prior architecture pass):
// `grantFromPurchase()` below is the boundary the future Marketplace
// payment-webhook handler (Phase 9) will call once a paid-course purchase
// has been resolved to a courseId — a resolution that is currently
// BLOCKED BY DOCUMENTATION (no Product↔Course relation exists, and the
// approved docs contradict each other on how one should be derived).
// This method itself has no blocked logic: given an already-resolved
// courseId and orderItemId, granting the entitlement is a plain
// Enrollment insert, identical in shape to the free-course path below.
// Nothing else in this file, and none of docs/16 §6's documented
// endpoints, depend on the missing relation.

import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Enrollment } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CoursesRepository } from '../courses/courses.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { EnrollmentsRepository, EnrollmentWithCourse } from './enrollments.repository';
import { ListEnrollmentsQueryDto } from './dto/list-enrollments-query.dto';

const ENTITLEMENT_READ_ROLES = ['admin', 'superadmin', 'support'];

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** docs/15-SYSTEM-WORKFLOWS.md Workflow 8: "You're enrolled" (in-app portion — email delivery is BLOCKED, no provider configured). */
  private async notifyEnrolled(enrollment: Enrollment, courseTitle: string): Promise<void> {
    await this.notificationsService.create({
      userId: enrollment.userId,
      type: 'enrollment.created',
      title: "You're enrolled",
      body: `You're now enrolled in "${courseTitle}".`,
      sourceEventId: enrollment.id,
    });
  }

  /** docs/16-API-CONTRACT.md POST /enrollments — free courses only. */
  async enroll(userId: string, courseId: string): Promise<Enrollment> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course || course.status !== 'published') {
      throw new NotFoundException('Course not found.');
    }
    if (course.priceCents > 0) {
      throw new BadRequestException('This is a paid course — purchase it to enroll.');
    }

    const existing = await this.enrollmentsRepository.findByUserAndCourse(userId, courseId);
    if (existing) {
      // docs/16-API-CONTRACT.md: "409 (already enrolled — returns existing enrollment)"
      throw new ConflictException({ message: 'Already enrolled in this course.', details: existing });
    }

    const enrollment = await this.enrollmentsRepository.create({
      user: { connect: { id: userId } },
      course: { connect: { id: courseId } },
      status: 'active',
    });

    await this.auditLogService.record({
      actorUserId: userId,
      action: 'enrollment.created',
      targetType: 'Enrollment',
      targetId: enrollment.id,
    });
    await this.notifyEnrolled(enrollment, course.title);

    return enrollment;
  }

  /**
   * The documented integration seam — see file header. Safe to call today
   * for any courseId/orderItemId pair a future caller has already resolved;
   * performs no resolution of its own.
   */
  async grantFromPurchase(params: {
    userId: string;
    courseId: string;
    orderItemId: string;
  }): Promise<Enrollment> {
    const existing = await this.enrollmentsRepository.findByUserAndCourse(params.userId, params.courseId);
    if (existing) {
      return existing;
    }

    const course = await this.coursesRepository.findById(params.courseId);
    const enrollment = await this.enrollmentsRepository.create({
      user: { connect: { id: params.userId } },
      course: { connect: { id: params.courseId } },
      orderItem: { connect: { id: params.orderItemId } },
      status: 'active',
    });

    await this.auditLogService.record({
      actorUserId: params.userId,
      action: 'enrollment.granted_from_purchase',
      targetType: 'Enrollment',
      targetId: enrollment.id,
      afterState: { orderItemId: params.orderItemId },
    });
    if (course) {
      await this.notifyEnrolled(enrollment, course.title);
    }

    return enrollment;
  }

  /** docs/16-API-CONTRACT.md GET /enrollments/me */
  listMine(userId: string, query: ListEnrollmentsQueryDto): Promise<PaginatedResult<EnrollmentWithCourse>> {
    return this.enrollmentsRepository.findManyForUser({
      userId,
      cursor: query.cursor,
      limit: query.limit,
      status: query.status,
    });
  }

  /** docs/16-API-CONTRACT.md GET /enrollments/:id — resource owner or `enrollment:read`. */
  async getById(id: string, actorId: string, actorRoles: string[]): Promise<Enrollment> {
    const enrollment = await this.enrollmentsRepository.findById(id);
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found.');
    }
    const isOwner = enrollment.userId === actorId;
    const isPrivileged = actorRoles.some((r) => ENTITLEMENT_READ_ROLES.includes(r));
    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException('Not authorized to view this enrollment.');
    }
    return enrollment;
  }

  /** docs/16-API-CONTRACT.md POST /enrollments/:id/refund — `order:refund` (admin/support). */
  async refund(id: string, reason: string, actorId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentsRepository.findById(id);
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found.');
    }
    if (enrollment.status === 'refunded') {
      throw new ConflictException('This enrollment has already been refunded.');
    }
    if (!enrollment.orderItemId) {
      throw new BadRequestException('This enrollment has no linked purchase to refund.');
    }

    const updated = await this.enrollmentsRepository.update(id, { status: 'refunded' });
    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'enrollment.refunded',
      targetType: 'Enrollment',
      targetId: id,
      afterState: { reason },
    });
    return updated;
  }
}
