import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { CoursesModule } from '../courses/courses.module';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsService } from './learning-paths.service';
import { LearningPathsRepository } from './learning-paths.repository';

@Module({
  imports: [CommonModule, CoursesModule],
  controllers: [LearningPathsController],
  providers: [LearningPathsService, LearningPathsRepository],
  exports: [LearningPathsService, LearningPathsRepository],
})
export class LearningPathsModule {}
