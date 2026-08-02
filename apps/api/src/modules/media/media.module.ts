import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { LessonsModule } from '../lessons/lessons.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';

@Module({
  imports: [CommonModule, LessonsModule],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService, MediaRepository],
})
export class MediaModule {}
