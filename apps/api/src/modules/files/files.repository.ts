// Data-access layer for Files/Uploads/Media (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { File, Media, Prisma, Upload } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createUpload(data: Prisma.UploadCreateInput): Promise<Upload> {
    return this.prisma.upload.create({ data });
  }

  findUploadById(id: string): Promise<Upload | null> {
    return this.prisma.upload.findUnique({ where: { id } });
  }

  updateUpload(id: string, data: Prisma.UploadUpdateInput): Promise<Upload> {
    return this.prisma.upload.update({ where: { id }, data });
  }

  createFile(data: Prisma.FileCreateInput): Promise<File> {
    return this.prisma.file.create({ data });
  }

  findFileById(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({ where: { id } });
  }

  updateFile(id: string, data: Prisma.FileUpdateInput): Promise<File> {
    return this.prisma.file.update({ where: { id }, data });
  }

  findMediaByFileId(fileId: string): Promise<Media | null> {
    return this.prisma.media.findUnique({ where: { fileId } });
  }

  findMediaById(id: string): Promise<Media | null> {
    return this.prisma.media.findUnique({ where: { id } });
  }

  updateMedia(id: string, data: Prisma.MediaUpdateInput): Promise<Media> {
    return this.prisma.media.update({ where: { id }, data });
  }

  /**
   * docs/16-API-CONTRACT.md GET /files/:id: "Resource owner or entitled
   * consumer of the content the file is attached to." Resolves every
   * documented way a File can be attached to owning content, using only
   * existing Prisma relations (File→User/Author avatar, File→LessonFile→
   * Lesson, File→Media→Lesson, File→LibraryItem, File→Product,
   * File→Certificate — all already declared on the `File` model in
   * schema.prisma). Implemented here (not by importing
   * Certificates/Library/Products' own modules) because those modules
   * already import FilesModule — importing them back would be a circular
   * module dependency. Same self-contained-repository-query pattern
   * already used elsewhere in this codebase to avoid that (e.g.
   * CoursesRepository.hasActiveEnrollment).
   */
  async findEntitlementContext(fileId: string): Promise<{
    isAvatar: boolean;
    lessonContexts: { lessonId: string; isPreview: boolean; courseId: string; instructorId: string }[];
    libraryItem: { id: string; priceCents: number | null } | null;
    product: { id: string; ownerId: string | null } | null;
    certificate: { id: string; userId: string } | null;
  }> {
    const lessonSelect = {
      id: true,
      isPreview: true,
      module: { select: { course: { select: { id: true, instructorId: true } } } },
    } as const;

    const [avatarUser, avatarAuthor, lessonFiles, media, libraryItem, product, certificate] = await Promise.all([
      this.prisma.user.findFirst({ where: { avatarFileId: fileId }, select: { id: true } }),
      this.prisma.author.findFirst({ where: { avatarFileId: fileId }, select: { id: true } }),
      this.prisma.lessonFile.findMany({ where: { fileId }, select: { lesson: { select: lessonSelect } } }),
      this.prisma.media.findUnique({ where: { fileId }, select: { lessons: { select: lessonSelect } } }),
      this.prisma.libraryItem.findFirst({ where: { fileId }, select: { id: true, priceCents: true } }),
      this.prisma.product.findFirst({ where: { fileId }, select: { id: true, ownerId: true } }),
      this.prisma.certificate.findFirst({ where: { pdfFileId: fileId }, select: { id: true, userId: true } }),
    ]);

    const rawLessons = [...lessonFiles.map((lf) => lf.lesson), ...(media?.lessons ?? [])];
    const lessonContexts = rawLessons.map((l) => ({
      lessonId: l.id,
      isPreview: l.isPreview,
      courseId: l.module.course.id,
      instructorId: l.module.course.instructorId,
    }));

    return {
      isAvatar: avatarUser !== null || avatarAuthor !== null,
      lessonContexts,
      libraryItem,
      product,
      certificate,
    };
  }

  /** Mirrors LessonsRepository.hasActiveEnrollment / CoursesRepository.hasActiveEnrollment — same trivial query, kept local to avoid a circular module import. */
  hasActiveEnrollment(userId: string, courseId: string): Promise<boolean> {
    return this.prisma.enrollment
      .findFirst({ where: { userId, courseId, status: 'active' } })
      .then((e) => e !== null);
  }

  /** Mirrors LibraryRepository.findAnyDownloadRecord's exact entitlement-continuity rule (see library.service.ts assertEntitled). */
  hasLibraryDownloadRecord(userId: string, libraryItemId: string): Promise<boolean> {
    return this.prisma.download
      .findFirst({ where: { userId, libraryItemId } })
      .then((d) => d !== null);
  }

  /**
   * docs/13-DATABASE-BLUEPRINT.md Order_Items/Orders/Products: a real,
   * existing relation (Product ← OrderItem → Order.userId/status) — not
   * the same unresolvable Product↔Course/LibraryItem gap documented
   * elsewhere (Entitlement Architecture Report); Product→OrderItem is
   * directly declared on the Product model.
   */
  hasPaidOrderForProduct(userId: string, productId: string): Promise<boolean> {
    return this.prisma.orderItem
      .findFirst({ where: { productId, order: { userId, status: 'paid' } } })
      .then((oi) => oi !== null);
  }
}
