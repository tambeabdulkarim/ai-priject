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
 * `getById`.
 *
 * DISCOVERED ISSUE (not fixed — out of scope this phase, backend is
 * frozen per this phase's instructions): `sizeBytes` is a Prisma `BigInt`
 * column (schema.prisma `File.sizeBytes BigInt`). No
 * `ClassSerializerInterceptor` or custom JSON replacer exists anywhere in
 * apps/api/src/main.ts, and native `JSON.stringify` throws on a raw
 * `BigInt` value. This means `POST /files/:uploadId/complete` and
 * `GET /files/:id` will throw a 500 the moment a real file completes an
 * upload, independent of anything in this frontend phase. Typed here as
 * `string` (the standard-practice representation if/when that backend
 * bug is fixed) so the frontend type is ready either way; the upload
 * helper's `completeUpload` call is expected to fail until the backend
 * issue is addressed. Flagged in this phase's report, not silently
 * routed around.
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
  createdAt: string;
  updatedAt: string;
}

export interface GetFileResponse {
  file: FileRecord;
  signedUrl: string;
}
