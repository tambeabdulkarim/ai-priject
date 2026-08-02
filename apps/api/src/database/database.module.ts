import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global so every feature module can inject PrismaService without each
// one separately importing DatabaseModule — consistent with it being
// pure infrastructure, not a domain module.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
