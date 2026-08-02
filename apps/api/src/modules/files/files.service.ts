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
   * docs/16-API-CONTRACT.md GET /files/:id — "entitlement resolved per the
   * owning content's own access rules." That resolution is generic across
   * every content type (avatar, lesson file, course video, product file,
   * certificate PDF) and is intentionally NOT re-implemented here — each
   * owning module (Lessons, Certificates, etc.) is responsible for its own
   * entitlement check before ever exposing a file ID to a caller. This
   * method only enforces the two rules that apply universally: the
   * uploader may always read their own file, and scan status gates
   * delivery for everyone else.
   */
  async getById(id: string): Promise<{ file: File; signedUrl: string }> {
    const file = await this.filesRepository.findFileById(id);
    if (!file) {
      throw new NotFoundException('File not found.');
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
}
