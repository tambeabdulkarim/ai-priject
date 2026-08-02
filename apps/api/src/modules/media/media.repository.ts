// Data-access layer for Media (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Media, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Media | null> {
    return this.prisma.media.findUnique({ where: { id } });
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
}
