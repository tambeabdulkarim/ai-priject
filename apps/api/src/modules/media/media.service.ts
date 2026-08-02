// docs/16-API-CONTRACT.md §14 (Media).

import { ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Media } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { StorageService } from '../../storage/storage.service';
import { LessonsRepository } from '../lessons/lessons.repository';
import { MediaRepository } from './media.repository';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly lessonsRepository: LessonsRepository,
    private readonly storageService: StorageService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * docs/16-API-CONTRACT.md GET /media/:id — "entitlement check identical
   * to the parent lesson/content's own rule" (see LessonsService.getContent,
   * whose owner-or-active-enrollment logic is reused here rather than
   * duplicated-and-diverged; the same "editorial bypass out of scope"
   * limitation documented there applies here too, for the same reason —
   * role membership isn't resolvable from the repository layer alone).
   */
  async getById(id: string, userId: string): Promise<{ transcodingStatus: string; manifestUrl: string | null }> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException('Media not found.');
    }

    const lessons = await this.mediaRepository.findLessonsWithCourseByMediaId(id);
    if (lessons.length === 0) {
      // No parent content references this media — "entitled consumer of
      // the parent content" cannot be resolved, so there is no lawful
      // entitlement path. Not an invented rule: the absence of a parent
      // makes the documented check unsatisfiable.
      throw new NotFoundException('Media not found.');
    }

    const isEntitled = await this.isEntitledThroughAnyLesson(lessons, userId);
    if (!isEntitled) {
      throw new ForbiddenException('Not entitled to access this media.');
    }

    if (media.transcodingStatus !== 'ready') {
      // docs/16-API-CONTRACT.md: "425 (still processing)"
      throw new HttpException('Media is still processing.', 425);
    }

    const manifestUrl = media.hlsManifestKey
      ? await this.storageService.createPresignedDownloadUrl(media.hlsManifestKey)
      : null;

    return { transcodingStatus: media.transcodingStatus, manifestUrl };
  }

  private async isEntitledThroughAnyLesson(
    lessons: Awaited<ReturnType<MediaRepository['findLessonsWithCourseByMediaId']>>,
    userId: string,
  ): Promise<boolean> {
    for (const lesson of lessons) {
      if (lesson.isPreview) {
        return true;
      }
      if (lesson.module.course.instructorId === userId) {
        return true;
      }
      const enrolled = await this.lessonsRepository.hasActiveEnrollment(userId, lesson.module.course.id);
      if (enrolled) {
        return true;
      }
    }
    return false;
  }

  /** docs/16-API-CONTRACT.md POST /admin/media/:id/reprocess — `media:reprocess` (admin). Mandatory audit log. */
  async reprocess(id: string, actorId: string): Promise<Media> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException('Media not found.');
    }

    const updated = await this.mediaRepository.update(id, { transcodingStatus: 'pending' });

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'media.reprocess_requested',
      targetType: 'Media',
      targetId: id,
    });

    return updated;
  }
}
