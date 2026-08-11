'use client';

// Course Learning View — lesson content. docs/16-API-CONTRACT.md
// GET /lessons/:id (entitlement-gated: preview, owning
// instructor/editorial, or active enrollment — enforced entirely
// server-side, this page renders whatever comes back or whatever error
// the server returns, never a client-side guess).
//
// Phase 28: the quiz block below is resolved — GET /lessons/:id now
// returns `quizId` and a real `GET /progress/quizzes/:quizId` exists
// (both added this phase, approved before implementation; see
// docs/phase28-frontend-education-plan.md). Prev/next navigation is
// computed from the parent course's already-fetched, already-ordered
// module/lesson list (useCourse) — no new endpoint needed for that part.

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ApiError } from '@phoenix/api-client';
import { type Locale } from '@/lib/i18n';
import { QuizRunner } from '@/components/education/QuizRunner';
import { RequireAuth } from '../../../../../../guards/RequireAuth';
import { useLesson } from '../../../../../../hooks/useLesson';
import { useCourse } from '../../../../../../hooks/useCourses';
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
    quizMissing: 'هذا الدرس اختبار لكن لم يُعثر على اختبار مرتبط به.',
    prevLesson: 'الدرس السابق',
    nextLesson: 'الدرس التالي',
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
    quizMissing: 'This lesson is a quiz, but no linked quiz was found.',
    prevLesson: 'Previous lesson',
    nextLesson: 'Next lesson',
  },
} as const;

function LessonContent() {
  const params = useParams<{ lang: string; slug: string; lessonId: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: lesson, error, isLoading } = useLesson(params.lessonId);
  const { data: course } = useCourse(params.slug);
  const { data: media } = useMediaPlayback(
    lesson?.contentType === 'video' ? lesson.videoMediaId : null,
  );
  const updateProgress = useUpdateLessonProgress(lesson?.module.course.id ?? '');
  const [justCompleted, setJustCompleted] = useState(false);

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  // Flatten the course's ordered modules/lessons into one sequence to
  // find this lesson's neighbors — the API already returns both in
  // position order (courses.repository.ts's findBySlug), never re-sorted
  // here.
  const flatLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const currentIndex = flatLessons.findIndex((l) => l.id === params.lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

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
        <Link
          href={withLang(ROUTES.courseLearn, locale).replace('[slug]', params.slug)}
          className="ph-form-footer"
        >
          &larr; {t.backToCourse}
        </Link>

        {isLoading && <p className="ph-state">{t.loading}</p>}

        {error instanceof ApiError &&
          (error.code === 'FORBIDDEN' || error.code === 'UNAUTHENTICATED') && (
            <div className="ph-state">
              <AlertTriangle size={24} aria-hidden="true" />
              <p className="ph-state-title">{t.forbidden}</p>
            </div>
          )}
        {error &&
          !(
            error instanceof ApiError &&
            (error.code === 'FORBIDDEN' ||
              error.code === 'UNAUTHENTICATED' ||
              error.code === 'RESOURCE_NOT_FOUND')
          ) && <p className="ph-state">{getErrorMessage(error)}</p>}

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
                  <video
                    controls
                    src={media.manifestUrl}
                    style={{ width: '100%', borderRadius: '0.75rem' }}
                  />
                ) : (
                  <p className="ph-state">{t.videoProcessing}</p>
                )}
              </div>
            )}

            {lesson.contentType === 'quiz' &&
              (lesson.quizId ? (
                <QuizRunner quizId={lesson.quizId} locale={locale} />
              ) : (
                <div className="ph-form-error" role="alert">
                  {t.quizMissing}
                </div>
              ))}

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

            <nav
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                marginTop: '2.5rem',
                gap: '1rem',
              }}
            >
              {prevLesson ? (
                <Link
                  href={withLang(ROUTES.lessonLearn, locale)
                    .replace('[slug]', params.slug)
                    .replace('[lessonId]', prevLesson.id)}
                  className="ph-btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ChevronLeft size={16} aria-hidden="true" /> {t.prevLesson}
                </Link>
              ) : (
                <span />
              )}
              {nextLesson && (
                <Link
                  href={withLang(ROUTES.lessonLearn, locale)
                    .replace('[slug]', params.slug)
                    .replace('[lessonId]', nextLesson.id)}
                  className="ph-btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {t.nextLesson} <ChevronRight size={16} aria-hidden="true" />
                </Link>
              )}
            </nav>
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
