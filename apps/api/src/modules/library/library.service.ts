// docs/16-API-CONTRACT.md §9 (Library). docs/15-SYSTEM-WORKFLOWS.md §12
// (Library Access).
//
// BLOCKED BY DOCUMENTATION — paid-item entitlement: per the Entitlement
// Architecture Report, `Product` has no relation to `LibraryItem` (same
// gap as Course), and the approved docs contradict each other on how one
// would be derived. docs/15-SYSTEM-WORKFLOWS.md §12 says a paid item's
// entitlement check confirms "a completed purchase (Order_Items/Payments)
// or an existing Downloads/access record." Without the missing relation,
// a first-time purchase can never be verified — so a paid item with no
// prior Downloads row for this user always, correctly, falls through to
// the documented 402 "purchase required" response. This is not an
// invented workaround: it is the accurate behavior given the
// unresolvable relation, using only the documented error code for
// exactly the condition it exists for. Once a Downloads row exists for a
// user+item (e.g. if entitlement is ever granted through some future,
// resolved path), repeat access continues to work via that existing
// record, per the same doc15 sentence.
//
// Watermarking ("signed, short-lived, watermarked delivery URL") is also
// out of scope here — no watermarking/content-processing service exists
// anywhere in this codebase (same category as PDF rendering in
// Certificates, docs/SESSION-HANDOFF.md). The URL is real and signed; it
// is not watermarked.

import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Bookmark, LibraryItem, ReadingProgress } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { StorageService } from '../../storage/storage.service';
import { FilesRepository } from '../files/files.repository';
import { ListLibraryItemsQueryDto } from './dto/list-library-items-query.dto';
import { LibraryRepository } from './library.repository';

@Injectable()
export class LibraryService {
  constructor(
    private readonly libraryRepository: LibraryRepository,
    private readonly filesRepository: FilesRepository,
    private readonly storageService: StorageService,
  ) {}

  /** docs/16-API-CONTRACT.md GET /library/items */
  list(query: ListLibraryItemsQueryDto): Promise<PaginatedResult<LibraryItem>> {
    return this.libraryRepository.findMany({
      cursor: query.cursor,
      limit: query.limit,
      categoryId: query.category,
      authorId: query.author,
      search: query.q,
    });
  }

  /** docs/16-API-CONTRACT.md GET /library/items/:slug */
  async getBySlug(slug: string): Promise<LibraryItem> {
    const item = await this.libraryRepository.findPublishedBySlug(slug);
    if (!item) {
      throw new NotFoundException('Library item not found.');
    }
    return item;
  }

  private async assertEntitled(item: LibraryItem, userId: string): Promise<void> {
    const isFree = item.priceCents === null || item.priceCents === 0;
    if (isFree) {
      return;
    }
    // See file header: paid-item first-time purchase can never be
    // verified (BLOCKED BY DOCUMENTATION). An existing Downloads record
    // is the only entitlement path this implementation can honor.
    const priorAccess = await this.libraryRepository.findAnyDownloadRecord(userId, item.id);
    if (!priorAccess) {
      // docs/16-API-CONTRACT.md: "402 (purchase required)"
      throw new HttpException('A completed purchase is required to access this item.', 402);
    }
  }

  private async loadPublishedItemOrThrow(id: string): Promise<LibraryItem> {
    const item = await this.libraryRepository.findById(id);
    if (!item || item.status !== 'published') {
      throw new NotFoundException('Library item not found.');
    }
    return item;
  }

  /** docs/16-API-CONTRACT.md POST /library/items/:id/access */
  async grantAccess(
    id: string,
    userId: string,
    ipAddress?: string,
  ): Promise<{ downloadUrl: string }> {
    const item = await this.loadPublishedItemOrThrow(id);
    await this.assertEntitled(item, userId);

    const file = await this.filesRepository.findFileById(item.fileId);
    if (!file || file.scanStatus !== 'clean') {
      throw new NotFoundException('This item’s file is not currently available.');
    }

    const downloadUrl = await this.storageService.createPresignedDownloadUrl(file.storageKey);

    // docs/13-DATABASE-BLUEPRINT.md Downloads: recorded per access event —
    // also the only entitlement-continuity record for paid items (see
    // assertEntitled above).
    await this.libraryRepository.createDownload({
      user: { connect: { id: userId } },
      libraryItem: { connect: { id: item.id } },
      ipAddress,
    });

    return { downloadUrl };
  }

  /** docs/16-API-CONTRACT.md POST /library/items/:id/bookmark — idempotent per doc16. */
  async bookmark(id: string, userId: string): Promise<Bookmark> {
    const item = await this.libraryRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Library item not found.');
    }

    const existing = await this.libraryRepository.findBookmark(userId, id);
    if (existing) {
      // docs/16-API-CONTRACT.md: "409 (already bookmarked — idempotent success)"
      throw new ConflictException({ message: 'Already bookmarked.', details: existing });
    }

    return this.libraryRepository.createBookmark(userId, id);
  }

  /** docs/16-API-CONTRACT.md DELETE /library/items/:id/bookmark */
  async removeBookmark(id: string, userId: string): Promise<void> {
    const existing = await this.libraryRepository.findBookmark(userId, id);
    if (!existing) {
      throw new NotFoundException('Bookmark not found.');
    }
    await this.libraryRepository.deleteBookmark(existing.id);
  }

  /** docs/16-API-CONTRACT.md PUT /library/items/:id/progress */
  async updateProgress(id: string, userId: string, lastPosition: string): Promise<ReadingProgress> {
    const item = await this.loadPublishedItemOrThrow(id);
    await this.assertEntitled(item, userId);
    return this.libraryRepository.upsertReadingProgress(userId, id, lastPosition);
  }
}
