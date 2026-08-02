// docs/16-API-CONTRACT.md §13 (Files). docs/10-SECURITY-BIBLE.md §14/§15.

import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { File } from '@prisma/client';
import { RedisService } from '../../redis/redis.service';
import { StorageService } from '../../storage/storage.service';
import { detectMimeTypeFromMagicBytes } from '../../common/utils/magic-bytes';
import { isOwnerOrEditorial } from '../../common/utils/authorization';
import { SessionsService } from '../sessions/sessions.service';
import { FilesRepository } from './files.repository';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';

// docs/10-SECURITY-BIBLE.md §14: "tiered per role and content type" — exact
// figures aren't specified anywhere in the approved docs. Conservative
// operational defaults, same pattern as SessionsService's concurrent-
// session limits; revisit once product defines real tiers.
const UPLOAD_SIZE_LIMIT_BYTES = {
  adminCapable: 500 * 1024 * 1024,
  learner: 100 * 1024 * 1024,
} as const;

const UPLOAD_METADATA_TTL_SECONDS = 15 * 60;
const uploadMetadataKey = (uploadId: string): string => `upload_meta:${uploadId}`;

@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
  ) {}

  /** docs/16-API-CONTRACT.md POST /files/upload-url */
  async requestUploadUrl(
    userId: string,
    roleNames: string[],
    dto: RequestUploadUrlDto,
  ): Promise<{ uploadUrl: string; uploadId: string }> {
    const limit = SessionsService.isAdminCapable(roleNames)
      ? UPLOAD_SIZE_LIMIT_BYTES.adminCapable
      : UPLOAD_SIZE_LIMIT_BYTES.learner;
    if (dto.sizeBytes > limit) {
      throw new ForbiddenException(`File exceeds the ${limit} byte upload quota for your role.`);
    }

    const upload = await this.filesRepository.createUpload({
      user: { connect: { id: userId } },
      expectedSizeBytes: BigInt(dto.sizeBytes),
      status: 'pending',
    });

    // docs/13-DATABASE-BLUEPRINT.md Upload has no filename/content-type
    // column (by design — only Files, the finalized record, carries that
    // metadata). The claimed filename is held transiently in Redis until
    // the upload is completed, matching the presigned URL's own lifetime.
    await this.redisService.set(
      uploadMetadataKey(upload.id),
      JSON.stringify({ filename: dto.filename, contentType: dto.contentType }),
      UPLOAD_METADATA_TTL_SECONDS,
    );

    const storageKey = `uploads/${upload.id}`;
    const uploadUrl = await this.storageService.createPresignedUploadUrl(
      storageKey,
      dto.contentType,
    );

    return { uploadUrl, uploadId: upload.id };
  }

  /** docs/16-API-CONTRACT.md POST /files/:uploadId/complete */
  async completeUpload(uploadId: string, userId: string): Promise<File> {
    const upload = await this.filesRepository.findUploadById(uploadId);
    if (!upload) {
      throw new NotFoundException('Upload not found.');
    }
    if (upload.userId !== userId) {
      throw new ForbiddenException('Not the owner of this upload.');
    }
    if (upload.status !== 'pending') {
      throw new BadRequestException(`Upload is already ${upload.status}.`);
    }

    const metadataRaw = await this.redisService.get(uploadMetadataKey(uploadId));
    if (!metadataRaw) {
      await this.filesRepository.updateUpload(uploadId, { status: 'expired' });
      throw new BadRequestException('Upload session expired — request a new upload URL.');
    }
    const metadata = JSON.parse(metadataRaw) as { filename: string; contentType: string };

    const storageKey = `uploads/${uploadId}`;
    // docs/10-SECURITY-BIBLE.md §14: content inspection, never trusting the
    // client-supplied MIME type.
    const prefix = await this.storageService.readObjectPrefix(storageKey);
    const detectedMimeType = prefix ? detectMimeTypeFromMagicBytes(prefix) : null;

    if (!detectedMimeType) {
      await this.filesRepository.updateUpload(uploadId, { status: 'failed' });
      throw new BadRequestException('Uploaded content does not match an allowed file type.');
    }

    const file = await this.filesRepository.createFile({
      uploadedBy: { connect: { id: userId } },
      storageKey,
      originalFilename: metadata.filename,
      mimeType: detectedMimeType,
      sizeBytes: upload.expectedSizeBytes,
      // docs/10-SECURITY-BIBLE.md §15: pending until the async malware scan
      // completes. No scanning engine is integrated in this pass (no
      // ClamAV/hosted-equivalent infra exists yet) — status intentionally
      // stays "pending" rather than being falsely marked "clean".
      scanStatus: 'pending',
      visibility: 'private',
    });

    await this.filesRepository.updateUpload(uploadId, {
      status: 'completed',
      file: { connect: { id: file.id } },
    });
    await this.redisService.del(uploadMetadataKey(uploadId));

    return file;
  }

  /**
   * docs/16-API-CONTRACT.md GET /files/:id — "Resource owner or entitled
   * consumer of the content the file is attached to."
   *
   * Production readiness fix: this previously had NO entitlement check at
   * all beyond scan status — any authenticated user could fetch a signed
   * URL for any clean file by UUID, despite a comment here claiming
   * owner-only and per-content delegation were enforced. Resolved per
   * content type using only existing, documented Prisma relations
   * (`FilesRepository.findEntitlementContext` — see its own comment for
   * why this lives here rather than importing Certificates/Library/
   * Products' modules, which would be circular):
   *   - Uploader: always allowed (unchanged intent, now actually enforced).
   *   - Avatar (User/Author.avatarFileId): always allowed — docs/16 §3
   *     `GET /profiles/:userId` serves `avatar_url` with no auth at all,
   *     so avatars are documented-public.
   *   - Lesson attachment (LessonFile) or lesson video (Media): identical
   *     rule to `GET /lessons/:id` / `GET /media/:id` — preview lesson,
   *     or owning instructor/editorial role, or active enrollment.
   *   - Library item: identical rule to `POST /library/items/:id/access`
   *     (`LibraryService.assertEntitled`) — free items open, paid items
   *     require an existing Downloads record (the same documented,
   *     BLOCKED-BY-DOCUMENTATION-constrained rule already in
   *     library.service.ts; not re-litigated or loosened here).
   *   - Product: an existing paid `Order_Items`/`Orders` row for this
   *     user and product, or the product's own `ownerId` (the same
   *     "owner always allowed" rule applied everywhere else in this
   *     codebase) — Product→OrderItem is a real, direct relation, not the
   *     unresolvable Product↔Course/LibraryItem gap documented elsewhere.
   *   - Certificate PDF: identical rule to `GET /certificates/:id`
   *     (`certificate.userId === viewer`, owner-only, no privileged-role
   *     bypass — matching that endpoint's actual current behavior).
   *   - Anything else (Upload/Version-only, or no recognized attachment):
   *     denied for non-owners — there is no documented entitlement path
   *     to allow through, and guessing one is exactly what this pass is
   *     told not to do.
   */
  async getById(id: string, viewerId: string, viewerRoles: string[]): Promise<{ file: File; signedUrl: string }> {
    const file = await this.filesRepository.findFileById(id);
    if (!file) {
      throw new NotFoundException('File not found.');
    }

    if (file.uploadedById !== viewerId) {
      const context = await this.filesRepository.findEntitlementContext(id);
      const entitled = await this.isEntitled(context, viewerId, viewerRoles);
      if (!entitled) {
        throw new ForbiddenException('Not authorized to access this file.');
      }
    }

    if (file.scanStatus === 'quarantined') {
      throw new ForbiddenException('This file has been quarantined.');
    }
    if (file.scanStatus !== 'clean') {
      throw new HttpException('File is still being scanned.', 425);
    }
    const signedUrl = await this.storageService.createPresignedDownloadUrl(file.storageKey);
    return { file, signedUrl };
  }

  private async isEntitled(
    context: Awaited<ReturnType<FilesRepository['findEntitlementContext']>>,
    viewerId: string,
    viewerRoles: string[],
  ): Promise<boolean> {
    if (context.isAvatar) {
      return true;
    }

    for (const lesson of context.lessonContexts) {
      if (lesson.isPreview) return true;
      if (isOwnerOrEditorial(lesson.instructorId, viewerId, viewerRoles)) return true;
      if (await this.filesRepository.hasActiveEnrollment(viewerId, lesson.courseId)) return true;
    }

    if (context.libraryItem) {
      const isFree = context.libraryItem.priceCents === null || context.libraryItem.priceCents === 0;
      if (isFree) return true;
      if (await this.filesRepository.hasLibraryDownloadRecord(viewerId, context.libraryItem.id)) return true;
    }

    if (context.product) {
      if (context.product.ownerId === viewerId) return true;
      if (await this.filesRepository.hasPaidOrderForProduct(viewerId, context.product.id)) return true;
    }

    if (context.certificate) {
      if (context.certificate.userId === viewerId) return true;
    }

    return false;
  }
}
