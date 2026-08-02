import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';

describe('FilesService.getById', () => {
  const emptyContext = {
    isAvatar: false,
    lessonContexts: [] as { lessonId: string; isPreview: boolean; courseId: string; instructorId: string }[],
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
    const storageService = { createPresignedDownloadUrl: jest.fn().mockResolvedValue('https://cdn.test/signed') };
    const redisService = {};

    const service = new FilesService(
      filesRepository as never,
      storageService as never,
      redisService as never,
    );
    return { service, filesRepository, storageService };
  };

  const cleanFile = { id: 'f1', uploadedById: 'owner1', scanStatus: 'clean', storageKey: 'k1' };

  it('throws 404 for a nonexistent file', async () => {
    const { service, filesRepository } = makeService();
    filesRepository.findFileById.mockResolvedValue(null);

    await expect(service.getById('f1', 'u1', [])).rejects.toBeInstanceOf(NotFoundException);
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
