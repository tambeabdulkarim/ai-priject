import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const makeService = () => {
    const mediaRepository = {
      findById: jest.fn(),
      findLessonsWithCourseByMediaId: jest.fn(),
      update: jest.fn(),
    };
    const lessonsRepository = { hasActiveEnrollment: jest.fn() };
    const storageService = { createPresignedDownloadUrl: jest.fn().mockResolvedValue('https://cdn.test/manifest.m3u8') };
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
      mediaRepository.findById.mockResolvedValue({ id: 'm1', transcodingStatus: 'ready', hlsManifestKey: null });
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
