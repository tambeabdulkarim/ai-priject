import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const makeService = () => {
    const mediaRepository = {
      findById: jest.fn(),
      findByFileId: jest.fn(),
      findLessonsWithCourseByMediaId: jest.fn(),
      update: jest.fn(),
      createForFile: jest.fn(),
      findManyForOwner: jest.fn(),
    };
    const lessonsRepository = { hasActiveEnrollment: jest.fn() };
    const storageService = {
      createPresignedDownloadUrl: jest.fn().mockResolvedValue('https://cdn.test/manifest.m3u8'),
    };
    const auditLogService = { record: jest.fn() };

    const service = new MediaService(
      mediaRepository as never,
      lessonsRepository as never,
      storageService as never,
      auditLogService as never,
    );
    return { service, mediaRepository, lessonsRepository, storageService, auditLogService };
  };

  describe('getById', () => {
    it('throws 404 when the media has no parent lesson at all', async () => {
      const { service, mediaRepository } = makeService();
      mediaRepository.findById.mockResolvedValue({ id: 'm1', transcodingStatus: 'ready' });
      mediaRepository.findLessonsWithCourseByMediaId.mockResolvedValue([]);

      await expect(service.getById('m1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('grants access via a preview lesson without requiring enrollment', async () => {
      const { service, mediaRepository, lessonsRepository } = makeService();
      mediaRepository.findById.mockResolvedValue({
        id: 'm1',
        transcodingStatus: 'ready',
        hlsManifestKey: 'media/m1.m3u8',
      });
      mediaRepository.findLessonsWithCourseByMediaId.mockResolvedValue([
        { isPreview: true, module: { course: { id: 'c1', instructorId: 'owner1' } } },
      ]);

      const result = await service.getById('m1', 'random-viewer');

      expect(result.manifestUrl).toBe('https://cdn.test/manifest.m3u8');
      expect(lessonsRepository.hasActiveEnrollment).not.toHaveBeenCalled();
    });

    it('grants access to the owning instructor without an enrollment', async () => {
      const { service, mediaRepository } = makeService();
      mediaRepository.findById.mockResolvedValue({
        id: 'm1',
        transcodingStatus: 'ready',
        hlsManifestKey: null,
      });
      mediaRepository.findLessonsWithCourseByMediaId.mockResolvedValue([
        { isPreview: false, module: { course: { id: 'c1', instructorId: 'owner1' } } },
      ]);

      const result = await service.getById('m1', 'owner1');

      expect(result.transcodingStatus).toBe('ready');
    });

    it('rejects a non-owner without an active enrollment', async () => {
      const { service, mediaRepository, lessonsRepository } = makeService();
      mediaRepository.findById.mockResolvedValue({ id: 'm1', transcodingStatus: 'ready' });
      mediaRepository.findLessonsWithCourseByMediaId.mockResolvedValue([
        { isPreview: false, module: { course: { id: 'c1', instructorId: 'owner1' } } },
      ]);
      lessonsRepository.hasActiveEnrollment.mockResolvedValue(false);

      await expect(service.getById('m1', 'stranger')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws 425 while transcoding is not ready, even for an entitled viewer', async () => {
      const { service, mediaRepository, lessonsRepository } = makeService();
      mediaRepository.findById.mockResolvedValue({ id: 'm1', transcodingStatus: 'processing' });
      mediaRepository.findLessonsWithCourseByMediaId.mockResolvedValue([
        { isPreview: false, module: { course: { id: 'c1', instructorId: 'owner1' } } },
      ]);
      lessonsRepository.hasActiveEnrollment.mockResolvedValue(true);

      let caught: HttpException | undefined;
      try {
        await service.getById('m1', 'enrolled-user');
      } catch (error) {
        caught = error as HttpException;
      }
      expect(caught?.getStatus()).toBe(425);
    });
  });

  describe('createFromFile', () => {
    const videoFile = { id: 'f1', uploadedById: 'u1', mimeType: 'video/mp4' };

    it('returns null for a mime type that does not need Media (e.g. a document) without touching the repository', async () => {
      const { service, mediaRepository } = makeService();

      const result = await service.createFromFile({
        id: 'f1',
        uploadedById: 'u1',
        mimeType: 'application/pdf',
      } as never);

      expect(result).toBeNull();
      expect(mediaRepository.findByFileId).not.toHaveBeenCalled();
      expect(mediaRepository.createForFile).not.toHaveBeenCalled();
    });

    it('creates a Media row for a transcodable mime type and records the audit log', async () => {
      const { service, mediaRepository, auditLogService } = makeService();
      mediaRepository.findByFileId.mockResolvedValue(null);
      mediaRepository.createForFile.mockResolvedValue({
        id: 'm1',
        fileId: 'f1',
        mediaType: 'video',
        transcodingStatus: 'pending',
      });

      const result = await service.createFromFile(videoFile as never);

      expect(mediaRepository.createForFile).toHaveBeenCalledWith({
        file: { connect: { id: 'f1' } },
        mediaType: 'video',
      });
      expect(result).toEqual({
        id: 'm1',
        fileId: 'f1',
        mediaType: 'video',
        transcodingStatus: 'pending',
      });
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'media.created', actorUserId: 'u1', targetId: 'm1' }),
      );
    });

    it('is idempotent: returns the existing Media row instead of creating a duplicate', async () => {
      const { service, mediaRepository, auditLogService } = makeService();
      mediaRepository.findByFileId.mockResolvedValue({
        id: 'existing-m1',
        fileId: 'f1',
        mediaType: 'video',
      });

      const result = await service.createFromFile(videoFile as never);

      expect(mediaRepository.createForFile).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'existing-m1', fileId: 'f1', mediaType: 'video' });
    });

    it.each(['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg'])(
      'treats %s as transcodable',
      async (mimeType) => {
        const { service, mediaRepository } = makeService();
        mediaRepository.findByFileId.mockResolvedValue(null);
        mediaRepository.createForFile.mockResolvedValue({ id: 'm1', fileId: 'f1' });

        await service.createFromFile({ id: 'f1', uploadedById: 'u1', mimeType } as never);

        expect(mediaRepository.createForFile).toHaveBeenCalled();
      },
    );
  });

  describe('listMine', () => {
    it('maps repository rows into flat list items, converting sizeBytes to a string', async () => {
      const { service, mediaRepository } = makeService();
      mediaRepository.findManyForOwner.mockResolvedValue({
        items: [
          {
            id: 'm1',
            fileId: 'f1',
            mediaType: 'video',
            transcodingStatus: 'pending',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            file: {
              originalFilename: 'clip.mp4',
              mimeType: 'video/mp4',
              sizeBytes: 1024n,
              visibility: 'private',
              deletedAt: null,
            },
          },
        ],
        nextCursor: null,
      });

      const result = await service.listMine('u1', { cursor: undefined, limit: 20 } as never);

      expect(mediaRepository.findManyForOwner).toHaveBeenCalledWith({
        ownerId: 'u1',
        cursor: undefined,
        limit: 20,
        mediaType: undefined,
        search: undefined,
      });
      expect(result.items).toEqual([
        {
          id: 'm1',
          fileId: 'f1',
          mediaType: 'video',
          transcodingStatus: 'pending',
          originalFilename: 'clip.mp4',
          mimeType: 'video/mp4',
          sizeBytes: '1024',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('passes mediaType and q through as mediaType/search filters', async () => {
      const { service, mediaRepository } = makeService();
      mediaRepository.findManyForOwner.mockResolvedValue({ items: [], nextCursor: null });

      await service.listMine('u1', {
        cursor: 'c1',
        limit: 10,
        mediaType: 'image',
        q: 'logo',
      } as never);

      expect(mediaRepository.findManyForOwner).toHaveBeenCalledWith({
        ownerId: 'u1',
        cursor: 'c1',
        limit: 10,
        mediaType: 'image',
        search: 'logo',
      });
    });
  });

  describe('reprocess', () => {
    it('throws 404 for nonexistent media', async () => {
      const { service, mediaRepository } = makeService();
      mediaRepository.findById.mockResolvedValue(null);

      await expect(service.reprocess('m1', 'admin1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resets transcoding_status to pending and records the mandatory audit log', async () => {
      const { service, mediaRepository, auditLogService } = makeService();
      mediaRepository.findById.mockResolvedValue({ id: 'm1', transcodingStatus: 'ready' });
      mediaRepository.update.mockResolvedValue({ id: 'm1', transcodingStatus: 'pending' });

      const result = await service.reprocess('m1', 'admin1');

      expect(result.transcodingStatus).toBe('pending');
      expect(mediaRepository.update).toHaveBeenCalledWith('m1', { transcodingStatus: 'pending' });
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'media.reprocess_requested', targetId: 'm1' }),
      );
    });
  });
});
