// docs/16-API-CONTRACT.md §13 (Files). Verified against
// apps/api/src/modules/files/{files.controller.ts,files.service.ts,
// dto/request-upload-url.dto.ts}.

export type AllowedUploadContentType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf'
  | 'video/mp4'
  | 'audio/mpeg'
  | 'application/zip';

export interface RequestUploadUrlRequest {
  filename: string;
  contentType: AllowedUploadContentType;
  sizeBytes: number;
}

export interface RequestUploadUrlResponse {
  uploadUrl: string;
  uploadId: string;
}

/**
 * Mirrors the Prisma `File` model returned as-is by `completeUpload`/
 * `getById`. `sizeBytes` is a Prisma `BigInt` column, serialized to a
 * JSON string — RESOLVED in Phase 13.2 (`apps/api/src/main.ts`'s
 * `BigInt.prototype.toJSON` fix, reviewed in Phase 13.2's Final
 * Technical Review); this type's `string` shape was already correct in
 * anticipation of that fix, only the "expected to fail" caveat is
 * removed here.
 */
export interface FileRecord {
  id: string;
  uploadedById: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: string;
  scanStatus: 'pending' | 'clean' | 'quarantined';
  visibility: 'private' | 'public';
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetFileResponse {
  file: FileRecord;
  signedUrl: string;
}

/**
 * docs/media-architecture-report.md §1/§2/§8 (Phase 13.2), consumed here
 * in Phase 13.3: `POST /files/:uploadId/complete`'s response, additive
 * to the plain `FileRecord` — `media` is `null` for file types that
 * don't need the Media extension (e.g. documents), not an error.
 */
export interface CompleteUploadResponse extends FileRecord {
  media: import('./media').MediaRecord | null;
}
