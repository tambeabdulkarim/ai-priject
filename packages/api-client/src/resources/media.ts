import type {
  ListMediaQuery,
  MediaListItem,
  MediaPlayback,
  PaginatedResponse,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/** docs/16-API-CONTRACT.md GET /media/:id, and Phase 13.3's GET /media/me (Media Library/Picker). Reprocess is admin-only, out of scope. */
export function createMediaResource(request: RequestFn) {
  const listMine = (query: ListMediaQuery = {}) =>
    request<PaginatedResponse<MediaListItem>>({
      method: 'GET',
      path: '/media/me',
      query: { cursor: query.cursor, limit: query.limit, mediaType: query.mediaType, q: query.q },
    });

  return {
    getById: (id: string) => request<MediaPlayback>({ method: 'GET', path: `/media/${id}` }),
    listMine,
  };
}

export type MediaResource = ReturnType<typeof createMediaResource>;
