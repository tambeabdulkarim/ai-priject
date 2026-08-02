import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { CategoriesModule } from '../categories/categories.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CoursesRepository } from './courses.repository';

@Module({
  imports: [CommonModule, CategoriesModule],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository],
  exports: [CoursesService, CoursesRepository],
})
export class CoursesModule {}
