'use client';

// docs/16-API-CONTRACT.md GET /courses/:slug, via hooks/useCourses.ts.
// Lesson `body: null` means the backend redacted it (not entitled/not
// preview) — rendered here as a locked state, never treated as empty
// content. Draft-course 404 (unauthenticated/non-owner/non-editorial
// viewer) is the real, server-enforced "not found" — this page doesn't
// invent a different message for that case.

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, PlayCircle, FileText, HelpCircle, FolderKanban } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ApiError } from '@phoenix/api-client';
import { type Locale } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useCourse } from '../../../../hooks/useCourses';
import { useCourseProgress } from '../../../../hooks/useProgress';
import { useProjectsForCourse } from '../../../../hooks/useProjects';
import { getErrorMessage } from '../../../../utils/errors';
import { ROUTES, withLang } from '../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الدورة.',
    free: 'مجانًا',
    locked: 'مقفل',
    preview: 'معاينة',
    curriculum: 'محتوى الدورة',
    yourProgress: 'تقدّمك في الدورة',
    projects: 'مشاريع الدورة العملية',
    viewProjects: 'عرض المشاريع',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load this course.',
    free: 'Free',
    locked: 'Locked',
    preview: 'Preview',
    curriculum: 'Curriculum',
    yourProgress: 'Your progress in this course',
    projects: 'Practical projects for this course',
    viewProjects: 'View projects',
  },
} as const;

const CONTENT_ICON = { video: PlayCircle, text: FileText, quiz: HelpCircle } as const;

function formatPrice(cents: number, locale: Locale, freeLabel: string): string {
  if (cents <= 0) return freeLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function CourseDetailPage() {
  const params = useParams<{ lang: string; slug: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: course, error, isLoading } = useCourse(params.slug);
  const { status: authStatus } = useAuth();
  // Progress is only meaningful for an enrolled learner; a 404/403 here
  // (not enrolled) is expected and silently ignored, not surfaced as a
  // page-level error — this section simply doesn't render in that case.
  const { data: progress } = useCourseProgress(
    authStatus === 'authenticated' && course ? course.id : '',
  );
  const { data: projects } = useProjectsForCourse(course?.id ?? '');

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

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
              {course.description && <p className="ph-page-subtitle">{course.description}</p>}
              <div className="ph-detail-meta">
                <span>{formatPrice(course.priceCents, locale, t.free)}</span>
              </div>
            </header>

            {progress && (
              <div className="ph-form-card" style={{ marginBottom: '1.5rem' }}>
                <div className="ph-catalogue-card-meta">
                  <span>
                    {t.yourProgress}: {progress.completionPercent}%
                  </span>
                </div>
                <div className="ph-progress">
                  <div className="ph-progress-bar" style={{ width: `${progress.completionPercent}%` }} />
                </div>
              </div>
            )}

            {projects && projects.length > 0 && (
              <div className="ph-catalogue-card-meta" style={{ marginBottom: '1.5rem' }}>
                <Link
                  href={withLang(ROUTES.courseProjects, locale).replace('[slug]', course.slug)}
                  className="ph-btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FolderKanban size={16} strokeWidth={2} aria-hidden="true" />
                  {t.viewProjects} ({projects.length})
                </Link>
              </div>
            )}

            <h2 className="ph-catalogue-card-title">{t.curriculum}</h2>
            {course.modules.map((module_) => (
              <div key={module_.id} className="ph-module">
                <div className="ph-module-title">{module_.title}</div>
                {module_.lessons.map((lesson) => {
                  const Icon = CONTENT_ICON[lesson.contentType];
                  // The backend only redacts `body` (courses.service.ts's
                  // getBySlug) — that's an unambiguous "locked" signal
                  // solely for text lessons. Video lessons keep
                  // `videoMediaId` populated regardless of entitlement
                  // (actual playback protection lives at GET /media/:id,
                  // out of scope here); quiz lessons never carry a body
                  // at all. Showing a "locked" badge for those two types
                  // from this response alone would be a guess, not a
                  // real signal, so it's only shown for text lessons.
                  const isLocked =
                    !lesson.isPreview && lesson.contentType === 'text' && lesson.body === null;
                  return (
                    <div key={lesson.id} className="ph-lesson-row">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon size={16} strokeWidth={2} aria-hidden="true" />
                        {lesson.title}
                      </span>
                      {lesson.isPreview ? (
                        <span className="ph-lesson-locked">{t.preview}</span>
                      ) : isLocked ? (
                        <span
                          className="ph-lesson-locked"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Lock size={12} strokeWidth={2} aria-hidden="true" />
                          {t.locked}
                        </span>
                      ) : null}
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
