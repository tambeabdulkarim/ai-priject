import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { CoursesModule } from '../courses/courses.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsRepository } from './enrollments.repository';

@Module({
  imports: [CommonModule, CoursesModule, NotificationsModule, PaymentsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EnrollmentsRepository],
  exports: [EnrollmentsService, EnrollmentsRepository],
})
export class EnrollmentsModule {}
