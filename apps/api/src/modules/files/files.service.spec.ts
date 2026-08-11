import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';
import * as magicBytes from '../../common/utils/magic-bytes';

describe('FilesService.getById', () => {
  const emptyContext = {
    isAvatar: false,
    lessonContexts: [] as {
      lessonId: string;
      isPreview: boolean;
      courseId: string;
      instructorId: string;
    }[],
    libraryItem: null as { id: string; priceCents: number | null } | null,
    product: null as { id: string; ownerId: string | null } | null,
    certificate: null as { id: string; userId: string } | null,
  };

  const makeService = () => {
    const filesRepository = {
      findFileById: jest.fn(),
      findEntitlementContext: jest.fn().mockResolvedValue(emptyContext),
      hasActiveEnrollment: jest.fn().mockResolvedValue(false),
      hasLibraryDownloadRecord: jest.fn().mockResolvedValue(false),
      hasPaidOrderForProduct: jest.fn().mockResolvedValue(false),
    };
    const storageService = {
      createPresignedDownloadUrl: jest.fn().mockResolvedValue('https://cdn.test/signed'),
    };
    const redisService = {};
    const mediaService = { createFromFile: jest.fn() };

    const service = new FilesService(
      filesRepository as never,
      storageService as never,
      redisService as never,
      mediaService as never,
    );
    return { service, filesRepository, storageService };
  };

  const cleanFile = { id: 'f1', uploadedById: 'owner1', scanStatus: 'clean', storageKey: 'k1' };

  it('throws 404 for a nonexistent file', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(null);

    await expect(service.getById('f1', 'u1', [])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 (not a distinct signal) for a soft-deleted file, even for its own owner', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue({ ...cleanFile, deletedAt: new Date() });

    await expect(service.getById('f1', 'owner1', [])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows the uploader without consulting entitlement context at all', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);

    const result = await service.getById('f1', 'owner1', []);

    expect(result.signedUrl).toBe('https://cdn.test/signed');
    expect(filesRepository.findEntitlementContext).not.toHaveBeenCalled();
  });

  it('rejects a stranger when the file has no recognized attachment', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue(emptyContext);

    await expect(service.getById('f1', 'stranger', [])).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows anyone for an avatar file', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({ ...emptyContext, isAvatar: true });

    const result = await service.getById('f1', 'random-viewer', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
  });

  it('allows a preview-lesson attachment without enrollment', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      lessonContexts: [{ lessonId: 'l1', isPreview: true, courseId: 'c1', instructorId: 'inst1' }],
    });

    const result = await service.getById('f1', 'random-viewer', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
    expect(filesRepository.hasActiveEnrollment).not.toHaveBeenCalled();
  });

  it('requires active enrollment for a non-preview lesson attachment', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      lessonContexts: [{ lessonId: 'l1', isPreview: false, courseId: 'c1', instructorId: 'inst1' }],
    });
    filesRepository.hasActiveEnrollment.mockResolvedValue(false);

    await expect(service.getById('f1', 'stranger', [])).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an enrolled learner for a non-preview lesson attachment', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      lessonContexts: [{ lessonId: 'l1', isPreview: false, courseId: 'c1', instructorId: 'inst1' }],
    });
    filesRepository.hasActiveEnrollment.mockResolvedValue(true);

    const result = await service.getById('f1', 'learner1', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
  });

  it('allows a free library item without a download record', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      libraryItem: { id: 'li1', priceCents: 0 },
    });

    const result = await service.getById('f1', 'random-viewer', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
  });

  it('rejects a paid library item with no prior download record', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      libraryItem: { id: 'li1', priceCents: 999 },
    });
    filesRepository.hasLibraryDownloadRecord.mockResolvedValue(false);

    await expect(service.getById('f1', 'stranger', [])).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a paid library item with a prior download record', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      libraryItem: { id: 'li1', priceCents: 999 },
    });
    filesRepository.hasLibraryDownloadRecord.mockResolvedValue(true);

    const result = await service.getById('f1', 'buyer1', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
  });

  it('allows the product owner without a purchase', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      product: { id: 'p1', ownerId: 'vendor1' },
    });

    const result = await service.getById('f1', 'vendor1', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
    expect(filesRepository.hasPaidOrderForProduct).not.toHaveBeenCalled();
  });

  it('rejects a non-purchaser, non-owner for a product file', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      product: { id: 'p1', ownerId: 'vendor1' },
    });
    filesRepository.hasPaidOrderForProduct.mockResolvedValue(false);

    await expect(service.getById('f1', 'stranger', [])).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a purchaser for a product file', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      product: { id: 'p1', ownerId: 'vendor1' },
    });
    filesRepository.hasPaidOrderForProduct.mockResolvedValue(true);

    const result = await service.getById('f1', 'buyer1', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
  });

  it('allows only the certificate owner for a certificate PDF', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      certificate: { id: 'cert1', userId: 'grad1' },
    });

    await expect(service.getById('f1', 'stranger', [])).rejects.toBeInstanceOf(ForbiddenException);
    const result = await service.getById('f1', 'grad1', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
  });

  it('an owning instructor bypasses the enrollment check for a non-preview lesson', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      lessonContexts: [{ lessonId: 'l1', isPreview: false, courseId: 'c1', instructorId: 'inst1' }],
    });

    const result = await service.getById('f1', 'inst1', []);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
    expect(filesRepository.hasActiveEnrollment).not.toHaveBeenCalled();
  });

  it('an editorial role bypasses the enrollment check for a non-preview lesson', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(cleanFile);
    filesRepository.findEntitlementContext.mockResolvedValue({
      ...emptyContext,
      lessonContexts: [{ lessonId: 'l1', isPreview: false, courseId: 'c1', instructorId: 'inst1' }],
    });

    const result = await service.getById('f1', 'editor1', ['content_editor']);
    expect(result.signedUrl).toBe('https://cdn.test/signed');
  });
});

describe('FilesService.completeUpload', () => {
  const makeService = () => {
    const filesRepository = {
      findUploadById: jest.fn(),
      updateUpload: jest.fn(),
      createFile: jest.fn(),
    };
    const storageService = { readObjectPrefix: jest.fn() };
    const redisService = { get: jest.fn(), del: jest.fn() };
    const mediaService = { createFromFile: jest.fn() };

    const service = new FilesService(
      filesRepository as never,
      storageService as never,
      redisService as never,
      mediaService as never,
    );
    return { service, filesRepository, storageService, redisService, mediaService };
  };

  const pendingUpload = { id: 'u1', userId: 'owner1', status: 'pending', expectedSizeBytes: 1024n };
  const createdFile = { id: 'f1', uploadedById: 'owner1', mimeType: 'video/mp4' };

  beforeEach(() => {
    jest.spyOn(magicBytes, 'detectMimeTypeFromMagicBytes').mockReturnValue('video/mp4');
  });

  afterEach(() => jest.restoreAllMocks());

  it('throws 404 for a nonexistent upload', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findUploadById.mockResolvedValue(null);

    await expect(service.completeUpload('u1', 'owner1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 403 for a non-owner', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findUploadById.mockResolvedValue(pendingUpload);

    await expect(service.completeUpload('u1', 'stranger')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('calls MediaService.createFromFile with the created File and includes the result in the response', async () => {
    const { service, filesRepository, storageService, redisService, mediaService } = makeService();
    filesRepository.findUploadById.mockResolvedValue(pendingUpload);
    redisService.get.mockResolvedValue(
      JSON.stringify({ filename: 'clip.mp4', contentType: 'video/mp4' }),
    );
    storageService.readObjectPrefix.mockResolvedValue(Buffer.from([0, 1, 2, 3]));
    filesRepository.createFile.mockResolvedValue(createdFile);
    mediaService.createFromFile.mockResolvedValue({ id: 'm1', fileId: 'f1', mediaType: 'video' });

    const result = await service.completeUpload('u1', 'owner1');

    expect(mediaService.createFromFile).toHaveBeenCalledWith(createdFile);
    expect(result.media).toEqual({ id: 'm1', fileId: 'f1', mediaType: 'video' });
    expect(result.id).toBe('f1');
  });

  it('returns media: null for a file type MediaService decides is not transcodable, without failing', async () => {
    const { service, filesRepository, storageService, redisService, mediaService } = makeService();
    filesRepository.findUploadById.mockResolvedValue(pendingUpload);
    redisService.get.mockResolvedValue(
      JSON.stringify({ filename: 'doc.pdf', contentType: 'application/pdf' }),
    );
    storageService.readObjectPrefix.mockResolvedValue(Buffer.from([0, 1, 2, 3]));
    filesRepository.createFile.mockResolvedValue({ ...createdFile, mimeType: 'application/pdf' });
    mediaService.createFromFile.mockResolvedValue(null);

    const result = await service.completeUpload('u1', 'owner1');

    expect(result.media).toBeNull();
  });

  it('does not fail the upload response when MediaService.createFromFile throws — logs instead (no silent failure, no user-facing failure)', async () => {
    const { service, filesRepository, storageService, redisService, mediaService } = makeService();
    filesRepository.findUploadById.mockResolvedValue(pendingUpload);
    redisService.get.mockResolvedValue(
      JSON.stringify({ filename: 'clip.mp4', contentType: 'video/mp4' }),
    );
    storageService.readObjectPrefix.mockResolvedValue(Buffer.from([0, 1, 2, 3]));
    filesRepository.createFile.mockResolvedValue(createdFile);
    mediaService.createFromFile.mockRejectedValue(new Error('db unavailable'));

    const loggerSpy = jest.spyOn(
      (service as unknown as { logger: { error: jest.Mock } }).logger,
      'error',
    );

    const result = await service.completeUpload('u1', 'owner1');

    expect(result.id).toBe('f1');
    expect(result.media).toBeNull();
    expect(loggerSpy).toHaveBeenCalled();
  });
});

describe('FilesService.deleteFile', () => {
  const makeService = () => {
    const filesRepository = { findFileById: jest.fn(), updateFile: jest.fn() };
    const service = new FilesService(
      filesRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );
    return { service, filesRepository };
  };

  it('throws 404 for a nonexistent file', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(null);

    await expect(service.deleteFile('f1', 'u1', [])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 for an already-deleted file', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue({
      id: 'f1',
      uploadedById: 'owner1',
      deletedAt: new Date(),
    });

    await expect(service.deleteFile('f1', 'owner1', [])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 403 for a non-owner without an admin-capable role', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue({
      id: 'f1',
      uploadedById: 'owner1',
      deletedAt: null,
    });

    await expect(service.deleteFile('f1', 'stranger', ['learner'])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(filesRepository.updateFile).not.toHaveBeenCalled();
  });

  it('allows the owner and sets deletedAt', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue({
      id: 'f1',
      uploadedById: 'owner1',
      deletedAt: null,
    });

    await service.deleteFile('f1', 'owner1', []);

    expect(filesRepository.updateFile).toHaveBeenCalledWith('f1', { deletedAt: expect.any(Date) });
  });

  it('allows an admin-capable role to delete a file they do not own', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue({
      id: 'f1',
      uploadedById: 'owner1',
      deletedAt: null,
    });

    await service.deleteFile('f1', 'admin1', ['admin']);

    expect(filesRepository.updateFile).toHaveBeenCalledWith('f1', { deletedAt: expect.any(Date) });
  });
});
