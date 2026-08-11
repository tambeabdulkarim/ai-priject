'use client';

// Media Library — Phase 13.3. Grid/list view of the current instructor's
// own uploaded media (GET /media/me, owner-scoped — see
// media.repository.ts's own comment on why there is no cross-user "view
// all" mode). Search and media-type filter are both real, server-side
// (query params on the same endpoint), not client-side post-filtering.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trash2, Grid, List as ListIcon, FolderOpen } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../../guards/RequireRole';
import { useMyMedia, useDeleteMediaFile } from '../../../../hooks/useMedia';
import { MediaPreview } from '../../../../components/media/MediaPreview';
import { MediaUploader } from '../../../../components/media/MediaUploader';
import { getErrorMessage } from '../../../../utils/errors';
import { INSTRUCTOR_ROLES } from '../../../../constants/routes';
import type { MediaListItem } from '@phoenix/types';

const COPY = {
  ar: {
    title: 'مكتبة الوسائط',
    subtitle: 'كل الوسائط التي رفعتها — قابلة لإعادة الاستخدام في أي دورة.',
    search: 'ابحث بالاسم...',
    allTypes: 'كل الأنواع',
    video: 'فيديو',
    image: 'صورة',
    audio: 'صوت',
    grid: 'عرض شبكي',
    list: 'عرض قائمة',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل مكتبة الوسائط.',
    empty: 'لا توجد أي وسائط بعد. ارفع ملفًا للبدء.',
    loadMore: 'تحميل المزيد...',
    delete: 'حذف',
    deleteConfirm: 'حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.',
    status: {
      pending: 'قيد المعالجة',
      processing: 'قيد المعالجة',
      ready: 'جاهز',
      failed: 'فشلت المعالجة',
    } as Record<string, string>,
  },
  en: {
    title: 'Media Library',
    subtitle: 'Every media asset you’ve uploaded — reusable across any course.',
    search: 'Search by name...',
    allTypes: 'All types',
    video: 'Video',
    image: 'Image',
    audio: 'Audio',
    grid: 'Grid view',
    list: 'List view',
    loading: 'Loading...',
    error: 'Couldn’t load the media library.',
    empty: 'No media uploaded yet. Upload a file to get started.',
    loadMore: 'Load more...',
    delete: 'Delete',
    deleteConfirm: 'Delete this file? This cannot be undone.',
    status: {
      pending: 'Processing',
      processing: 'Processing',
      ready: 'Ready',
      failed: 'Processing failed',
    } as Record<string, string>,
  },
} as const;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function MediaLibraryContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'audio' | undefined>(undefined);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const library = useMyMedia({ q: debouncedSearch || undefined, mediaType });
  const deleteFile = useDeleteMediaFile();
  const items = library.data?.pages.flatMap((page) => page.items) ?? [];

  function handleDelete(item: MediaListItem) {
    // eslint-disable-next-line no-alert -- a real confirm before an irreversible delete; matches this app's existing pattern of not building a custom modal for a single yes/no gate.
    if (window.confirm(t.deleteConfirm)) {
      deleteFile.mutate(item.fileId);
    }
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        <MediaUploader locale={locale} />

        <div className="ph-media-toolbar">
          <div className="ph-filters" style={{ marginTop: 0 }}>
            <input
              className="ph-input"
              type="search"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t.search}
            />
            <select
              className="ph-input"
              value={mediaType ?? ''}
              onChange={(e) => setMediaType((e.target.value || undefined) as typeof mediaType)}
              aria-label={t.allTypes}
            >
              <option value="">{t.allTypes}</option>
              <option value="video">{t.video}</option>
              <option value="image">{t.image}</option>
              <option value="audio">{t.audio}</option>
            </select>
          </div>
          <div className="ph-view-toggle" role="group" aria-label={`${t.grid} / ${t.list}`}>
            <button
              type="button"
              className={view === 'grid' ? 'ph-btn-grad' : 'ph-btn-outline'}
              aria-pressed={view === 'grid'}
              aria-label={t.grid}
              onClick={() => setView('grid')}
            >
              <Grid size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={view === 'list' ? 'ph-btn-grad' : 'ph-btn-outline'}
              aria-pressed={view === 'list'}
              aria-label={t.list}
              onClick={() => setView('list')}
            >
              <ListIcon size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>

        {library.isLoading && <p className="ph-state">{t.loading}</p>}
        {library.isError && <p className="ph-state">{getErrorMessage(library.error)}</p>}
        {library.data && items.length === 0 && (
          <EmptyState icon={<FolderOpen size={24} strokeWidth={1.5} />} title={t.empty} />
        )}

        {view === 'grid' ? (
          <div className="ph-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className="ph-catalogue-card ph-media-card"
                style={{ cursor: 'default' }}
              >
                <MediaPreview
                  fileId={item.fileId}
                  mimeType={item.mimeType}
                  filename={item.originalFilename}
                  locale={locale}
                />
                <div className="ph-catalogue-card-title" style={{ fontSize: '0.95rem' }}>
                  {item.originalFilename}
                </div>
                <div className="ph-catalogue-card-meta">
                  <span>{t.status[item.transcodingStatus] ?? item.transcodingStatus}</span>
                  <button
                    type="button"
                    className="ph-icon-btn"
                    aria-label={`${t.delete}: ${item.originalFilename}`}
                    onClick={() => handleDelete(item)}
                    disabled={deleteFile.isPending}
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '1.5rem' }}>
            {items.map((item) => (
              <div key={item.id} className="ph-media-list-row">
                <MediaPreview
                  fileId={item.fileId}
                  mimeType={item.mimeType}
                  filename={item.originalFilename}
                  locale={locale}
                />
                <span style={{ flex: 1 }}>{item.originalFilename}</span>
                <span className="ph-catalogue-card-meta">
                  {t.status[item.transcodingStatus] ?? item.transcodingStatus}
                </span>
                <button
                  type="button"
                  className="ph-icon-btn"
                  aria-label={`${t.delete}: ${item.originalFilename}`}
                  onClick={() => handleDelete(item)}
                  disabled={deleteFile.isPending}
                >
                  <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        {deleteFile.isError && (
          <div className="ph-form-error" role="alert" style={{ marginTop: '1rem' }}>
            {getErrorMessage(deleteFile.error)}
          </div>
        )}

        {library.hasNextPage && (
          <button
            type="button"
            className="ph-btn-outline"
            style={{ marginTop: '1.5rem' }}
            onClick={() => library.fetchNextPage()}
            disabled={library.isFetchingNextPage}
          >
            {t.loadMore}
          </button>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function MediaLibraryPage() {
  return (
    <RequireRole roles={[...INSTRUCTOR_ROLES]}>
      <MediaLibraryContent />
    </RequireRole>
  );
}
