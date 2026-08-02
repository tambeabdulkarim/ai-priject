import { CertificatesService } from './certificates.service';

describe('CertificatesService.issueForEnrollment', () => {
  const makeService = () => {
    const certificatesRepository = {
      findByEnrollmentId: jest.fn(),
      create: jest.fn(),
      findQuizIdsForCourse: jest.fn(),
      hasPassingAttempt: jest.fn(),
    };
    const filesRepository = {};
    const storageService = {};
    const auditLogService = { record: jest.fn() };
    const notificationsService = { create: jest.fn() };
    const coursesRepository = { findById: jest.fn().mockResolvedValue({ title: 'Test Course' }) };

    const service = new CertificatesService(
      certificatesRepository as never,
      filesRepository as never,
      storageService as never,
      auditLogService as never,
      notificationsService as never,
      coursesRepository as never,
    );
    return { service, certificatesRepository, auditLogService, notificationsService };
  };

  const enrollment = { id: 'e1', userId: 'u1', courseId: 'c1' } as never;

  it('returns the existing certificate without re-checking quizzes if already issued', async () => {
    const { service, certificatesRepository } = makeService();
    certificatesRepository.findByEnrollmentId.mockResolvedValue({ id: 'cert1' });

    const result = await service.issueForEnrollment(enrollment);

    expect(result).toEqual({ id: 'cert1' });
    expect(certificatesRepository.findQuizIdsForCourse).not.toHaveBeenCalled();
  });

  it('does not issue a certificate when a course quiz has no passing attempt', async () => {
    const { service, certificatesRepository, auditLogService } = makeService();
    certificatesRepository.findByEnrollmentId.mockResolvedValue(null);
    certificatesRepository.findQuizIdsForCourse.mockResolvedValue([{ id: 'quiz1' }]);
    certificatesRepository.hasPassingAttempt.mockResolvedValue(false);

    const result = await service.issueForEnrollment(enrollment);

    expect(result).toBeNull();
    expect(certificatesRepository.create).not.toHaveBeenCalled();
    expect(auditLogService.record).not.toHaveBeenCalled();
  });

  it('issues a certificate when the course has no quizzes at all', async () => {
    const { service, certificatesRepository, auditLogService, notificationsService } = makeService();
    certificatesRepository.findByEnrollmentId.mockResolvedValue(null);
    certificatesRepository.findQuizIdsForCourse.mockResolvedValue([]);
    certificatesRepository.create.mockResolvedValue({ id: 'cert2' });

    const result = await service.issueForEnrollment(enrollment);

    expect(result).toEqual({ id: 'cert2' });
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'certificate.issued', targetId: 'cert2' }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'certificate.issued' }),
    );
  });

  it('issues a certificate once every course quiz has a passing attempt', async () => {
    const { service, certificatesRepository } = makeService();
    certificatesRepository.findByEnrollmentId.mockResolvedValue(null);
    certificatesRepository.findQuizIdsForCourse.mockResolvedValue([{ id: 'quiz1' }, { id: 'quiz2' }]);
    certificatesRepository.hasPassingAttempt.mockResolvedValue(true);
    certificatesRepository.create.mockResolvedValue({ id: 'cert3' });

    const result = await service.issueForEnrollment(enrollment);

    expect(result).toEqual({ id: 'cert3' });
    expect(certificatesRepository.hasPassingAttempt).toHaveBeenCalledWith('u1', 'quiz1');
    expect(certificatesRepository.hasPassingAttempt).toHaveBeenCalledWith('u1', 'quiz2');
  });
});
