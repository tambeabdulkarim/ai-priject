import { BadRequestException, ConflictException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';

describe('EnrollmentsService.enroll', () => {
  const makeService = () => {
    const enrollmentsRepository = {
      findByUserAndCourse: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findManyForUser: jest.fn(),
    };
    const coursesRepository = { findById: jest.fn() };
    const auditLogService = { record: jest.fn() };
    const notificationsService = { create: jest.fn() };

    const service = new EnrollmentsService(
      enrollmentsRepository as never,
      coursesRepository as never,
      auditLogService as never,
      notificationsService as never,
    );
    return { service, enrollmentsRepository, coursesRepository, auditLogService, notificationsService };
  };

  it('rejects a paid course with 400', async () => {
    const { service, coursesRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', status: 'published', priceCents: 5000 });

    await expect(service.enroll('u1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 409 with the existing enrollment when already enrolled', async () => {
    const { service, coursesRepository, enrollmentsRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', status: 'published', priceCents: 0, title: 'Test Course' });
    const existing = { id: 'e1', userId: 'u1', courseId: 'c1', status: 'active' };
    enrollmentsRepository.findByUserAndCourse.mockResolvedValue(existing);

    let caught: ConflictException | undefined;
    try {
      await service.enroll('u1', 'c1');
    } catch (error) {
      caught = error as ConflictException;
    }

    expect(caught).toBeInstanceOf(ConflictException);
    expect((caught?.getResponse() as { details: unknown }).details).toEqual(existing);
    expect(enrollmentsRepository.create).not.toHaveBeenCalled();
  });

  it('creates an active enrollment for a free, published course and notifies the learner', async () => {
    const { service, coursesRepository, enrollmentsRepository, auditLogService, notificationsService } =
      makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', status: 'published', priceCents: 0, title: 'Test Course' });
    enrollmentsRepository.findByUserAndCourse.mockResolvedValue(null);
    enrollmentsRepository.create.mockResolvedValue({ id: 'e1', userId: 'u1', courseId: 'c1', status: 'active' });

    const result = await service.enroll('u1', 'c1');

    expect(result.status).toBe('active');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'enrollment.created' }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'enrollment.created' }),
    );
  });
});
