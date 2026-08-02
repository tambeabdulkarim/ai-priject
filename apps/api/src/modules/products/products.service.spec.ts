import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const makeService = () => {
    const productsRepository = {
      findMany: jest.fn(),
      findPublishedBySlug: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const categoriesService = { findById: jest.fn() };
    const filesRepository = { findFileById: jest.fn() };
    const auditLogService = { record: jest.fn() };

    const service = new ProductsService(
      productsRepository as never,
      categoriesService as never,
      filesRepository as never,
      auditLogService as never,
    );
    return { service, productsRepository, categoriesService, filesRepository, auditLogService };
  };

  it('rejects creating a product with a file that is not scan-clean', async () => {
    const { service, categoriesService, filesRepository } = makeService();
    categoriesService.findById.mockResolvedValue({ id: 'cat1' });
    filesRepository.findFileById.mockResolvedValue({ id: 'f1', scanStatus: 'pending' });

    await expect(
      service.create('admin1', { title: 'Template', categoryId: 'cat1', fileId: 'f1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects creating a product with a nonexistent file', async () => {
    const { service, categoriesService, filesRepository } = makeService();
    categoriesService.findById.mockResolvedValue({ id: 'cat1' });
    filesRepository.findFileById.mockResolvedValue(null);

    await expect(
      service.create('admin1', { title: 'Template', categoryId: 'cat1', fileId: 'f1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a product as draft with a clean file and audit-logs it', async () => {
    const { service, categoriesService, filesRepository, productsRepository, auditLogService } =
      makeService();
    categoriesService.findById.mockResolvedValue({ id: 'cat1' });
    filesRepository.findFileById.mockResolvedValue({ id: 'f1', scanStatus: 'clean' });
    productsRepository.findBySlug.mockResolvedValue(null);
    productsRepository.create.mockResolvedValue({ id: 'p1', status: 'draft', slug: 'template' });

    const result = await service.create('admin1', { title: 'Template', categoryId: 'cat1', fileId: 'f1' });

    expect(result.status).toBe('draft');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'product.created' }),
    );
  });

  it('rejects updating a product owned by someone else without an admin role', async () => {
    const { service, productsRepository } = makeService();
    productsRepository.findById.mockResolvedValue({ id: 'p1', ownerId: 'owner1' });

    await expect(
      service.update('p1', { title: 'New title' }, 'someone-else', ['learner']),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an admin to update a product they do not own', async () => {
    const { service, productsRepository } = makeService();
    productsRepository.findById.mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'draft', priceCents: 0 });
    productsRepository.update.mockResolvedValue({ id: 'p1', title: 'New title', status: 'draft', priceCents: 0 });

    const result = await service.update('p1', { title: 'New title' }, 'admin1', ['admin']);

    expect(result.title).toBe('New title');
  });
});
