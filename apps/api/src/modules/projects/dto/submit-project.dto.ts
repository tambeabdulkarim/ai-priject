// docs/16-API-CONTRACT.md POST /projects/:id/submissions — at least one of
// `content`/`fileId` required, enforced in ProjectsService (Prisma has no
// portable "at least one of" column constraint, same tradeoff already
// accepted for Certificate.pdfFileId).

import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitProjectDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID()
  fileId?: string;
}
