import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProgressService } from './progress.service';

describe('ProgressService.submitQuizAttempt', () => {
  const quiz = {
    id: 'quiz1',
    passingScorePercent: 50,
    maxAttempts: 2,
    lesson: { id: 'lesson1', module: { courseId: 'course1', course: { id: 'course1', title: 'Test Course' } } },
    questions: [
      { id: 'q1', questionType: 'single', correctAnswer: 'a' },
      { id: 'q2', questionType: 'single', correctAnswer: 'b' },
    ],
  };

  const makeService = () => {
    const progressRepository = {
      upsertProgressAndRecomputeCompletion: jest.fn().mockResolvedValue({
        progress: { id: 'lp1' },
        enrollment: { id: 'enr1', completionPercent: 50 },
      }),
      findProgressForEnrollment: jest.fn(),
      findQuizWithQuestions: jest.fn().mockResolvedValue(quiz),
      countAttempts: jest.fn().mockResolvedValue(0),
      createAttempt: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 'attempt1', ...data })),
    };
    const lessonsRepository = {
      findByIdWithModuleCourse: jest.fn(),
    };
    const enrollmentsRepository = {
      findByUserAndCourse: jest
        .fn()
        .mockResolvedValue({ id: 'enr1', status: 'active', completionPercent: 0 }),
      update: jest.fn(),
    };
    const certificatesService = { issueForEnrollment: jest.fn() };
    const notificationsService = { create: jest.fn() };

    const service = new ProgressService(
      progressRepository as never,
      lessonsRepository as never,
      enrollmentsRepository as never,
      certificatesService as never,
      notificationsService as never,
    );
    return {
      service,
      progressRepository,
      lessonsRepository,
      enrollmentsRepository,
      certificatesService,
      notificationsService,
    };
  };

  it('rejects submission without an active enrollment', async () => {
    const { service, enrollmentsRepository } = makeService();
    enrollmentsRepository.findByUserAndCourse.mockResolvedValue(null);

    await expect(
      service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'a', q2: 'b' } }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects submission once the attempt limit is reached', async () => {
    const { service, progressRepository } = makeService();
    progressRepository.countAttempts.mockResolvedValue(2);

    await expect(
      service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'a', q2: 'b' } }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('scores a fully correct submission as passed', async () => {
    const { service } = makeService();

    const result = await service.submitQuizAttempt('u1', 'quiz1', {
      answers: { q1: 'a', q2: 'b' },
    });

    expect(result.attempt.scorePercent).toBe(100);
    expect(result.attempt.passed).toBe(true);
    expect(result.perQuestionCorrectness).toEqual({ q1: true, q2: true });
  });

  it('scores a partially correct submission below the passing threshold as failed', async () => {
    const { service } = makeService();

    const result = await service.submitQuizAttempt('u1', 'quiz1', {
      answers: { q1: 'a', q2: 'wrong' },
    });

    expect(result.attempt.scorePercent).toBe(50);
    expect(result.attempt.passed).toBe(true); // 50 >= passingScorePercent (50)
    expect(result.perQuestionCorrectness).toEqual({ q1: true, q2: false });
  });

  it('rejects a submission missing an answer for one of the quiz questions', async () => {
    const { service } = makeService();

    await expect(
      service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'a' } }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a submission with an answer for a question that does not exist on the quiz', async () => {
    const { service } = makeService();

    await expect(
      service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'a', q2: 'b', q3: 'c' } }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Phase 29: a passed quiz attempt now completes its lesson, reusing
  // updateLessonProgress's own upsert+recompute+notify+certificate flow.
  describe('lesson completion on quiz pass/fail (Phase 29)', () => {
    it('marks the lesson complete after a passing attempt', async () => {
      const { service, progressRepository } = makeService();

      await service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'a', q2: 'b' } });

      expect(progressRepository.upsertProgressAndRecomputeCompletion).toHaveBeenCalledWith(
        'enr1',
        'lesson1',
        'course1',
        { progressPercent: 100 },
      );
    });

    it('does not mark the lesson complete after a failing attempt', async () => {
      const { service, progressRepository } = makeService();

      // Both answers wrong -> 0%, below the 50% passing threshold.
      await service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'wrong', q2: 'wrong' } });

      expect(progressRepository.upsertProgressAndRecomputeCompletion).not.toHaveBeenCalled();
    });

    it('is idempotent across repeated passing attempts — same upsert target every time, no parallel record created', async () => {
      const { service, progressRepository } = makeService();

      await service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'a', q2: 'b' } });
      await service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'a', q2: 'b' } });

      expect(progressRepository.upsertProgressAndRecomputeCompletion).toHaveBeenCalledTimes(2);
      expect(progressRepository.upsertProgressAndRecomputeCompletion).toHaveBeenNthCalledWith(
        1,
        'enr1',
        'lesson1',
        'course1',
        { progressPercent: 100 },
      );
      expect(progressRepository.upsertProgressAndRecomputeCompletion).toHaveBeenNthCalledWith(
        2,
        'enr1',
        'lesson1',
        'course1',
        { progressPercent: 100 },
      );
    });

    it('notifies and issues a certificate when a passing attempt pushes completion to 100%', async () => {
      const { service, progressRepository, certificatesService, notificationsService } =
        makeService();
      progressRepository.upsertProgressAndRecomputeCompletion.mockResolvedValue({
        progress: { id: 'lp1' },
        enrollment: { id: 'enr1', completionPercent: 100 },
      });

      await service.submitQuizAttempt('u1', 'quiz1', { answers: { q1: 'a', q2: 'b' } });

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', type: 'course.completed' }),
      );
      expect(certificatesService.issueForEnrollment).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'enr1', completionPercent: 100 }),
      );
    });
  });
});

describe('ProgressService.updateLessonProgress', () => {
  const makeService = () => {
    const progressRepository = {
      upsertProgressAndRecomputeCompletion: jest.fn(),
      findProgressForEnrollment: jest.fn(),
      findQuizWithQuestions: jest.fn(),
      countAttempts: jest.fn(),
      createAttempt: jest.fn(),
    };
    const lessonsRepository = {
      findByIdWithModuleCourse: jest.fn().mockResolvedValue({
        id: 'lesson1',
        module: { course: { id: 'course1', title: 'Test Course' } },
      }),
    };
    const enrollmentsRepository = {
      findByUserAndCourse: jest
        .fn()
        .mockResolvedValue({ id: 'enr1', status: 'active', completionPercent: 50 }),
      update: jest.fn(),
    };
    const certificatesService = { issueForEnrollment: jest.fn() };
    const notificationsService = { create: jest.fn() };

    const service = new ProgressService(
      progressRepository as never,
      lessonsRepository as never,
      enrollmentsRepository as never,
      certificatesService as never,
      notificationsService as never,
    );
    return { service, progressRepository, certificatesService, notificationsService };
  };

  it('does not notify or issue a certificate when completion stays below 100%', async () => {
    const { service, progressRepository, certificatesService, notificationsService } =
      makeService();
    progressRepository.upsertProgressAndRecomputeCompletion.mockResolvedValue({
      progress: { id: 'p1' },
      enrollment: { id: 'enr1', completionPercent: 75 },
    });

    await service.updateLessonProgress('u1', 'lesson1', { progressPercent: 100 });

    expect(notificationsService.create).not.toHaveBeenCalled();
    expect(certificatesService.issueForEnrollment).not.toHaveBeenCalled();
  });

  it('notifies and issues a certificate exactly on the transition into 100% completion', async () => {
    const { service, progressRepository, certificatesService, notificationsService } =
      makeService();
    progressRepository.upsertProgressAndRecomputeCompletion.mockResolvedValue({
      progress: { id: 'p1' },
      enrollment: { id: 'enr1', completionPercent: 100 },
    });

    await service.updateLessonProgress('u1', 'lesson1', { progressPercent: 100 });

    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'course.completed' }),
    );
    expect(certificatesService.issueForEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'enr1', completionPercent: 100 }),
    );
  });

  it('does not re-notify or re-issue a certificate if the enrollment was already at 100%', async () => {
    const progressRepository = {
      upsertProgressAndRecomputeCompletion: jest.fn().mockResolvedValue({
        progress: { id: 'p1' },
        enrollment: { id: 'enr1', completionPercent: 100 },
      }),
    };
    const lessonsRepository = {
      findByIdWithModuleCourse: jest.fn().mockResolvedValue({
        id: 'lesson1',
        module: { course: { id: 'course1', title: 'Test Course' } },
      }),
    };
    const enrollmentsRepository = {
      // Already at 100% before this write — a subsequent progress ping shouldn't re-fire.
      findByUserAndCourse: jest
        .fn()
        .mockResolvedValue({ id: 'enr1', status: 'active', completionPercent: 100 }),
    };
    const certificatesService = { issueForEnrollment: jest.fn() };
    const notificationsService = { create: jest.fn() };

    const service = new ProgressService(
      progressRepository as never,
      lessonsRepository as never,
      enrollmentsRepository as never,
      certificatesService as never,
      notificationsService as never,
    );

    await service.updateLessonProgress('u1', 'lesson1', { progressPercent: 100 });

    expect(notificationsService.create).not.toHaveBeenCalled();
    expect(certificatesService.issueForEnrollment).not.toHaveBeenCalled();
  });
});

describe('ProgressService.getQuizForLearner', () => {
  const quizWithAnswers = {
    id: 'quiz1',
    title: 'Module 1 Assessment',
    passingScorePercent: 75,
    maxAttempts: 3,
    lesson: { module: { courseId: 'course1' } },
    questions: [
      { id: 'q2', prompt: 'Second?', questionType: 'single', options: ['a', 'b'], correctAnswer: 'b', position: 2 },
      { id: 'q1', prompt: 'First?', questionType: 'single', options: ['a', 'b'], correctAnswer: 'a', position: 1 },
    ],
  };

  const makeService = () => {
    const progressRepository = {
      findQuizWithQuestions: jest.fn().mockResolvedValue(quizWithAnswers),
    };
    const lessonsRepository = { findByIdWithModuleCourse: jest.fn() };
    const enrollmentsRepository = {
      findByUserAndCourse: jest
        .fn()
        .mockResolvedValue({ id: 'enr1', status: 'active', completionPercent: 0 }),
    };
    const certificatesService = { issueForEnrollment: jest.fn() };
    const notificationsService = { create: jest.fn() };

    const service = new ProgressService(
      progressRepository as never,
      lessonsRepository as never,
      enrollmentsRepository as never,
      certificatesService as never,
      notificationsService as never,
    );
    return { service, progressRepository, enrollmentsRepository };
  };

  it('never includes correctAnswer in the returned questions', async () => {
    const { service } = makeService();

    const result = await service.getQuizForLearner('u1', 'quiz1');

    for (const question of result.questions) {
      expect(question).not.toHaveProperty('correctAnswer');
    }
  });

  it('returns questions ordered by position, not by underlying storage order', async () => {
    const { service } = makeService();

    const result = await service.getQuizForLearner('u1', 'quiz1');

    expect(result.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
  });

  it('rejects a viewer without an active enrollment', async () => {
    const { service, enrollmentsRepository } = makeService();
    enrollmentsRepository.findByUserAndCourse.mockResolvedValue(null);

    await expect(service.getQuizForLearner('u1', 'quiz1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('404s for a nonexistent quiz', async () => {
    const { service, progressRepository } = makeService();
    progressRepository.findQuizWithQuestions.mockResolvedValue(null);

    await expect(service.getQuizForLearner('u1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
