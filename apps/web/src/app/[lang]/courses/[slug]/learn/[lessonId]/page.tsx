'use client';

// Course Learning View — lesson content. docs/16-API-CONTRACT.md
// GET /lessons/:id (entitlement-gated: preview, owning
// instructor/editorial, or active enrollment — enforced entirely
// server-side, this page renders whatever comes back or whatever error
// the server returns, never a client-side guess).
//
// BLOCKED BY DOCUMENTATION: quiz-type lessons (`contentType: 'quiz'`)
// have no documented way to fetch their questions. `Quiz.lessonId ->
// Lesson` is the only real relation (verified in schema.prisma) — there
// is no `quizId` field on the Lesson response, and no
// `GET /quizzes/:id` (or equivalent) endpoint exists anywhere in
// docs/16-API-CONTRACT.md. `POST /progress/quizzes/:quizId/attempts`
// exists, but nothing gives this frontend a quizId to call it with. A
// quiz-taking UI is therefore not built; this page shows the block
// clearly instead of guessing a relation or inventing an endpoint.

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ApiError } from '@phoenix/api-client';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../../../../guards/RequireAuth';
import { useLesson } from '../../../../../../hooks/useLesson';
import { useMediaPlayback } from '../../../../../../hooks/useMedia';
import { useUpdateLessonProgress } from '../../../../../../hooks/useProgress';
import { getErrorMessage } from '../../../../../../utils/errors';
import { ROUTES, withLang } from '../../../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الدرس.',
    forbidden: 'تحتاج إلى تسجيل نشط في هذه الدورة لعرض هذا الدرس.',
    backToCourse: 'العودة إلى الدورة',
    markComplete: 'وضع علامة كمكتمل',
    completing: 'جارٍ الحفظ...',
    completed: 'تم إكمال هذا الدرس.',
    videoProcessing: 'الفيديو قيد المعالجة، حاول مرة أخرى لاحقًا.',
    quizBlocked: 'هذا اختبار — لا يتوفر حاليًا أي واجهة برمجية لجلب أسئلته (غير موثّق في الخادم).',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load this lesson.',
    forbidden: 'You need an active enrollment in this course to view this lesson.',
    backToCourse: 'Back to course',
    markComplete: 'Mark as complete',
    completing: 'Saving...',
    completed: 'This lesson is complete.',
    videoProcessing: 'This video is still processing — check back shortly.',
    quizBlocked: 'This is a quiz — no API exists to fetch its questions yet (undocumented on the backend).',
  },
} as const;

function LessonContent() {
  const params = useParams<{ lang: string; slug: string; lessonId: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: lesson, error, isLoading } = useLesson(params.lessonId);
  const { data: media } = useMediaPlayback(lesson?.contentType === 'video' ? lesson.videoMediaId : null);
  const updateProgress = useUpdateLessonProgress(lesson?.module.course.id ?? '');
  const [justCompleted, setJustCompleted] = useState(false);

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  function handleMarkComplete() {
    updateProgress.mutate(
      { lessonId: params.lessonId, progressPercent: 100 },
      { onSuccess: () => setJustCompleted(true) },
    );
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <Link href={withLang(ROUTES.courseLearn, locale).replace('[slug]', params.slug)} className="ph-form-footer">
          &larr; {t.backToCourse}
        </Link>

        {isLoading && <p className="ph-state">{t.loading}</p>}

        {error instanceof ApiError && (error.code === 'FORBIDDEN' || error.code === 'UNAUTHENTICATED') && (
          <div className="ph-state">
            <AlertTriangle size={24} aria-hidden="true" />
            <p className="ph-state-title">{t.forbidden}</p>
          </div>
        )}
        {error && !(error instanceof ApiError && (error.code === 'FORBIDDEN' || error.code === 'UNAUTHENTICATED' || error.code === 'RESOURCE_NOT_FOUND')) && (
          <p className="ph-state">{getErrorMessage(error)}</p>
        )}

        {lesson && (
          <article>
            <h1 className="ph-page-title">{lesson.title}</h1>

            {lesson.contentType === 'text' && lesson.body && (
              <div className="ph-detail-body">{lesson.body}</div>
            )}

            {lesson.contentType === 'video' && (
              <div className="ph-detail-body">
                {media?.transcodingStatus === 'ready' && media.manifestUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video controls src={media.manifestUrl} style={{ width: '100%', borderRadius: '0.75rem' }} />
                ) : (
                  <p className="ph-state">{t.videoProcessing}</p>
                )}
              </div>
            )}

            {lesson.contentType === 'quiz' && (
              <div className="ph-form-error" role="alert">
                {t.quizBlocked}
              </div>
            )}

            {lesson.contentType !== 'quiz' && (
              <div style={{ marginTop: '2rem' }}>
                {justCompleted ? (
                  <p className="ph-form-success">{t.completed}</p>
                ) : (
                  <button
                    type="button"
                    className="ph-btn-grad"
                    onClick={handleMarkComplete}
                    disabled={updateProgress.isPending}
                  >
                    {updateProgress.isPending ? t.completing : t.markComplete}
                  </button>
                )}
              </div>
            )}
          </article>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function LessonPage() {
  return (
    <RequireAuth>
      <LessonContent />
    </RequireAuth>
  );
}
