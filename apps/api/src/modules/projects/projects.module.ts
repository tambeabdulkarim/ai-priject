import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { CoursesModule } from '../courses/courses.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';

@Module({
  imports: [CommonModule, CoursesModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
