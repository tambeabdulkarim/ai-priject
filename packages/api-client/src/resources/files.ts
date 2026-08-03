import type { FileRecord, GetFileResponse, RequestUploadUrlRequest, RequestUploadUrlResponse } from '@phoenix/types';
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
 */
function putToPresignedUrl(uploadUrl: string, file: File | Blob, contentType: string, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
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
    xhr.send(file);
  });
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
    request<FileRecord>({ method: 'POST', path: `/files/${uploadId}/complete` });

  const getFile = (id: string) => request<GetFileResponse>({ method: 'GET', path: `/files/${id}` });

  return {
    requestUploadUrl,
    completeUpload,
    getFile,

    /**
     * Orchestrates the full documented flow: request a presigned URL →
     * PUT the raw bytes to storage → notify the API on completion.
     *
     * KNOWN BACKEND ISSUE, not fixed here (out of scope — backend is
     * frozen this phase; see packages/types/src/files.ts's `FileRecord`
     * comment): `completeUpload`'s real response contains a raw Prisma
     * `BigInt` (`sizeBytes`), which has no JSON serialization in
     * apps/api's actual bootstrap config and will throw a 500 server-side
     * before ever reaching this function. This helper is implemented
     * correctly against the documented/typed contract; exercising it
     * end-to-end against the real backend today will surface that
     * pre-existing bug, not a defect in this code.
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

      await putToPresignedUrl(urlResult.data.uploadUrl, params.file, params.contentType, params.onProgress);

      return completeUpload(urlResult.data.uploadId);
    },
  };
}

export type FilesResource = ReturnType<typeof createFilesResource>;
