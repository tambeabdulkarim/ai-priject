'use client';

// Type-aware preview: image, video, audio, document, unknown — each with
// a graceful fallback when there's no signed URL yet (still loading,
// lazy-not-yet-visible, or the fetch failed). Never renders a broken
// <img>/<video> tag — always a real icon+label fallback instead.

import { useSignedFileUrl } from '../../hooks/useSignedFileUrl';
import { useInView } from '../../hooks/useInView';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    unavailable: 'المعاينة غير متاحة',
    document: 'مستند',
    unknown: 'ملف',
  },
  en: {
    loading: 'Loading...',
    unavailable: 'Preview unavailable',
    document: 'Document',
    unknown: 'File',
  },
} as const;

export interface MediaPreviewProps {
  fileId: string;
  mimeType: string;
  filename: string;
  locale: 'ar' | 'en';
  /** Skips the lazy IntersectionObserver gate — for a single, already-visible detail view (e.g. inside the Picker's selected-item panel), not a grid of many cards. */
  eager?: boolean;
  className?: string;
}

function kindFromMimeType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'unknown' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf' || mimeType === 'application/zip') return 'document';
  return 'unknown';
}

export function MediaPreview({
  fileId,
  mimeType,
  filename,
  locale,
  eager,
  className,
}: MediaPreviewProps) {
  const t = COPY[locale] ?? COPY.ar;
  const { ref, inView } = useInView<HTMLDivElement>();
  const shouldLoad = eager || inView;
  const signed = useSignedFileUrl(fileId, shouldLoad);
  const kind = kindFromMimeType(mimeType);

  return (
    <div ref={ref} className={className ?? 'ph-media-thumb'} aria-label={filename}>
      {!shouldLoad || signed.isLoading ? (
        <span className="ph-media-thumb-icon" aria-hidden="true">
          ⏳
        </span>
      ) : signed.isError || !signed.data ? (
        <span
          className="ph-media-thumb-icon"
          role="img"
          aria-label={t.unavailable}
          title={t.unavailable}
        >
          ⚠️
        </span>
      ) : kind === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL is short-lived/dynamic, not a static asset Next's Image optimizer should cache.
        <img src={signed.data.signedUrl} alt={filename} loading="lazy" />
      ) : kind === 'video' ? (
        <video src={signed.data.signedUrl} controls preload="metadata" aria-label={filename} />
      ) : kind === 'audio' ? (
        <audio
          src={signed.data.signedUrl}
          controls
          aria-label={filename}
          style={{ width: '100%' }}
        />
      ) : kind === 'document' ? (
        <span className="ph-media-thumb-icon" role="img" aria-label={t.document} title={filename}>
          📄
        </span>
      ) : (
        <span className="ph-media-thumb-icon" role="img" aria-label={t.unknown} title={filename}>
          📎
        </span>
      )}
    </div>
  );
}
