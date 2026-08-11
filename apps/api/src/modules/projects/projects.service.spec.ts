import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const makeService = () => {
    const projectsRepository = {
      findByCourseId: jest.fn(),
      findById: jest.fn(),
      findBySourceLessonId: jest.fn(),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'proj1', ...data })),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      findLatestAttempt: jest.fn(),
      createSubmission: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 'sub1', ...data })),
      findSubmissionById: jest.fn(),
      findMySubmissions: jest.fn(),
      findForCourse: jest.fn(),
      createEvaluation: jest
        .fn()
        .mockImplementation((submissionId, data) => Promise.resolve({ id: 'ev1', submissionId, ...data })),
    };
    const coursesRepository = { findById: jest.fn(), hasActiveEnrollment: jest.fn() };
    const auditLogService = { record: jest.fn() };

    const service = new ProjectsService(
      projectsRepository as never,
      coursesRepository as never,
      auditLogService as never,
    );
    return { service, projectsRepository, coursesRepository, auditLogService };
  };

  // --- authorization: create/publish (ownership-OR-editorial) ---

  it('rejects project creation from a non-owner, non-editorial actor', async () => {
    const { service, coursesRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner' });

    await expect(
      service.create('c1', 'random-user', ['learner'], { title: 'X' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows project creation from the owning instructor', async () => {
    const { service, coursesRepository, auditLogService } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner' });

    const result = await service.create('c1', 'owner', ['instructor'], { title: 'X' });

    expect(result.status).toBe('draft');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'project.created' }),
    );
  });

  it('allows project creation from a content_editor even without ownership', async () => {
    const { service, coursesRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner' });

    await expect(
      service.create('c1', 'editor-user', ['content_editor'], { title: 'X' }),
    ).resolves.toBeDefined();
  });

  // --- duplicate prevention: sourceLessonId already linked ---

  it('rejects linking a lesson that is already linked to another project', async () => {
    const { service, coursesRepository, projectsRepository } = makeService();
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner' });
    projectsRepository.findBySourceLessonId.mockResolvedValue({ id: 'existing-project' });

    await expect(
      service.create('c1', 'owner', ['instructor'], { title: 'X', sourceLessonId: 'lesson1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // --- submit: enrollment requirement + at-least-one-of validation ---

  it('rejects a submission with neither content nor fileId', async () => {
    const { service } = makeService();

    await expect(service.submit('proj1', 'learner1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a submission from a learner not enrolled in the course', async () => {
    const { service, projectsRepository, coursesRepository } = makeService();
    projectsRepository.findById.mockResolvedValue({ id: 'proj1', status: 'published', courseId: 'c1' });
    coursesRepository.hasActiveEnrollment.mockResolvedValue(false);

    await expect(
      service.submit('proj1', 'learner1', { content: 'my repo link' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('accepts a submission from an enrolled learner and increments attemptNumber on resubmission', async () => {
    const { service, projectsRepository, coursesRepository, auditLogService } = makeService();
    projectsRepository.findById.mockResolvedValue({ id: 'proj1', status: 'published', courseId: 'c1' });
    coursesRepository.hasActiveEnrollment.mockResolvedValue(true);
    projectsRepository.findLatestAttempt.mockResolvedValue({ attemptNumber: 2 });

    const result = await service.submit('proj1', 'learner1', { content: 'v3' });

    expect(result.attemptNumber).toBe(3);
    expect(result.status).toBe('submitted');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'project_submission.created' }),
    );
  });

  it('rejects submitting to an unpublished project', async () => {
    const { service, projectsRepository } = makeService();
    projectsRepository.findById.mockResolvedValue({ id: 'proj1', status: 'draft', courseId: 'c1' });

    await expect(
      service.submit('proj1', 'learner1', { content: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // --- evaluation: authorization + double-evaluation conflict ---

  it('rejects evaluating an already-evaluated submission', async () => {
    const { service, projectsRepository, coursesRepository } = makeService();
    projectsRepository.findSubmissionById.mockResolvedValue({
      id: 'sub1',
      evaluation: { id: 'ev1' },
      project: { courseId: 'c1' },
    });
    // Phase 42 audit fix: authorization is now checked before the
    // already-evaluated conflict check, so the course lookup must
    // resolve (and the actor must be authorized) for this test to
    // actually exercise the conflict path rather than an earlier
    // NotFoundException/ForbiddenException.
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner' });

    await expect(
      service.evaluateSubmission('sub1', 'owner', ['instructor'], {
        scorePercent: 90,
        passed: true,
        feedback: 'Great work',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an unauthorized actor from learning a submission is already evaluated (authorization checked first)', async () => {
    const { service, projectsRepository, coursesRepository } = makeService();
    projectsRepository.findSubmissionById.mockResolvedValue({
      id: 'sub1',
      evaluation: { id: 'ev1' },
      project: { courseId: 'c1' },
    });
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner' });

    await expect(
      service.evaluateSubmission('sub1', 'random-user', ['learner'], {
        scorePercent: 90,
        passed: true,
        feedback: 'Great work',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects evaluation from a non-owner, non-editorial actor', async () => {
    const { service, projectsRepository, coursesRepository } = makeService();
    projectsRepository.findSubmissionById.mockResolvedValue({
      id: 'sub1',
      evaluation: null,
      project: { courseId: 'c1' },
    });
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner' });

    await expect(
      service.evaluateSubmission('sub1', 'random-user', ['learner'], {
        scorePercent: 90,
        passed: true,
        feedback: 'Great work',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the owning instructor to evaluate and marks the submission evaluated', async () => {
    const { service, projectsRepository, coursesRepository, auditLogService } = makeService();
    projectsRepository.findSubmissionById.mockResolvedValue({
      id: 'sub1',
      evaluation: null,
      project: { courseId: 'c1' },
    });
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'owner' });

    const result = await service.evaluateSubmission('sub1', 'owner', ['instructor'], {
      scorePercent: 88,
      passed: true,
      feedback: 'Solid implementation, minor style notes.',
    });

    expect(result.method).toBe('manual');
    expect(result.status).toBe('completed');
    expect(projectsRepository.createEvaluation).toHaveBeenCalledWith(
      'sub1',
      expect.objectContaining({ scorePercent: 88, passed: true }),
    );
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'project_submission.evaluated' }),
    );
  });

  // --- read authorization: submission visibility ---

  it('allows the submitting learner to view their own submission', async () => {
    const { service, projectsRepository, coursesRepository } = makeService();
    projectsRepository.findSubmissionById.mockResolvedValue({
      id: 'sub1',
      userId: 'learner1',
      project: { courseId: 'c1' },
    });
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'someone-else' });

    await expect(
      service.getSubmissionById('sub1', 'learner1', ['learner']),
    ).resolves.toBeDefined();
  });

  it('rejects an unrelated learner from viewing someone else\'s submission', async () => {
    const { service, projectsRepository, coursesRepository } = makeService();
    projectsRepository.findSubmissionById.mockResolvedValue({
      id: 'sub1',
      userId: 'learner1',
      project: { courseId: 'c1' },
    });
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'someone-else' });

    await expect(
      service.getSubmissionById('sub1', 'other-learner', ['learner']),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a moderator read-only visibility into a submission', async () => {
    const { service, projectsRepository, coursesRepository } = makeService();
    projectsRepository.findSubmissionById.mockResolvedValue({
      id: 'sub1',
      userId: 'learner1',
      project: { courseId: 'c1' },
    });
    coursesRepository.findById.mockResolvedValue({ id: 'c1', instructorId: 'someone-else' });

    await expect(
      service.getSubmissionById('sub1', 'mod-user', ['moderator']),
    ).resolves.toBeDefined();
  });
});
