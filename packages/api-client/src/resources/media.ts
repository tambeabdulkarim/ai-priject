import type { MediaPlayback } from '@phoenix/types';
import type { RequestFn } from '../core/request';

/** docs/16-API-CONTRACT.md GET /media/:id — the only Media endpoint this frontend needs (reprocess is admin-only, out of scope). */
export function createMediaResource(request: RequestFn) {
  return {
    getById: (id: string) => request<MediaPlayback>({ method: 'GET', path: `/media/${id}` }),
  };
}

export type MediaResource = ReturnType<typeof createMediaResource>;
