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
import { Certificate, Enrollment } from '@prisma/client';
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

  /** docs/15-SYSTEM-WORKFLOWS.md §11 — called by ProgressService on 100% course completion. */
  async issueForEnrollment(enrollment: Enrollment): Promise<Certificate | null> {
    const existing = await this.certificatesRepository.findByEnrollmentId(enrollment.id);
    if (existing) {
      return existing;
    }

    const certificate = await this.certificatesRepository.create({
      user: { connect: { id: enrollment.userId } },
      course: { connect: { id: enrollment.courseId } },
      enrollment: { connect: { id: enrollment.id } },
      certificateNumber: this.generateCertificateNumber(),
    });

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
      body: course ? `Your certificate for "${course.title}" is ready.` : 'Your certificate is ready.',
      sourceEventId: certificate.id,
    });

    return certificate;
  }

  private generateCertificateNumber(): string {
    return `CERT-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }

  /** docs/16-API-CONTRACT.md GET /certificates/me */
  listMine(userId: string, cursor: string | undefined, limit: number): Promise<PaginatedResult<Certificate>> {
    return this.certificatesRepository.findManyForUser({ userId, cursor, limit });
  }

  /** docs/16-API-CONTRACT.md GET /certificates/:id */
  async getById(id: string, viewerId: string): Promise<{ certificate: Certificate; pdfUrl: string | null }> {
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
    const pdfUrl = file ? await this.storageService.createPresignedDownloadUrl(file.storageKey) : null;
    return { certificate, pdfUrl };
  }

  /**
   * docs/16-API-CONTRACT.md GET /certificates/verify/:certificateNumber —
   * public, data-minimized per docs/13-DATABASE-BLUEPRINT.md Certificates
   * Security Notes ("no other user data").
   */
  async verifyPublic(certificateNumber: string) {
    const certificate = await this.certificatesRepository.findByCertificateNumber(certificateNumber);
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
