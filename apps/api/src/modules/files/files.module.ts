import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';

@Module({
  imports: [MediaModule],
  controllers: [FilesController],
  providers: [FilesService, FilesRepository],
  exports: [FilesService, FilesRepository],
})
export class FilesModule {}
