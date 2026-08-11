'use client';

// Reusable drag-and-drop + click-to-upload component. Supports multiple
// concurrent uploads, per-item progress/cancel/retry, and client-side
// content-type validation (checked against the same allowlist the real
// backend enforces — apps/api's RequestUploadUrlDto / packages/types'
// `AllowedUploadContentType` — so a rejected file is caught here with an
// immediate, specific message instead of a round-trip 400).

import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import type { AllowedUploadContentType } from '@phoenix/types';
import { useMediaUploadQueue, type UploadEntry } from '../../hooks/useMedia';

const ALLOWED_CONTENT_TYPES: readonly AllowedUploadContentType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
  'application/zip',
];

const COPY = {
  ar: {
    dropHint: 'اسحب الملفات هنا أو انقر للاختيار',
    dropActive: 'أفلت الملفات هنا',
    uploading: 'جارٍ الرفع...',
    done: 'تم',
    error: 'فشل',
    cancelled: 'أُلغي',
    cancel: 'إلغاء',
    retry: 'إعادة المحاولة',
    dismiss: 'إخفاء',
    rejected: (name: string) => `"${name}" ليس نوع ملف مسموحًا به.`,
  },
  en: {
    dropHint: 'Drag files here or click to choose',
    dropActive: 'Drop files here',
    uploading: 'Uploading...',
    done: 'Done',
    error: 'Failed',
    cancelled: 'Cancelled',
    cancel: 'Cancel',
    retry: 'Retry',
    dismiss: 'Dismiss',
    rejected: (name: string) => `"${name}" is not an allowed file type.`,
  },
} as const;

export interface MediaUploaderProps {
  locale: 'ar' | 'en';
  /** Fires once per successfully-completed upload — the Picker uses this to auto-select the freshly-uploaded item. Only `id` is guaranteed (the real completeUpload response's `media` field, not the richer Library-list shape). */
  onUploaded?: (media: { id: string }) => void;
  /** Restricts the accepted types further than the platform-wide allowlist (e.g. video-only in the lesson-video context). Defaults to every allowed type. */
  accept?: readonly AllowedUploadContentType[];
}

interface StatusLabels {
  uploading: string;
  done: string;
  error: string;
  cancelled: string;
}

function statusLabel(status: UploadEntry['status'], t: StatusLabels): string {
  switch (status) {
    case 'uploading':
    case 'queued':
      return t.uploading;
    case 'done':
      return t.done;
    case 'error':
      return t.error;
    case 'cancelled':
      return t.cancelled;
  }
}

export function MediaUploader({
  locale,
  onUploaded,
  accept = ALLOWED_CONTENT_TYPES,
}: MediaUploaderProps) {
  const t = COPY[locale] ?? COPY.ar;
  const { entries, enqueue, cancel, retry, dismiss } = useMediaUploadQueue();
  const [dragActive, setDragActive] = useState(false);
  const [rejections, setRejections] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifiedRef = useRef(new Set<string>());

  // Fire onUploaded exactly once per completed entry.
  for (const entry of entries) {
    if (entry.status === 'done' && entry.media && !notifiedRef.current.has(entry.id)) {
      notifiedRef.current.add(entry.id);
      onUploaded?.(entry.media);
    }
  }

  const acceptFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const rejected: string[] = [];
      const accepted: { file: File; contentType: AllowedUploadContentType }[] = [];

      for (const file of Array.from(fileList)) {
        if (accept.includes(file.type as AllowedUploadContentType)) {
          accepted.push({ file, contentType: file.type as AllowedUploadContentType });
        } else {
          rejected.push(t.rejected(file.name));
        }
      }

      if (rejected.length > 0) setRejections((prev) => [...prev, ...rejected]);
      if (accepted.length > 0) enqueue(accepted);
    },
    [accept, enqueue, t],
  );

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    acceptFiles(event.dataTransfer.files);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div>
      <div
        className={`ph-dropzone${dragActive ? ' ph-dropzone-active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={t.dropHint}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {dragActive ? t.dropActive : t.dropHint}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept.join(',')}
          onChange={(e) => acceptFiles(e.target.files)}
          className="ph-sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {rejections.map((message, i) => (
        <div key={i} className="ph-form-error" role="alert" style={{ marginTop: '0.5rem' }}>
          {message}
        </div>
      ))}

      {entries.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          {entries.map((entry) => (
            <div key={entry.id} className="ph-upload-row">
              <span
                style={{
                  minWidth: '10rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.filename}
              </span>
              <div
                className="ph-progress"
                role="progressbar"
                aria-valuenow={entry.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={entry.filename}
              >
                <div className="ph-progress-bar" style={{ width: `${entry.progress}%` }} />
              </div>
              <span aria-live="polite">{statusLabel(entry.status, t)}</span>
              {entry.status === 'uploading' || entry.status === 'queued' ? (
                <button type="button" className="ph-btn-outline" onClick={() => cancel(entry.id)}>
                  {t.cancel}
                </button>
              ) : entry.status === 'error' || entry.status === 'cancelled' ? (
                <>
                  <button type="button" className="ph-btn-outline" onClick={() => retry(entry.id)}>
                    {t.retry}
                  </button>
                  <button
                    type="button"
                    className="ph-icon-btn"
                    aria-label={t.dismiss}
                    onClick={() => dismiss(entry.id)}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ph-icon-btn"
                  aria-label={t.dismiss}
                  onClick={() => dismiss(entry.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
