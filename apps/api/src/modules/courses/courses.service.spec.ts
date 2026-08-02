import { ConflictException, ForbiddenException } from '@nestjs/common';
import { CoursesService } from './courses.service';

describe('CoursesService status machine', () => {
  const makeService = () => {
    const coursesRepository = {
      findMany: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
      findByIdWithModules: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
    };
    const categoriesService = { findById: jest.fn() };
    const auditLogService = { record: jest.fn() };

    const service = new CoursesService(
      coursesRepository as never,
      categoriesService as never,
      auditLogService as never,
    );
    return { service, coursesRepository, auditLogService };
  };

  it('rejects submit-for-review from a non-owner', async () => {
    const { service, coursesRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner', status: 'draft' });

    await expect(service.submitForReview('c1', 'someone-else')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects submit-for-review with no modules/lessons', async () => {
    const { service, coursesRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner', status: 'draft' });
    coursesRepository.findByIdWithModules.mockResolvedValue({ modules: [] });

    await expect(service.submitForReview('c1', 'owner')).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows submit-for-review when a module has at least one lesson', async () => {
    const { service, coursesRepository, auditLogService } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner', status: 'draft' });
    coursesRepository.findByIdWithModules.mockResolvedValue({
      modules: [{ lessons: [{ id: 'l1' }] }],
    });

    const result = await service.submitForReview('c1', 'owner');

    expect(result.status).toBe('in_review');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'course.submitted_for_review' }),
    );
  });

  it('rejects publish unless the course is in_review', async () => {
    const { service, coursesRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', status: 'draft' });

    await expect(service.publish('c1', 'admin1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('publishes a course that is in_review', async () => {
    const { service, coursesRepository, auditLogService } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', status: 'in_review' });

    const result = await service.publish('c1', 'admin1');

    expect(result.status).toBe('published');
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'course.published' }),
    );
  });
});
