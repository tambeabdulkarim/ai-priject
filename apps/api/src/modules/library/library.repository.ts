// Data-access layer for Library_Items / Downloads / Bookmarks /
// Reading_Progress (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Bookmark, Download, LibraryItem, Prisma, ReadingProgress } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface ListLibraryItemsParams {
  cursor?: string;
  limit: number;
  categoryId?: string;
  authorId?: string;
  search?: string;
}

@Injectable()
export class LibraryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    params: ListLibraryItemsParams,
  ): Promise<{ items: LibraryItem[]; nextCursor: string | null }> {
    const where: Prisma.LibraryItemWhereInput = {
      AND: [
        { status: 'published' },
        params.categoryId ? { categoryId: params.categoryId } : {},
        params.authorId ? { authorId: params.authorId } : {},
        params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const items = await this.prisma.libraryItem.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  findPublishedBySlug(slug: string): Promise<LibraryItem | null> {
    return this.prisma.libraryItem.findFirst({ where: { slug, status: 'published' } });
  }

  findById(id: string): Promise<LibraryItem | null> {
    return this.prisma.libraryItem.findUnique({ where: { id } });
  }

  createDownload(data: Prisma.DownloadCreateInput): Promise<Download> {
    return this.prisma.download.create({ data });
  }

  findBookmark(userId: string, libraryItemId: string): Promise<Bookmark | null> {
    return this.prisma.bookmark.findUnique({
      where: { userId_libraryItemId: { userId, libraryItemId } },
    });
  }

  createBookmark(userId: string, libraryItemId: string): Promise<Bookmark> {
    return this.prisma.bookmark.create({
      data: { user: { connect: { id: userId } }, libraryItem: { connect: { id: libraryItemId } } },
    });
  }

  deleteBookmark(id: string): Promise<Bookmark> {
    return this.prisma.bookmark.delete({ where: { id } });
  }

  findReadingProgress(userId: string, libraryItemId: string): Promise<ReadingProgress | null> {
    return this.prisma.readingProgress.findUnique({
      where: { userId_libraryItemId: { userId, libraryItemId } },
    });
  }

  upsertReadingProgress(
    userId: string,
    libraryItemId: string,
    lastPosition: string,
  ): Promise<ReadingProgress> {
    return this.prisma.readingProgress.upsert({
      where: { userId_libraryItemId: { userId, libraryItemId } },
      create: {
        user: { connect: { id: userId } },
        libraryItem: { connect: { id: libraryItemId } },
        lastPosition,
      },
      update: { lastPosition },
    });
  }

  /** Entitlement check for a paid item per docs/15-SYSTEM-WORKFLOWS.md §12 — see LibraryService for the BLOCKED-purchase-path note. */
  findAnyDownloadRecord(userId: string, libraryItemId: string): Promise<Download | null> {
    return this.prisma.download.findFirst({ where: { userId, libraryItemId } });
  }
}
