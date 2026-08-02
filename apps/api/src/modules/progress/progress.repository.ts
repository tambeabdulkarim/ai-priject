// Data-access layer for Lesson_Progress / Quizzes / Quiz_Attempts
// (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Enrollment, LessonProgress, Prisma, QuizAttempt } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * docs/15-SYSTEM-WORKFLOWS.md §9: the lesson-progress write and the
   * parent Enrollment.completion_percent recompute must be atomic — a
   * crash between them would otherwise leave completion_percent stale
   * relative to the progress rows that drove it. Certificate issuance is
   * deliberately NOT part of this transaction (docs/15-SYSTEM-WORKFLOWS.md
   * §11: "completion and certificate issuance are decoupled so a
   * rendering bug never revokes earned progress") — the caller issues it
   * afterward, outside this transaction, using the returned enrollment.
   */
  async upsertProgressAndRecomputeCompletion(
    enrollmentId: string,
    lessonId: string,
    courseId: string,
    data: { progressPercent: number; lastPositionSeconds?: number },
  ): Promise<{ progress: LessonProgress; enrollment: Enrollment }> {
    return this.prisma.$transaction(async (tx) => {
      const progress = await tx.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
        create: {
          enrollment: { connect: { id: enrollmentId } },
          lesson: { connect: { id: lessonId } },
          progressPercent: data.progressPercent,
          lastPositionSeconds: data.lastPositionSeconds,
          completedAt: data.progressPercent >= 100 ? new Date() : null,
        },
        update: {
          progressPercent: data.progressPercent,
          ...(data.lastPositionSeconds !== undefined
            ? { lastPositionSeconds: data.lastPositionSeconds }
            : {}),
          completedAt: data.progressPercent >= 100 ? new Date() : null,
        },
      });

      const [allProgress, totalLessons] = await Promise.all([
        tx.lessonProgress.findMany({ where: { enrollmentId } }),
        tx.lesson.count({ where: { module: { courseId } } }),
      ]);
      const completedLessons = allProgress.filter((p) => p.completedAt !== null).length;
      const completionPercent =
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

      const enrollment = await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          completionPercent,
          ...(completionPercent >= 100 ? { completedAt: new Date() } : {}),
        },
      });

      return { progress, enrollment };
    });
  }

  findProgressForEnrollment(enrollmentId: string): Promise<LessonProgress[]> {
    return this.prisma.lessonProgress.findMany({ where: { enrollmentId } });
  }

  findQuizWithQuestions(quizId: string) {
    return this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true, lesson: { include: { module: true } } },
    });
  }

  countAttempts(quizId: string, userId: string): Promise<number> {
    return this.prisma.quizAttempt.count({ where: { quizId, userId } });
  }

  createAttempt(data: Prisma.QuizAttemptCreateInput): Promise<QuizAttempt> {
    return this.prisma.quizAttempt.create({ data });
  }
}
