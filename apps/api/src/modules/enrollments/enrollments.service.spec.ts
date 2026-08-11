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
      findOrderIdForOrderItem: jest.fn(),
    };
    const coursesRepository = { findById: jest.fn() };
    const auditLogService = { record: jest.fn() };
    const notificationsService = { create: jest.fn() };
    const paymentsService = { refund: jest.fn() };
    const paymentsRepository = { findSucceededByOrderId: jest.fn() };

    const service = new EnrollmentsService(
      enrollmentsRepository as never,
      coursesRepository as never,
      auditLogService as never,
      notificationsService as never,
      paymentsService as never,
      paymentsRepository as never,
    );
    return {
      service,
      enrollmentsRepository,
      coursesRepository,
      auditLogService,
      notificationsService,
      paymentsService,
      paymentsRepository,
    };
  };

  it('rejects a paid course with 400', async () => {
    const { service, coursesRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({
      id: 'c1',
      status: 'published',
      priceCents: 5000,
    });

    await expect(service.enroll('u1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 409 with the existing enrollment when already enrolled', async () => {
    const { service, coursesRepository, enrollmentsRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({
      id: 'c1',
      status: 'published',
      priceCents: 0,
      title: 'Test Course',
    });
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
    const {
      service,
      coursesRepository,
      enrollmentsRepository,
      auditLogService,
      notificationsService,
    } = makeService();
    coursesRepository.findById.mockResolvedValue({
      id: 'c1',
      status: 'published',
      priceCents: 0,
      title: 'Test Course',
    });
    enrollmentsRepository.findByUserAndCourse.mockResolvedValue(null);
    enrollmentsRepository.create.mockResolvedValue({
      id: 'e1',
      userId: 'u1',
      courseId: 'c1',
      status: 'active',
    });

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

describe('EnrollmentsService.refund', () => {
  const makeService = () => {
    const enrollmentsRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      findOrderIdForOrderItem: jest.fn(),
    };
    const coursesRepository = { findById: jest.fn() };
    const auditLogService = { record: jest.fn() };
    const notificationsService = { create: jest.fn() };
    const paymentsService = { refund: jest.fn() };
    const paymentsRepository = { findSucceededByOrderId: jest.fn() };

    const service = new EnrollmentsService(
      enrollmentsRepository as never,
      coursesRepository as never,
      auditLogService as never,
      notificationsService as never,
      paymentsService as never,
      paymentsRepository as never,
    );
    return { service, enrollmentsRepository, auditLogService, paymentsService, paymentsRepository };
  };

  it('rejects an enrollment with no linked purchase', async () => {
    const { service, enrollmentsRepository } = makeService();
    enrollmentsRepository.findById.mockResolvedValue({
      id: 'e1',
      status: 'active',
      orderItemId: null,
    });

    await expect(service.refund('e1', 'requested by learner', 'admin1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects refunding an already-refunded enrollment', async () => {
    const { service, enrollmentsRepository } = makeService();
    enrollmentsRepository.findById.mockResolvedValue({
      id: 'e1',
      status: 'refunded',
      orderItemId: 'oi1',
    });

    await expect(service.refund('e1', 'requested by learner', 'admin1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects when no successful payment can be resolved for the linked order', async () => {
    const { service, enrollmentsRepository, paymentsRepository } = makeService();
    enrollmentsRepository.findById.mockResolvedValue({
      id: 'e1',
      status: 'active',
      orderItemId: 'oi1',
    });
    enrollmentsRepository.findOrderIdForOrderItem.mockResolvedValue('order1');
    paymentsRepository.findSucceededByOrderId.mockResolvedValue(null);

    await expect(service.refund('e1', 'requested by learner', 'admin1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('triggers the real Payment refund before marking the enrollment refunded', async () => {
    const { service, enrollmentsRepository, paymentsService, paymentsRepository, auditLogService } =
      makeService();
    enrollmentsRepository.findById.mockResolvedValue({
      id: 'e1',
      status: 'active',
      orderItemId: 'oi1',
    });
    enrollmentsRepository.findOrderIdForOrderItem.mockResolvedValue('order1');
    paymentsRepository.findSucceededByOrderId.mockResolvedValue({ id: 'pay1' });
    enrollmentsRepository.update.mockResolvedValue({ id: 'e1', status: 'refunded' });

    const result = await service.refund('e1', 'requested by learner', 'admin1');

    expect(paymentsService.refund).toHaveBeenCalledWith(
      'pay1',
      undefined,
      'requested by learner',
      'admin1',
    );
    expect(enrollmentsRepository.update).toHaveBeenCalledWith('e1', { status: 'refunded' });
    expect(result.status).toBe('refunded');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'enrollment.refunded', targetId: 'e1' }),
    );
  });

  it('does not mark the enrollment refunded if the underlying payment refund fails', async () => {
    const { service, enrollmentsRepository, paymentsService, paymentsRepository } = makeService();
    enrollmentsRepository.findById.mockResolvedValue({
      id: 'e1',
      status: 'active',
      orderItemId: 'oi1',
    });
    enrollmentsRepository.findOrderIdForOrderItem.mockResolvedValue('order1');
    paymentsRepository.findSucceededByOrderId.mockResolvedValue({ id: 'pay1' });
    paymentsService.refund.mockRejectedValue(new ConflictException('already refunded'));

    await expect(service.refund('e1', 'requested by learner', 'admin1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(enrollmentsRepository.update).not.toHaveBeenCalled();
  });
});
