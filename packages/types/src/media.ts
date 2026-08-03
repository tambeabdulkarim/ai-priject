// docs/16-API-CONTRACT.md §14 (Media). Verified against
// apps/api/src/modules/media/media.service.ts `getById`. Returns a 425
// (still processing) via the documented error envelope when
// `transcodingStatus !== 'ready'` — this frontend must treat that as a
// real "come back shortly" state, not an error to hide.

export interface MediaPlayback {
  transcodingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  manifestUrl: string | null;
}
