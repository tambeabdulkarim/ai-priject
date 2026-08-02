import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsRepository } from './news.repository';

@Module({
  imports: [CommonModule],
  controllers: [NewsController],
  providers: [NewsService, NewsRepository],
  exports: [NewsService, NewsRepository],
})
export class NewsModule {}
