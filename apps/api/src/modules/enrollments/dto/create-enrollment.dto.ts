// docs/16-API-CONTRACT.md POST /enrollments — free courses only.

import { IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  courseId!: string;
}
