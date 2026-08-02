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
}
