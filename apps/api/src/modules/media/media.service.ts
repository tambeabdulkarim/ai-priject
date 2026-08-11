// docs/16-API-CONTRACT.md §14 (Media).

import { ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { File, Media } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { StorageService } from '../../storage/storage.service';
import { LessonsRepository } from '../lessons/lessons.repository';
import { ListMediaQueryDto } from './dto/list-media-query.dto';
import { MediaRepository } from './media.repository';

export interface MediaListItem {
  id: string;
  fileId: string;
  mediaType: string;
  transcodingStatus: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: string;
  createdAt: string;
}

/**
 * docs/media-architecture-report.md §1/§3: which of the platform's
 * already-allowed upload content types (packages/types
 * `AllowedUploadContentType`) require the Media transcoding extension.
 * Documents (`application/pdf`, `application/zip`) are deliberately
 * absent — they stay plain `File` rows, no Media needed. An allowlist,
 * not a denylist, so an unrecognized future mime type fails safe (stored
 * as a plain File, never silently mis-handled).
 */
const TRANSCODABLE_MEDIA_TYPE_BY_MIME: Record<string, 'video' | 'image' | 'audio'> = {
  'video/mp4': 'video',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'audio/mpeg': 'audio',
};

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly lessonsRepository: LessonsRepository,
    private readonly storageService: StorageService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * docs/media-architecture-report.md §1/§2/§3 (Phase 13.2) — the missing
   * link: called by FilesService.completeUpload once a File exists.
   * Creates the Media extension for File types that need transcoding
   * (video/image/audio); returns `null`, not an error, for types that
   * don't (documents) — that is a normal, expected outcome.
   *
   * Idempotent: `Media.fileId` is unique, so a retried completeUpload
   * call (e.g. a client retry after a network blip) returns the
   * already-created row instead of throwing a unique-constraint error or
   * creating a duplicate.
   *
   * Deliberately does NOT gate on `file.scanStatus === 'clean'`: no
   * malware-scanning engine exists anywhere in this codebase yet (every
   * File is created with `scanStatus: 'pending'` and nothing ever
   * transitions it — the same disclosed, pre-existing limitation
   * `LibraryService`/`ProductsService` already live with). Gating here
   * would make this method never fire in the current deployment,
   * defeating the point of this phase. Once real scanning exists, a
   * future phase should decide whether to gate creation or (more
   * consistently with how `FilesService.getById` already works) gate
   * serving instead — flagged in the architecture report's risk
   * analysis, not silently resolved here.
   */
  async createFromFile(file: File): Promise<Media | null> {
    const mediaType = TRANSCODABLE_MEDIA_TYPE_BY_MIME[file.mimeType];
    if (!mediaType) {
      return null;
    }

    const existing = await this.mediaRepository.findByFileId(file.id);
    if (existing) {
      return existing;
    }

    const media = await this.mediaRepository.createForFile({
      file: { connect: { id: file.id } },
      mediaType,
    });

    await this.auditLogService.record({
      actorUserId: file.uploadedById,
      action: 'media.created',
      targetType: 'Media',
      targetId: media.id,
    });

    return media;
  }

  /**
   * Phase 13.3 (Media Frontend) — GET /media/me. Owner-scoped list for the
   * Media Library/Picker. Returns metadata only, deliberately no signed
   * URL per item (media-architecture-report.md §6: signed URLs are
   * short-lived and cheap to mint on demand — pre-fetching one for every
   * row in a page would be wasted, unnecessary entitlement-check work).
   * A consumer that wants to preview a specific item calls the existing
   * `GET /media/:id`/`GET /files/:id` for that one item.
   */
  async listMine(
    userId: string,
    query: ListMediaQueryDto,
  ): Promise<{ items: MediaListItem[]; nextCursor: string | null }> {
    const { items, nextCursor } = await this.mediaRepository.findManyForOwner({
      ownerId: userId,
      cursor: query.cursor,
      limit: query.limit,
      mediaType: query.mediaType,
      search: query.q,
    });

    return {
      items: items.map((media) => ({
        id: media.id,
        fileId: media.fileId,
        mediaType: media.mediaType,
        transcodingStatus: media.transcodingStatus,
        originalFilename: media.file.originalFilename,
        mimeType: media.file.mimeType,
        sizeBytes: media.file.sizeBytes.toString(),
        createdAt: media.createdAt.toISOString(),
      })),
      nextCursor,
    };
  }

  /**
   * docs/16-API-CONTRACT.md GET /media/:id — "entitlement check identical
   * to the parent lesson/content's own rule" (see LessonsService.getContent,
   * whose owner-or-active-enrollment logic is reused here rather than
   * duplicated-and-diverged; the same "editorial bypass out of scope"
   * limitation documented there applies here too, for the same reason —
   * role membership isn't resolvable from the repository layer alone).
   */
  async getById(
    id: string,
    userId: string,
  ): Promise<{ transcodingStatus: string; manifestUrl: string | null }> {
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
      const enrolled = await this.lessonsRepository.hasActiveEnrollment(
        userId,
        lesson.module.course.id,
      );
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
