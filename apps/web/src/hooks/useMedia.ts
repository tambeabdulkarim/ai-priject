import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import type { ListMediaQuery, MediaRecord } from '@phoenix/types';
import type { UploadFileParams } from '@phoenix/api-client';
import { apiClient } from '../services/api-client';
import { queryKeys } from './queryKeys';

/** docs/16-API-CONTRACT.md GET /media/:id. A 425 (still processing) is a real, expected state, not a transient failure — no retry. */
export function useMediaPlayback(mediaId: string | null) {
  return useQuery({
    queryKey: queryKeys.media.detail(mediaId ?? ''),
    queryFn: async () => {
      const result = await apiClient.media.getById(mediaId as string);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: Boolean(mediaId),
    retry: false,
  });
}

/**
 * Phase 13.3 — GET /media/me, for the Media Library and Media Picker.
 * `useInfiniteQuery` (same pattern as useOrders.ts's useMyOrders) so
 * "load more" pagination works without re-fetching earlier pages.
 */
export function useMyMedia(query: Omit<ListMediaQuery, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.media.mine(query),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const result = await apiClient.media.listMine({ ...query, cursor: pageParam });
      if (result.error) throw result.error;
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** Phase 13.3 — DELETE /files/:id. Invalidates the Media Library list on success so a deleted item disappears without a manual refetch. */
export function useDeleteMediaFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => apiClient.files.deleteFile(fileId),
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['media', 'mine'] });
    },
  });
}

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'cancelled';

export interface UploadEntry {
  id: string;
  filename: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  media?: MediaRecord | null;
  cancel: () => void;
}

/**
 * Phase 13.3 — drives `<MediaUploader />`: tracks one or more concurrent
 * uploads (id, progress, status), each independently cancellable/
 * retryable, built on `apiClient.files.uploadFileWithControl` (additive
 * to the existing `uploadFile`, not a replacement — see that file's
 * comment). Not a TanStack Query mutation because it needs to track
 * *multiple independent* in-flight items with per-item progress, which
 * `useMutation` (one mutation, one status) doesn't model directly.
 */
export function useMediaUploadQueue() {
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const queryClient = useQueryClient();
  const controls = useRef(new Map<string, { retry: () => void }>());

  const patch = useCallback((id: string, patchFn: (entry: UploadEntry) => UploadEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? patchFn(e) : e)));
  }, []);

  const start = useCallback(
    (id: string, filename: string, params: UploadFileParams) => {
      const { result, cancel } = apiClient.files.uploadFileWithControl({
        ...params,
        onProgress: (percent) => patch(id, (e) => ({ ...e, progress: percent })),
      });
      controls.current.set(id, { retry: () => start(id, filename, params) });
      patch(id, (e) => ({ ...e, status: 'uploading', cancel }));

      result
        .then((res) => {
          if (res.error) {
            patch(id, (e) =>
              e.status === 'cancelled' ? e : { ...e, status: 'error', error: res.error.message },
            );
            return;
          }
          patch(id, (e) => ({ ...e, status: 'done', progress: 100, media: res.data.media }));
          queryClient.invalidateQueries({ queryKey: ['media', 'mine'] });
        })
        .catch((error: unknown) => {
          // Matches uploadFileWithControl's own convention (see that
          // file's comment): a storage-layer NetworkError (cancel, or a
          // real network failure) propagates as a rejection rather than
          // an ApiResult — caught here, not left unhandled.
          patch(id, (e) =>
            e.status === 'cancelled'
              ? e
              : {
                  ...e,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                },
          );
        });
    },
    [patch, queryClient],
  );

  /** Accepts one or more files (drag-drop or multi-select) — each becomes its own independently-tracked entry, matching the "multiple uploads" requirement. */
  const enqueue = useCallback(
    (files: { file: File; contentType: UploadFileParams['contentType'] }[]) => {
      for (const { file, contentType } of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setEntries((prev) => [
          ...prev,
          { id, filename: file.name, progress: 0, status: 'queued', cancel: () => {} },
        ]);
        start(id, file.name, { file, filename: file.name, contentType });
      }
    },
    [start],
  );

  const cancel = useCallback((id: string) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      entry?.cancel();
      return prev.map((e) => (e.id === id ? { ...e, status: 'cancelled' as const } : e));
    });
  }, []);

  const retry = useCallback(
    (id: string) => {
      patch(id, (e) => ({ ...e, status: 'queued', progress: 0, error: undefined }));
      controls.current.get(id)?.retry();
    },
    [patch],
  );

  const dismiss = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    controls.current.delete(id);
  }, []);

  return { entries, enqueue, cancel, retry, dismiss };
}
