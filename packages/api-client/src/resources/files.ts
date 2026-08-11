import type {
  CompleteUploadResponse,
  FileRecord,
  GetFileResponse,
  RequestUploadUrlRequest,
  RequestUploadUrlResponse,
} from '@phoenix/types';
import type { ApiResult } from '../core/client-config';
import type { RequestFn } from '../core/request';
import { NetworkError } from '../core/errors';

export interface UploadFileParams {
  file: File | Blob;
  filename: string;
  contentType: RequestUploadUrlRequest['contentType'];
  /** 0–100. Only fires reliably via the XHR path below — native `fetch` has no cross-browser upload-progress event as of this writing, which is why this one step deliberately isn't built on the shared `request()` wrapper. */
  onProgress?: (percent: number) => void;
}

/**
 * Uploads the raw bytes directly to object storage via the presigned URL
 * (browser → storage, never through the Next.js server or the API
 * server's own memory — docs/09-PLATFORM-ARCHITECTURE.md §9). Isolated
 * to this one function specifically because it needs real upload-progress
 * events; every other call in this package goes through the shared
 * `fetch`-based `request()` wrapper.
 *
 * Phase 13.3: returns the live `XMLHttpRequest` alongside the promise so
 * a caller (MediaUploader) can `.abort()` it — the Storage-upload leg is
 * the only one worth cancelling client-side (the presigned-URL request
 * and the completion call are both fast, single-round-trip calls).
 */
function putToPresignedUrl(
  uploadUrl: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (percent: number) => void,
): { promise: Promise<void>; xhr: XMLHttpRequest } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<void>((resolve, reject) => {
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new NetworkError(new Error(`Storage upload failed with status ${xhr.status}`)));
      }
    };
    xhr.onerror = () => reject(new NetworkError(new Error('Storage upload network error')));
    xhr.onabort = () => reject(new NetworkError(new Error('Upload cancelled')));
    xhr.send(file);
  });
  return { promise, xhr };
}

/**
 * docs/16-API-CONTRACT.md §13 (Files), verified against
 * apps/api/src/modules/files/{files.controller.ts,files.service.ts}.
 *
 * `getSignedDownloadUrl` deliberately wraps only `GET /files/:id` — the
 * generic Files endpoint. It does NOT attempt to dispatch to
 * `GET /media/:id`, `GET /certificates/:id`, or
 * `POST /library/items/:id/access` (each entitlement-gated differently,
 * per the backend's real, per-content-type resolution in
 * FilesRepository.findEntitlementContext) — those belong to the Course/
 * Certificate/Library feature areas respectively, out of scope for this
 * foundation phase (Library explicitly excluded; Media/Certificates are
 * course-feature-adjacent, not foundation). Wiring the full dispatcher
 * described in docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §2.10 is
 * deferred to whichever feature phase actually needs each of those three
 * endpoints, not built ahead of a real consumer.
 */
export function createFilesResource(request: RequestFn) {
  const requestUploadUrl = (body: RequestUploadUrlRequest) =>
    request<RequestUploadUrlResponse>({ method: 'POST', path: '/files/upload-url', body });

  const completeUpload = (uploadId: string) =>
    request<CompleteUploadResponse>({ method: 'POST', path: `/files/${uploadId}/complete` });

  const getFile = (id: string) => request<GetFileResponse>({ method: 'GET', path: `/files/${id}` });

  /** Phase 13.3 (Media Frontend) — `DELETE /files/:id`. 204 on success (no body). */
  const deleteFile = (id: string) => request<void>({ method: 'DELETE', path: `/files/${id}` });

  return {
    requestUploadUrl,
    completeUpload,
    getFile,
    deleteFile,

    /**
     * Orchestrates the full documented flow: request a presigned URL →
     * PUT the raw bytes to storage → notify the API on completion. Fixed
     * end-to-end as of Phase 13.2 (the BigInt-serialization bug this
     * comment used to describe is resolved — see
     * packages/types/src/files.ts's `FileRecord` comment).
     */
    async uploadFile(params: UploadFileParams): Promise<ApiResult<FileRecord>> {
      const urlResult = await requestUploadUrl({
        filename: params.filename,
        contentType: params.contentType,
        sizeBytes: params.file.size,
      });
      if (urlResult.error) {
        return urlResult;
      }

      const { promise } = putToPresignedUrl(
        urlResult.data.uploadUrl,
        params.file,
        params.contentType,
        params.onProgress,
      );
      await promise;

      return completeUpload(urlResult.data.uploadId);
    },

    /**
     * Phase 13.3 — the same flow as `uploadFile`, but returns a `cancel()`
     * handle alongside the result promise, for `<MediaUploader />`'s
     * cancel/retry requirements. Not used to replace `uploadFile` (kept
     * unchanged above) — additive, so nothing that already calls
     * `uploadFile` is affected.
     */
    uploadFileWithControl(params: UploadFileParams): {
      result: Promise<ApiResult<CompleteUploadResponse>>;
      cancel: () => void;
    } {
      let xhrRef: XMLHttpRequest | null = null;
      let cancelled = false;

      // Matches `uploadFile`'s existing convention: `ApiResult['error']` is
      // strictly a documented backend `ApiError` — a storage-layer
      // `NetworkError` (cancelled, or a real network failure) is not
      // force-fit into that shape, it propagates as a real rejection, same
      // as `uploadFile` already does.
      const result = (async (): Promise<ApiResult<CompleteUploadResponse>> => {
        const urlResult = await requestUploadUrl({
          filename: params.filename,
          contentType: params.contentType,
          sizeBytes: params.file.size,
        });
        if (urlResult.error) {
          return urlResult;
        }
        if (cancelled) {
          throw new NetworkError(new Error('Upload cancelled'));
        }

        const { promise, xhr } = putToPresignedUrl(
          urlResult.data.uploadUrl,
          params.file,
          params.contentType,
          params.onProgress,
        );
        xhrRef = xhr;
        await promise;

        return completeUpload(urlResult.data.uploadId);
      })();

      return {
        result,
        cancel: () => {
          cancelled = true;
          xhrRef?.abort();
        },
      };
    },
  };
}

export type FilesResource = ReturnType<typeof createFilesResource>;
