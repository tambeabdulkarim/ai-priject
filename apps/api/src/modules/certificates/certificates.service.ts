// docs/16-API-CONTRACT.md §8 (Certificates). docs/15-SYSTEM-WORKFLOWS.md §11.
//
// PDF rendering is out of scope for this pass — docs/09-PLATFORM-ARCHITECTURE.md
// §11 calls for a server-side-rendered PDF stored in object storage
// (`pdf_file_id`), but no PDF-rendering library/service exists anywhere in
// this codebase yet. Certificates are issued with `pdfFileId: null`; the
// record, its verification lookup, and its eventual PDF attachment (via
// FilesService, once a renderer exists) are three separable concerns —
// only the third is deferred here, and it isn't part of the entitlement
// gap under review.

import { randomUUID } from 'crypto';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Certificate, Enrollment, Prisma } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { StorageService } from '../../storage/storage.service';
import { FilesRepository } from '../files/files.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesRepository } from '../courses/courses.repository';
import { CertificatesRepository } from './certificates.repository';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly certificatesRepository: CertificatesRepository,
    private readonly filesRepository: FilesRepository,
    private readonly storageService: StorageService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
    private readonly coursesRepository: CoursesRepository,
  ) {}

  /**
   * docs/15-SYSTEM-WORKFLOWS.md §11 — called by ProgressService on 100%
   * course completion.
   *
   * Production readiness fix pass: re-validates passing quiz scores
   * server-side before issuing, per docs15 §11 ("passing quiz scores
   * where required... re-validated server-side at generation time, not
   * assumed from client-reported progress alone"). `PUT
   * /progress/lessons/:lessonId` lets a caller mark ANY lesson —
   * including a quiz-type one — complete via a client-supplied
   * `progressPercent`, with no cross-check against `QuizAttempt`
   * (`progress.repository.ts` `upsertProgressAndRecomputeCompletion`).
   * That completion-percent calculation itself is unchanged here — fixing
   * it would mean redesigning how "100% complete" is computed platform-
   * wide, out of scope for this pass. This method only adds the one gate
   * docs15 §11 actually asks for: a course whose quiz(zes) haven't been
   * genuinely passed does not get a certificate, even if
   * `Enrollment.completionPercent` says 100. Resolved using only existing
   * relationships (Quiz.lessonId → Lesson → Module → Course,
   * QuizAttempt.userId/quizId/passed) — nothing invented.
   */
  async issueForEnrollment(enrollment: Enrollment): Promise<Certificate | null> {
    const existing = await this.certificatesRepository.findByEnrollmentId(enrollment.id);
    if (existing) {
      return existing;
    }

    const quizzes = await this.certificatesRepository.findQuizIdsForCourse(enrollment.courseId);
    for (const quiz of quizzes) {
      const passed = await this.certificatesRepository.hasPassingAttempt(
        enrollment.userId,
        quiz.id,
      );
      if (!passed) {
        // Not audit-logged, not an error: this is an expected, frequent
        // state (completion percent reached 100% via non-quiz lessons,
        // or a quiz attempt was failed) — the certificate simply isn't
        // issued yet. It will be (re-)attempted on the next progress
        // write that reaches 100%, per the existing call site in
        // ProgressService.updateLessonProgress.
        return null;
      }
    }

    let certificate: Certificate;
    try {
      certificate = await this.certificatesRepository.create({
        user: { connect: { id: enrollment.userId } },
        course: { connect: { id: enrollment.courseId } },
        enrollment: { connect: { id: enrollment.id } },
        certificateNumber: this.generateCertificateNumber(),
      });
    } catch (error) {
      // Fixed during the Phase 13 final audit: two concurrent progress
      // updates both reaching 100% for the same enrollment could both pass
      // the findByEnrollmentId check above before either commits. The
      // unique constraint on Certificate.enrollmentId is the real
      // idempotency guard; this makes the loser return the winner's
      // already-created certificate instead of an unhandled 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const alreadyIssued = await this.certificatesRepository.findByEnrollmentId(enrollment.id);
        if (alreadyIssued) {
          return alreadyIssued;
        }
      }
      throw error;
    }

    // docs/15-SYSTEM-WORKFLOWS.md §11: "Certificate issuance... is
    // audit-logged given its role as a durable credential."
    await this.auditLogService.record({
      actorUserId: enrollment.userId,
      action: 'certificate.issued',
      targetType: 'Certificate',
      targetId: certificate.id,
    });

    // docs/15-SYSTEM-WORKFLOWS.md §11: "'Certificate earned' notification
    // (in-app + email)" — email delivery is BLOCKED (no provider configured).
    const course = await this.coursesRepository.findById(enrollment.courseId);
    await this.notificationsService.create({
      userId: enrollment.userId,
      type: 'certificate.issued',
      title: 'Certificate earned',
      body: course
        ? `Your certificate for "${course.title}" is ready.`
        : 'Your certificate is ready.',
      sourceEventId: certificate.id,
    });

    return certificate;
  }

  private generateCertificateNumber(): string {
    return `CERT-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }

  /** docs/16-API-CONTRACT.md GET /certificates/me */
  listMine(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<PaginatedResult<Certificate>> {
    return this.certificatesRepository.findManyForUser({ userId, cursor, limit });
  }

  /** docs/16-API-CONTRACT.md GET /certificates/:id */
  async getById(
    id: string,
    viewerId: string,
  ): Promise<{ certificate: Certificate; pdfUrl: string | null }> {
    const certificate = await this.certificatesRepository.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate not found.');
    }
    if (certificate.userId !== viewerId) {
      throw new ForbiddenException('Not authorized to view this certificate.');
    }

    if (!certificate.pdfFileId) {
      return { certificate, pdfUrl: null };
    }
    const file = await this.filesRepository.findFileById(certificate.pdfFileId);
    const pdfUrl = file
      ? await this.storageService.createPresignedDownloadUrl(file.storageKey)
      : null;
    return { certificate, pdfUrl };
  }

  /**
   * docs/16-API-CONTRACT.md GET /certificates/verify/:certificateNumber —
   * public, data-minimized per docs/13-DATABASE-BLUEPRINT.md Certificates
   * Security Notes ("no other user data").
   */
  async verifyPublic(certificateNumber: string) {
    const certificate =
      await this.certificatesRepository.findByCertificateNumber(certificateNumber);
    if (!certificate || certificate.revokedAt) {
      throw new NotFoundException('Certificate not found or invalid.');
    }
    return {
      valid: true,
      holderDisplayName: certificate.user.displayName,
      courseTitle: certificate.course.title,
      issuedAt: certificate.issuedAt,
    };
  }
}
