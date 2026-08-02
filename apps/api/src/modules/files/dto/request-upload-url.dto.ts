// docs/16-API-CONTRACT.md POST /files/upload-url

import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
  'application/zip',
] as const;

export class RequestUploadUrlDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: string;

  @IsInt()
  @Min(1)
  // docs/10-SECURITY-BIBLE.md §14: "tiered per role and content type" —
  // exact numbers not specified anywhere in the approved docs; this is a
  // conservative operational default (500MB absolute ceiling), not an
  // architectural claim. Per-role tiering happens in the service layer.
  @Max(500 * 1024 * 1024)
  sizeBytes!: number;
}

export { ALLOWED_CONTENT_TYPES };
