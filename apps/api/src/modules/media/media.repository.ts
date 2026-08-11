// Data-access layer for Media (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Media, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface ListMediaForOwnerParams {
  ownerId: string;
  cursor?: string;
  limit: number;
  mediaType?: string;
  search?: string;
}

export interface MediaWithFile extends Media {
  file: {
    originalFilename: string;
    mimeType: string;
    sizeBytes: bigint;
    visibility: string;
    deletedAt: Date | null;
  };
}

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Media | null> {
    return this.prisma.media.findUnique({ where: { id } });
  }

  /** `Media.fileId` is unique (schema.prisma) — a File has at most one Media row. Used to make MediaService.createFromFile idempotent. */
  findByFileId(fileId: string): Promise<Media | null> {
    return this.prisma.media.findUnique({ where: { fileId } });
  }

  /** docs/media-architecture-report.md §1/§3 — the Phase 13.2 File→Media link. `transcodingStatus`/`durationSeconds`/`hlsManifestKey` are left to their schema defaults (`pending`/`null`/`null`) — nothing has produced real transcoding output yet (out of scope, see the report's §7/§9). */
  createForFile(data: Prisma.MediaCreateInput): Promise<Media> {
    return this.prisma.media.create({ data });
  }

  /**
   * docs/16-API-CONTRACT.md GET /media/:id: "entitlement check identical
   * to the parent lesson/content's own rule" — resolves the Lesson(s)
   * this Media is attached to (via Lesson.video_media_id) so MediaService
   * can reuse the exact same entitlement logic LessonsService already
   * applies, without modifying the (locked) Lessons module.
   */
  findLessonsWithCourseByMediaId(mediaId: string) {
    return this.prisma.lesson.findMany({
      where: { videoMediaId: mediaId },
      include: { module: { include: { course: true } } },
    });
  }

  update(id: string, data: Prisma.MediaUpdateInput): Promise<Media> {
    return this.prisma.media.update({ where: { id }, data });
  }

  /**
   * Phase 13.3 (Media Frontend) — GET /media/me. Owner-scoped only (via
   * File.uploadedById — Media has no owner of its own, see
   * media-architecture-report.md §1): deliberately no "list everyone's
   * media" admin mode, since nothing in this phase needs it and inventing
   * a permission key not already documented in docs/16-API-CONTRACT.md
   * would break this codebase's established "permissions are direct
   * transcriptions of the contract, never invented" discipline
   * (prisma/seed.ts's own comment). Soft-deleted files are excluded.
   * Same cursor-pagination shape as CoursesRepository.findMany.
   */
  async findManyForOwner(
    params: ListMediaForOwnerParams,
  ): Promise<{ items: MediaWithFile[]; nextCursor: string | null }> {
    const where: Prisma.MediaWhereInput = {
      file: {
        uploadedById: params.ownerId,
        deletedAt: null,
        ...(params.search
          ? { originalFilename: { contains: params.search, mode: 'insensitive' } }
          : {}),
      },
      ...(params.mediaType ? { mediaType: params.mediaType } : {}),
    };

    const items = await this.prisma.media.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        file: {
          select: {
            originalFilename: true,
            mimeType: true,
            sizeBytes: true,
            visibility: true,
            deletedAt: true,
          },
        },
      },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return {
      items: page as MediaWithFile[],
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }
}
