import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { LearningPathsService } from './learning-paths.service';

describe('LearningPathsService', () => {
  const makeService = () => {
    const learningPathsRepository = {
      findMany: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'lp1', ...data })),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      replaceCourses: jest.fn(),
      countCourses: jest.fn(),
    };
    const coursesRepository = { findById: jest.fn() };
    const auditLogService = { record: jest.fn() };

    const service = new LearningPathsService(
      learningPathsRepository as never,
      coursesRepository as never,
      auditLogService as never,
    );
    return { service, learningPathsRepository, coursesRepository, auditLogService };
  };

  it('creates a learning path in draft status with a generated slug', async () => {
    const { service, learningPathsRepository, auditLogService } = makeService();
    learningPathsRepository.findBySlug.mockResolvedValue(null);

    const result = await service.create('actor1', { title: 'AI Engineer', description: 'x' });

    expect(result.status).toBe('draft');
    expect(result.slug).toBe('ai-engineer');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'learning_path.created' }),
    );
  });

  it('rejects publish with zero courses', async () => {
    const { service, learningPathsRepository } = makeService();
    learningPathsRepository.findById.mockResolvedValue({ id: 'lp1', status: 'draft' });
    learningPathsRepository.countCourses.mockResolvedValue(0);

    await expect(service.publish('lp1', 'actor1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('publishes a learning path with at least one course', async () => {
    const { service, learningPathsRepository, auditLogService } = makeService();
    learningPathsRepository.findById.mockResolvedValue({ id: 'lp1', status: 'draft' });
    learningPathsRepository.countCourses.mockResolvedValue(2);

    const result = await service.publish('lp1', 'actor1');

    expect(result.status).toBe('published');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'learning_path.published' }),
    );
  });

  it('rejects setCourses when a referenced course does not exist', async () => {
    const { service, learningPathsRepository, coursesRepository } = makeService();
    learningPathsRepository.findById.mockResolvedValue({ id: 'lp1', slug: 'p1', courses: [] });
    coursesRepository.findById.mockResolvedValue(null);

    await expect(
      service.setCourses('lp1', 'actor1', { courseIds: ['missing-course'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(learningPathsRepository.replaceCourses).not.toHaveBeenCalled();
  });

  it('replaces course membership and audit-logs the before/after course list', async () => {
    const { service, learningPathsRepository, coursesRepository, auditLogService } = makeService();
    learningPathsRepository.findById.mockResolvedValue({
      id: 'lp1',
      slug: 'p1',
      courses: [{ courseId: 'old-course' }],
    });
    coursesRepository.findById.mockResolvedValue({ id: 'c1' });
    learningPathsRepository.findBySlug.mockResolvedValue({ id: 'lp1', courses: [] });

    await service.setCourses('lp1', 'actor1', { courseIds: ['c1'] });

    expect(learningPathsRepository.replaceCourses).toHaveBeenCalledWith('lp1', ['c1']);
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'learning_path.courses_updated',
        beforeState: { courseIds: ['old-course'] },
        afterState: { courseIds: ['c1'] },
      }),
    );
  });

  it('throws NotFoundException for a missing learning path on getBySlug', async () => {
    const { service, learningPathsRepository } = makeService();
    learningPathsRepository.findBySlug.mockResolvedValue(null);

    await expect(service.getBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides a draft learning path from an unauthenticated viewer', async () => {
    const { service, learningPathsRepository } = makeService();
    learningPathsRepository.findBySlug.mockResolvedValue({ status: 'draft' });

    await expect(service.getBySlug('draft-path', undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
