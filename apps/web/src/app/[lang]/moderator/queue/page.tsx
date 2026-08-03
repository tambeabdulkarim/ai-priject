'use client';

// Moderation Queue — GET /admin/moderation/queue (`moderation:read`).
//
// content_type filter mirrors the backend's own two supported values
// (`course`/`comment`) exactly — MODERATION_CONTENT_TYPES in
// list-moderation-queue-query.dto.ts allows nothing else. The "all"
// filter is real (omitting content_type) but the backend's own
// documented Phase 13 fix caps that combined view to each list's first
// page only — reflected here by "Load more" simply not appearing for
// that view once no `nextCursor` comes back, not by any client-side
// invention.
//
// Comment decisions (approve/hide) require a non-empty `reason` per the
// real DTO (ModerationDecisionDto) — enforced here client-side to avoid
// a round-trip 400, and the server's actual validation error is still
// displayed verbatim on failure.

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../../guards/RequireRole';
import { useModerationQueue, useDecideComment } from '../../../../hooks/useModeration';
import { getErrorMessage } from '../../../../utils/errors';
import { ROUTES, withLang, MODERATOR_ROLES } from '../../../../constants/routes';
import type { ModerationContentType } from '@phoenix/types';

const COPY = {
  ar: {
    title: 'قائمة المراجعة',
    filterAll: 'الكل',
    filterCourses: 'الدورات',
    filterComments: 'التعليقات',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر التحميل.',
    empty: 'لا توجد عناصر.',
    loadMore: 'تحميل المزيد...',
    review: 'مراجعة الدورة',
    reasonPlaceholder: 'سبب القرار (مطلوب)',
    approve: 'موافقة',
    hide: 'إخفاء',
    submitting: 'جارٍ الإرسال...',
    reasonRequired: 'السبب مطلوب لتسجيل أي قرار.',
    status: { visible: 'ظاهر', hidden: 'مخفي', flagged: 'مبلّغ عنه', in_review: 'قيد المراجعة' } as Record<string, string>,
  },
  en: {
    title: 'Moderation queue',
    filterAll: 'All',
    filterCourses: 'Courses',
    filterComments: 'Comments',
    loading: 'Loading...',
    error: 'Couldn’t load.',
    empty: 'No items.',
    loadMore: 'Load more...',
    review: 'Review course',
    reasonPlaceholder: 'Decision reason (required)',
    approve: 'Approve',
    hide: 'Hide',
    submitting: 'Submitting...',
    reasonRequired: 'A reason is required to record any decision.',
    status: { visible: 'visible', hidden: 'hidden', flagged: 'flagged', in_review: 'in review' } as Record<string, string>,
  },
} as const;

type Copy = (typeof COPY)[keyof typeof COPY];

function CommentDecisionRow({ commentId, body, t }: { commentId: string; body: string; t: Copy }) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const decide = useDecideComment();

  function handleDecision(event: FormEvent, decision: 'approve' | 'hide') {
    event.preventDefault();
    if (!reason.trim()) {
      setLocalError(t.reasonRequired);
      return;
    }
    setLocalError(null);
    decide.mutate(
      { id: commentId, decision, reason },
      { onSuccess: (result) => { if (!result.error) setReason(''); } },
    );
  }

  return (
    <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
      <p>{body}</p>
      <form className="ph-form" onSubmit={(e) => handleDecision(e, 'approve')} noValidate>
        {(localError || decide.error) && (
          <div className="ph-form-error" role="alert">{localError ?? getErrorMessage(decide.error)}</div>
        )}
        <input
          className="ph-input"
          placeholder={t.reasonPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="ph-btn-grad" disabled={decide.isPending}>
            {decide.isPending ? t.submitting : t.approve}
          </button>
          <button type="button" className="ph-btn-outline" disabled={decide.isPending} onClick={(e) => handleDecision(e, 'hide')}>
            {decide.isPending ? t.submitting : t.hide}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModerationQueueContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;

  const [filter, setFilter] = useState<ModerationContentType | undefined>(undefined);
  const queue = useModerationQueue(filter);

  const courseItems = queue.data?.pages.flatMap((page) => page.courses?.items ?? []) ?? [];
  const commentItems = queue.data?.pages.flatMap((page) => page.comments?.items ?? []) ?? [];

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>

        <div className="ph-form" style={{ flexDirection: 'row', gap: '0.5rem' }}>
          <button type="button" className={filter === undefined ? 'ph-btn-grad' : 'ph-btn-outline'} onClick={() => setFilter(undefined)}>{t.filterAll}</button>
          <button type="button" className={filter === 'course' ? 'ph-btn-grad' : 'ph-btn-outline'} onClick={() => setFilter('course')}>{t.filterCourses}</button>
          <button type="button" className={filter === 'comment' ? 'ph-btn-grad' : 'ph-btn-outline'} onClick={() => setFilter('comment')}>{t.filterComments}</button>
        </div>

        {queue.isLoading && <p className="ph-state">{t.loading}</p>}
        {queue.isError && <p className="ph-state">{getErrorMessage(queue.error)}</p>}
        {queue.data && courseItems.length === 0 && commentItems.length === 0 && <p className="ph-state">{t.empty}</p>}

        {courseItems.length > 0 && (
          <div className="ph-grid" style={{ marginTop: '1.5rem' }}>
            {courseItems.map((course) => (
              <Link key={course.id} href={withLang(ROUTES.moderatorCourseReview, locale).replace('[slug]', course.slug)} className="ph-catalogue-card">
                <h3 className="ph-catalogue-card-title">{course.title}</h3>
                <div className="ph-catalogue-card-meta">{t.status[course.status] ?? course.status}</div>
                <p className="ph-catalogue-card-desc">{t.review}</p>
              </Link>
            ))}
          </div>
        )}

        {commentItems.length > 0 && (
          <div className="ph-form" style={{ marginTop: '1.5rem', gap: '1rem' }}>
            {commentItems.map((comment) => (
              <CommentDecisionRow key={comment.id} commentId={comment.id} body={comment.body} t={t} />
            ))}
          </div>
        )}

        {queue.hasNextPage && (
          <button type="button" className="ph-btn-outline" style={{ marginTop: '1.5rem' }} onClick={() => queue.fetchNextPage()} disabled={queue.isFetchingNextPage}>
            {t.loadMore}
          </button>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function ModerationQueuePage() {
  return (
    <RequireRole roles={[...MODERATOR_ROLES]}>
      <ModerationQueueContent />
    </RequireRole>
  );
}
