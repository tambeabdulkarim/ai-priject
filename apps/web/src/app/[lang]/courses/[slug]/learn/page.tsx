'use client';

// Course Learning View — overview. Reuses hooks/useCourses.ts's
// useCourse (same GET /courses/:slug the public course-detail page uses
// — draft/redaction rules are identical, no separate "learner" variant
// exists on the backend) plus GET /progress/courses/:courseId to overlay
// per-lesson completion. Locked-lesson logic mirrors the public course
// detail page exactly (only text lessons carry an unambiguous `body:
// null` redaction signal — see that page's own comment for why video/
// quiz lessons aren't marked locked from this response alone).

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Circle, Lock, PlayCircle, FileText, HelpCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ApiError } from '@phoenix/api-client';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../../../guards/RequireAuth';
import { useCourse } from '../../../../../hooks/useCourses';
import { useCourseProgress } from '../../../../../hooks/useProgress';
import { getErrorMessage } from '../../../../../utils/errors';
import { ROUTES, withLang } from '../../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الدورة.',
    locked: 'مقفل',
    progress: 'التقدم',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load this course.',
    locked: 'Locked',
    progress: 'Progress',
  },
} as const;

const CONTENT_ICON = { video: PlayCircle, text: FileText, quiz: HelpCircle } as const;

function LearnOverviewContent() {
  const params = useParams<{ lang: string; slug: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: course, error, isLoading } = useCourse(params.slug);
  const { data: progress } = useCourseProgress(course?.id ?? '');

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  const progressByLessonId = new Map((progress?.lessons ?? []).map((p) => [p.lessonId, p]));

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        {isLoading && <p className="ph-state">{t.loading}</p>}
        {error && !(error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') && (
          <p className="ph-state">{getErrorMessage(error)}</p>
        )}

        {course && (
          <>
            <header className="ph-detail-header">
              <h1 className="ph-page-title">{course.title}</h1>
              {typeof progress?.completionPercent === 'number' && (
                <div className="ph-detail-meta">
                  <span>
                    {t.progress}: {progress.completionPercent}%
                  </span>
                </div>
              )}
            </header>

            {course.modules.map((module_) => (
              <div key={module_.id} className="ph-module">
                <div className="ph-module-title">{module_.title}</div>
                {module_.lessons.map((lesson) => {
                  const Icon = CONTENT_ICON[lesson.contentType];
                  const isLocked =
                    !lesson.isPreview && lesson.contentType === 'text' && lesson.body === null;
                  const lessonProgress = progressByLessonId.get(lesson.id);
                  const isComplete = Boolean(lessonProgress?.completedAt);

                  return (
                    <div key={lesson.id} className="ph-lesson-row">
                      {isLocked ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Icon size={16} strokeWidth={2} aria-hidden="true" />
                          {lesson.title}
                        </span>
                      ) : (
                        <Link
                          href={withLang(ROUTES.lessonLearn, locale)
                            .replace('[slug]', params.slug)
                            .replace('[lessonId]', lesson.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'inherit',
                          }}
                        >
                          <Icon size={16} strokeWidth={2} aria-hidden="true" />
                          {lesson.title}
                        </Link>
                      )}
                      {isLocked ? (
                        <span
                          className="ph-lesson-locked"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Lock size={12} strokeWidth={2} aria-hidden="true" />
                          {t.locked}
                        </span>
                      ) : isComplete ? (
                        <CheckCircle2
                          size={16}
                          strokeWidth={2}
                          color="var(--accent-cyan)"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          size={16}
                          strokeWidth={2}
                          className="ph-lesson-locked"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function LearnOverviewPage() {
  return (
    <RequireAuth>
      <LearnOverviewContent />
    </RequireAuth>
  );
}
