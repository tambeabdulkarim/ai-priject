// docs/16-API-CONTRACT.md POST /ai/requests. Only the generic envelope
// doc16 itself documents is validated here — the `input` schema "varies
// per feature" per docs/12-AI-INTEGRATION-BIBLE.md §7, but doc12 never
// enumerates an actual feature catalog or any per-feature schema (it is a
// governance/philosophy document, not an implementation spec). See
// ai.service.ts for why this endpoint's dispatch is BLOCKED BY DOCUMENTATION.

import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAiRequestDto {
  @IsString()
  @MinLength(1)
  feature!: string;

  @IsObject()
  input!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  promptTemplateVersion?: string;
}
