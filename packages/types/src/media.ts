// docs/16-API-CONTRACT.md §14 (Media). Verified against
// apps/api/src/modules/media/media.service.ts `getById`. Returns a 425
// (still processing) via the documented error envelope when
// `transcodingStatus !== 'ready'` — this frontend must treat that as a
// real "come back shortly" state, not an error to hide.

export interface MediaPlayback {
  transcodingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  manifestUrl: string | null;
}

/**
 * Phase 13.2/13.3: the raw `Media` row as returned directly by
 * `POST /files/:uploadId/complete`'s new `media` field
 * (`FilesService.completeUpload` → `MediaService.createFromFile`, which
 * returns the Prisma `Media` record as-is — no File join, unlike
 * `MediaListItem` below). Kept as a distinct type rather than reusing
 * `MediaListItem` because the two endpoints genuinely return different
 * shapes.
 */
export interface MediaRecord {
  id: string;
  fileId: string;
  mediaType: 'video' | 'image' | 'audio';
  durationSeconds: number | null;
  transcodingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  hlsManifestKey: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Phase 13.3 (Media Frontend) — GET /media/me. Verified against
 * MediaService.listMine's real mapped shape (metadata only, no signed
 * URL — see that method's own comment on why: signed URLs are minted
 * on demand, never pre-fetched for a whole list page).
 */
export interface MediaListItem {
  id: string;
  fileId: string;
  mediaType: 'video' | 'image' | 'audio';
  transcodingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  originalFilename: string;
  mimeType: string;
  sizeBytes: string;
  createdAt: string;
}

export interface ListMediaQuery {
  cursor?: string;
  limit?: number;
  mediaType?: 'video' | 'image' | 'audio';
  q?: string;
}
