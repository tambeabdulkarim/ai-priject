'use client';

// Modal: select an existing uploaded Media asset, or upload a new one and
// have it selected automatically on completion. Returns the real
// `MediaListItem` object via `onSelect` — callers (e.g. the Course
// Editor) read `.id` for `videoMediaId`, never invent an id themselves.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { AllowedUploadContentType } from '@phoenix/types';
import { useMyMedia } from '../../hooks/useMedia';
import { MediaPreview } from './MediaPreview';
import { MediaUploader } from './MediaUploader';
import { getErrorMessage } from '../../utils/errors';

const COPY = {
  ar: {
    title: 'اختر وسائط',
    tabExisting: 'الموجودة',
    tabUpload: 'رفع جديد',
    search: 'ابحث بالاسم...',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر التحميل.',
    empty: 'لا توجد وسائط مطابقة.',
    loadMore: 'تحميل المزيد...',
    select: 'اختيار',
    cancel: 'إلغاء',
    close: 'إغلاق',
  },
  en: {
    title: 'Select media',
    tabExisting: 'Existing',
    tabUpload: 'Upload new',
    search: 'Search by name...',
    loading: 'Loading...',
    error: 'Couldn’t load.',
    empty: 'No matching media.',
    loadMore: 'Load more...',
    select: 'Select',
    cancel: 'Cancel',
    close: 'Close',
  },
} as const;

export interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  /** Only `id` is guaranteed across both tabs (Existing returns the richer `MediaListItem`; Upload returns the raw `completeUpload` response's minimal `media` field) — callers needing only the id (e.g. `videoMediaId`) work either way. */
  onSelect: (media: { id: string }) => void;
  locale: 'ar' | 'en';
  /** Restricts both the browse list and the upload tab to one media type — the Course Editor's video-lesson use case passes `'video'`. */
  mediaType?: 'video' | 'image' | 'audio';
  uploadAccept?: readonly AllowedUploadContentType[];
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  locale,
  mediaType,
  uploadAccept,
}: MediaPickerProps) {
  const t = COPY[locale] ?? COPY.ar;
  const [tab, setTab] = useState<'existing' | 'upload'>('existing');
  const [search, setSearch] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const library = useMyMedia({ q: search || undefined, mediaType });
  const items = library.data?.pages.flatMap((page) => page.items) ?? [];

  // Focus management: move focus into the dialog on open, restore it to
  // whatever triggered the picker on close (accessibility requirement —
  // a modal must not strand keyboard/screen-reader focus).
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      modalRef.current?.focus();
    } else {
      previouslyFocused.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  }

  function handleSelect(item: { id: string }) {
    onSelect(item);
    onClose();
  }

  return (
    <div className="ph-modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="ph-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ph-modal-header">
          <h2 id="media-picker-title" className="ph-catalogue-card-title" style={{ margin: 0 }}>
            {t.title}
          </h2>
          <button type="button" className="ph-icon-btn" aria-label={t.close} onClick={onClose}>
            ✕
          </button>
        </div>

        <div
          className="ph-form"
          style={{ flexDirection: 'row', gap: '0.5rem', marginBottom: '1rem' }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'existing'}
            className={tab === 'existing' ? 'ph-btn-grad' : 'ph-btn-outline'}
            onClick={() => setTab('existing')}
          >
            {t.tabExisting}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'upload'}
            className={tab === 'upload' ? 'ph-btn-grad' : 'ph-btn-outline'}
            onClick={() => setTab('upload')}
          >
            {t.tabUpload}
          </button>
        </div>

        {tab === 'existing' ? (
          <div role="tabpanel">
            <input
              className="ph-input"
              type="search"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t.search}
              style={{ marginBottom: '1rem' }}
            />

            {library.isLoading && <p className="ph-state">{t.loading}</p>}
            {library.isError && <p className="ph-state">{getErrorMessage(library.error)}</p>}
            {library.data && items.length === 0 && <p className="ph-state">{t.empty}</p>}

            <div
              className="ph-grid"
              style={{ marginTop: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ph-catalogue-card ph-media-card"
                  onClick={() => handleSelect(item)}
                  aria-label={`${t.select}: ${item.originalFilename}`}
                >
                  <MediaPreview
                    fileId={item.fileId}
                    mimeType={item.mimeType}
                    filename={item.originalFilename}
                    locale={locale}
                  />
                  <div className="ph-catalogue-card-title" style={{ fontSize: '0.85rem' }}>
                    {item.originalFilename}
                  </div>
                </button>
              ))}
            </div>

            {library.hasNextPage && (
              <button
                type="button"
                className="ph-btn-outline"
                style={{ marginTop: '1rem' }}
                onClick={() => library.fetchNextPage()}
                disabled={library.isFetchingNextPage}
              >
                {t.loadMore}
              </button>
            )}
          </div>
        ) : (
          <div role="tabpanel">
            <MediaUploader locale={locale} accept={uploadAccept} onUploaded={handleSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
