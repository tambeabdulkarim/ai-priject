// docs/16-API-CONTRACT.md §7 (Progress). docs/15-SYSTEM-WORKFLOWS.md §9.

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Enrollment, LessonProgress, Prisma, QuizAttempt } from '@prisma/client';
import { CertificatesService } from '../certificates/certificates.service';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository';
import { LessonsRepository } from '../lessons/lessons.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { ProgressRepository } from './progress.repository';
import { isAnswerCorrect } from './quiz-scoring';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly lessonsRepository: LessonsRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly certificatesService: CertificatesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async requireActiveEnrollment(userId: string, courseId: string) {
    const enrollment = await this.enrollmentsRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment || enrollment.status !== 'active') {
      throw new ForbiddenException('An active enrollment is required.');
    }
    return enrollment;
  }

  /** docs/16-API-CONTRACT.md PUT /progress/lessons/:lessonId */
  async updateLessonProgress(
    userId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ): Promise<{ progress: LessonProgress; completionPercent: number }> {
    const lesson = await this.lessonsRepository.findByIdWithModuleCourse(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }
    const courseId = lesson.module.course.id;
    const enrollment = await this.requireActiveEnrollment(userId, courseId);

    const { progress, enrollment: updatedEnrollment } =
      await this.upsertProgressAndHandleCompletion(
        userId,
        enrollment,
        lessonId,
        courseId,
        lesson.module.course.title,
        { progressPercent: dto.progressPercent, lastPositionSeconds: dto.lastPositionSeconds },
      );

    return { progress, completionPercent: updatedEnrollment.completionPercent };
  }

  /**
   * docs/15-SYSTEM-WORKFLOWS.md §9/§11: the shared "mark a lesson
   * complete, recompute course completion, and — only on the transition
   * into 100% — notify + attempt certificate issuance" flow. Extracted
   * Phase 29 so `submitQuizAttempt` (a passed quiz completes its lesson,
   * same as any other lesson) reuses exactly this, rather than a second,
   * parallel completion mechanism. Certificate issuance stays outside the
   * progress transaction — see the repository method's own doc comment —
   * and `certificatesService.issueForEnrollment` independently re-
   * validates every quiz in the course was actually passed
   * (`QuizAttempt`-based, unchanged by this phase) before issuing, so this
   * method does not need to (and must not) duplicate that gate.
   */
  private async upsertProgressAndHandleCompletion(
    userId: string,
    enrollment: Enrollment,
    lessonId: string,
    courseId: string,
    courseTitle: string,
    data: { progressPercent: number; lastPositionSeconds?: number },
  ): Promise<{ progress: LessonProgress; enrollment: Enrollment }> {
    const wasAlreadyComplete = enrollment.completionPercent >= 100;

    const { progress, enrollment: updatedEnrollment } =
      await this.progressRepository.upsertProgressAndRecomputeCompletion(
        enrollment.id,
        lessonId,
        courseId,
        data,
      );

    if (!wasAlreadyComplete && updatedEnrollment.completionPercent >= 100) {
      await this.notificationsService.create({
        userId,
        type: 'course.completed',
        title: 'Course completed',
        body: `You've completed "${courseTitle}".`,
        sourceEventId: updatedEnrollment.id,
      });
      await this.certificatesService.issueForEnrollment(updatedEnrollment);
    }

    return { progress, enrollment: updatedEnrollment };
  }

  /**
   * docs/16-API-CONTRACT.md GET /progress/quizzes/:quizId — Phase 28.
   * Closes a real, confirmed gap: no endpoint previously existed for a
   * learner to fetch a quiz's questions before submitting (only
   * submitQuizAttempt below existed). `correctAnswer` is stripped from
   * every question here — never sent to the client — otherwise this
   * reuses submitQuizAttempt's own entitlement rule (active enrollment)
   * unchanged, no new authorization logic invented.
   */
  async getQuizForLearner(userId: string, quizId: string) {
    const quiz = await this.progressRepository.findQuizWithQuestions(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }
    const courseId = quiz.lesson.module.courseId;
    await this.requireActiveEnrollment(userId, courseId);

    return {
      id: quiz.id,
      title: quiz.title,
      passingScorePercent: quiz.passingScorePercent,
      maxAttempts: quiz.maxAttempts,
      questions: quiz.questions
        .sort((a, b) => a.position - b.position)
        .map((q) => ({
          id: q.id,
          prompt: q.prompt,
          questionType: q.questionType,
          options: q.options,
          position: q.position,
        })),
    };
  }

  /** docs/16-API-CONTRACT.md GET /progress/courses/:courseId */
  async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await this.enrollmentsRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment) {
      throw new NotFoundException('No enrollment found for this course.');
    }
    const lessonProgress = await this.progressRepository.findProgressForEnrollment(enrollment.id);
    return { completionPercent: enrollment.completionPercent, lessons: lessonProgress };
  }

  /** docs/16-API-CONTRACT.md POST /progress/quizzes/:quizId/attempts */
  async submitQuizAttempt(
    userId: string,
    quizId: string,
    dto: SubmitQuizAttemptDto,
  ): Promise<{ attempt: QuizAttempt; perQuestionCorrectness: Record<string, boolean> }> {
    const quiz = await this.progressRepository.findQuizWithQuestions(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }
    const courseId = quiz.lesson.module.courseId;
    const enrollment = await this.requireActiveEnrollment(userId, courseId);

    if (quiz.maxAttempts !== null) {
      const attemptsSoFar = await this.progressRepository.countAttempts(quizId, userId);
      if (attemptsSoFar >= quiz.maxAttempts) {
        throw new ConflictException('Attempt limit reached for this quiz.');
      }
    }

    if (quiz.questions.length === 0) {
      throw new BadRequestException('This quiz has no questions.');
    }

    // docs/16-API-CONTRACT.md: "Validation Rules: answer set must match
    // question set" — checked before scoring, per the same line.
    const questionIds = new Set(quiz.questions.map((q) => q.id));
    const answeredIds = new Set(Object.keys(dto.answers));
    const isExactMatch =
      questionIds.size === answeredIds.size && [...questionIds].every((id) => answeredIds.has(id));
    if (!isExactMatch) {
      throw new BadRequestException(
        'Malformed submission: answers must include exactly one entry per quiz question.',
      );
    }

    const perQuestionCorrectness: Record<string, boolean> = {};
    let correctCount = 0;
    for (const question of quiz.questions) {
      const submitted = dto.answers[question.id];
      const isCorrect = isAnswerCorrect(question.questionType, question.correctAnswer, submitted);
      perQuestionCorrectness[question.id] = isCorrect;
      if (isCorrect) correctCount += 1;
    }

    const scorePercent = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePercent >= quiz.passingScorePercent;

    const attempt = await this.progressRepository.createAttempt({
      quiz: { connect: { id: quizId } },
      user: { connect: { id: userId } },
      answers: dto.answers as Prisma.InputJsonValue,
      scorePercent,
      passed,
    });

    // Phase 29: a passed attempt completes its lesson exactly like any
    // other lesson, reusing updateLessonProgress's own completion flow —
    // no parallel completion mechanism. A failed attempt does nothing
    // here; the lesson simply isn't complete yet (matching "the quiz must
    // become complete only through a legitimate successful attempt").
    if (passed) {
      await this.upsertProgressAndHandleCompletion(
        userId,
        enrollment,
        quiz.lesson.id,
        courseId,
        quiz.lesson.module.course.title,
        { progressPercent: 100 },
      );
    }

    return { attempt, perQuestionCorrectness };
  }
}
