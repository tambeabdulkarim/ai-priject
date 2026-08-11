// docs/16-API-CONTRACT.md §7 (Progress).

import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // docs/16-API-CONTRACT.md: "60 requests / 5 min per user (high-frequency, intentionally generous)"
  @Throttle({ default: { limit: 60, ttl: 300_000 } })
  @Put('lessons/:lessonId')
  updateLessonProgress(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.updateLessonProgress(user.sub, lessonId, dto);
  }

  @Get('courses/:courseId')
  getCourseProgress(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.getCourseProgress(user.sub, courseId);
  }

  // docs/16-API-CONTRACT.md: Phase 28 — GET /progress/quizzes/:quizId,
  // "60 requests / 5 min per user" — same generous tier as lesson
  // progress, since loading a quiz to view it is a routine, high-frequency
  // read, not the sensitive submit action below.
  @Throttle({ default: { limit: 60, ttl: 300_000 } })
  @Get('quizzes/:quizId')
  getQuiz(@Param('quizId', ParseUUIDPipe) quizId: string, @CurrentUser() user: JwtPayload) {
    return this.progressService.getQuizForLearner(user.sub, quizId);
  }

  // docs/16-API-CONTRACT.md: "10 requests / 15 min per user"
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('quizzes/:quizId/attempts')
  submitQuizAttempt(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: SubmitQuizAttemptDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.submitQuizAttempt(user.sub, quizId, dto);
  }
}
