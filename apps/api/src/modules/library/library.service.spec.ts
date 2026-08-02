import { ConflictException, HttpException, NotFoundException } from '@nestjs/common';
import { LibraryService } from './library.service';

describe('LibraryService', () => {
  const makeService = () => {
    const libraryRepository = {
      findMany: jest.fn(),
      findPublishedBySlug: jest.fn(),
      findById: jest.fn(),
      createDownload: jest.fn(),
      findBookmark: jest.fn(),
      createBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      findReadingProgress: jest.fn(),
      upsertReadingProgress: jest.fn(),
      findAnyDownloadRecord: jest.fn(),
    };
    const filesRepository = { findFileById: jest.fn() };
    const storageService = { createPresignedDownloadUrl: jest.fn().mockResolvedValue('https://cdn.test/signed') };

    const service = new LibraryService(
      libraryRepository as never,
      filesRepository as never,
      storageService as never,
    );
    return { service, libraryRepository, filesRepository, storageService };
  };

  describe('grantAccess', () => {
    it('grants access to a free item without any purchase check', async () => {
      const { service, libraryRepository, filesRepository } = makeService();
      libraryRepository.findById.mockResolvedValue({ id: 'i1', status: 'published', priceCents: 0, fileId: 'f1' });
      filesRepository.findFileById.mockResolvedValue({ id: 'f1', scanStatus: 'clean', storageKey: 'key1' });

      const result = await service.grantAccess('i1', 'u1');

      expect(result.downloadUrl).toBe('https://cdn.test/signed');
      expect(libraryRepository.createDownload).toHaveBeenCalled();
    });

    it('rejects a paid item with no prior Downloads record with 402 (BLOCKED entitlement path)', async () => {
      const { service, libraryRepository } = makeService();
      libraryRepository.findById.mockResolvedValue({ id: 'i1', status: 'published', priceCents: 999, fileId: 'f1' });
      libraryRepository.findAnyDownloadRecord.mockResolvedValue(null);

      let caught: HttpException | undefined;
      try {
        await service.grantAccess('i1', 'u1');
      } catch (error) {
        caught = error as HttpException;
      }

      expect(caught).toBeInstanceOf(HttpException);
      expect(caught?.getStatus()).toBe(402);
    });

    it('grants a paid item access when a prior Downloads record already exists', async () => {
      const { service, libraryRepository, filesRepository } = makeService();
      libraryRepository.findById.mockResolvedValue({ id: 'i1', status: 'published', priceCents: 999, fileId: 'f1' });
      libraryRepository.findAnyDownloadRecord.mockResolvedValue({ id: 'd1' });
      filesRepository.findFileById.mockResolvedValue({ id: 'f1', scanStatus: 'clean', storageKey: 'key1' });

      const result = await service.grantAccess('i1', 'u1');

      expect(result.downloadUrl).toBe('https://cdn.test/signed');
    });

    it('rejects access to an unpublished item with 404', async () => {
      const { service, libraryRepository } = makeService();
      libraryRepository.findById.mockResolvedValue({ id: 'i1', status: 'draft', priceCents: 0, fileId: 'f1' });

      await expect(service.grantAccess('i1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('bookmark', () => {
    it('creates a new bookmark', async () => {
      const { service, libraryRepository } = makeService();
      libraryRepository.findById.mockResolvedValue({ id: 'i1' });
      libraryRepository.findBookmark.mockResolvedValue(null);
      libraryRepository.createBookmark.mockResolvedValue({ id: 'b1', userId: 'u1', libraryItemId: 'i1' });

      const result = await service.bookmark('i1', 'u1');

      expect(result.id).toBe('b1');
    });

    it('returns 409 with the existing bookmark when already bookmarked (idempotent per doc16)', async () => {
      const { service, libraryRepository } = makeService();
      libraryRepository.findById.mockResolvedValue({ id: 'i1' });
      const existing = { id: 'b1', userId: 'u1', libraryItemId: 'i1' };
      libraryRepository.findBookmark.mockResolvedValue(existing);

      let caught: ConflictException | undefined;
      try {
        await service.bookmark('i1', 'u1');
      } catch (error) {
        caught = error as ConflictException;
      }

      expect(caught).toBeInstanceOf(ConflictException);
      expect((caught?.getResponse() as { details: unknown }).details).toEqual(existing);
    });
  });

  describe('removeBookmark', () => {
    it('throws 404 when no bookmark exists', async () => {
      const { service, libraryRepository } = makeService();
      libraryRepository.findBookmark.mockResolvedValue(null);

      await expect(service.removeBookmark('i1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes an existing bookmark', async () => {
      const { service, libraryRepository } = makeService();
      libraryRepository.findBookmark.mockResolvedValue({ id: 'b1' });

      await service.removeBookmark('i1', 'u1');

      expect(libraryRepository.deleteBookmark).toHaveBeenCalledWith('b1');
    });
  });

  describe('updateProgress', () => {
    it('rejects updating progress on a paid item with no entitlement', async () => {
      const { service, libraryRepository } = makeService();
      libraryRepository.findById.mockResolvedValue({ id: 'i1', status: 'published', priceCents: 500 });
      libraryRepository.findAnyDownloadRecord.mockResolvedValue(null);

      let caught: HttpException | undefined;
      try {
        await service.updateProgress('i1', 'u1', 'page-5');
      } catch (error) {
        caught = error as HttpException;
      }
      expect(caught?.getStatus()).toBe(402);
    });

    it('updates progress on a free item', async () => {
      const { service, libraryRepository } = makeService();
      libraryRepository.findById.mockResolvedValue({ id: 'i1', status: 'published', priceCents: null });
      libraryRepository.upsertReadingProgress.mockResolvedValue({ id: 'rp1', lastPosition: 'page-5' });

      const result = await service.updateProgress('i1', 'u1', 'page-5');

      expect(result.lastPosition).toBe('page-5');
    });
  });
});
