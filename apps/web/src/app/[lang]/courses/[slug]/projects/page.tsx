'use client';

// docs/16-API-CONTRACT.md GET /courses/:slug (for the course id/title) +
// GET /courses/:courseId/projects, via hooks/useCourses.ts + useProjects.ts.
// Public — matches the course detail page's own visibility.

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import { ApiError } from '@phoenix/api-client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { type Locale } from '@/lib/i18n';
import { useCourse } from '../../../../../hooks/useCourses';
import { useProjectsForCourse } from '../../../../../hooks/useProjects';
import { getErrorMessage } from '../../../../../utils/errors';
import { ROUTES, withLang } from '../../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل المشاريع.',
    empty: 'لا توجد مشاريع عملية لهذه الدورة بعد.',
    backToCourse: 'العودة إلى الدورة',
    projectsFor: 'المشاريع العملية لدورة',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load projects.',
    empty: 'No practical projects exist for this course yet.',
    backToCourse: 'Back to course',
    projectsFor: 'Practical projects for',
  },
} as const;

export default function CourseProjectsPage() {
  const params = useParams<{ lang: string; slug: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: course, error: courseError, isLoading: courseLoading } = useCourse(params.slug);
  const {
    data: projects,
    error: projectsError,
    isLoading: projectsLoading,
  } = useProjectsForCourse(course?.id ?? '');

  if (courseError instanceof ApiError && courseError.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  const isLoading = courseLoading || (Boolean(course) && projectsLoading);
  const error = courseError ?? projectsError;

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <Link
          href={withLang(ROUTES.courseDetail, locale).replace('[slug]', params.slug)}
          className="ph-form-footer"
        >
          &larr; {t.backToCourse}
        </Link>

        {isLoading && <SkeletonGrid count={4} />}
        {error && !(error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') && (
          <p className="ph-state">{getErrorMessage(error)}</p>
        )}

        {course && !isLoading && (
          <>
            <header className="ph-detail-header">
              <h1 className="ph-page-title">
                {t.projectsFor} {course.title}
              </h1>
            </header>

            {(projects?.length ?? 0) === 0 && (
              <EmptyState icon={<FolderKanban size={24} strokeWidth={1.5} />} title={t.empty} />
            )}

            <div className="ph-grid">
              {projects?.map((project) => (
                <Link
                  key={project.id}
                  href={withLang(ROUTES.courseProjectDetail, locale)
                    .replace('[slug]', params.slug)
                    .replace('[projectId]', project.id)}
                  className="ph-catalogue-card"
                >
                  <h2 className="ph-catalogue-card-title">{project.title}</h2>
                  {project.description && (
                    <p className="ph-catalogue-card-desc">{project.description}</p>
                  )}
                  <div className="ph-catalogue-card-meta">
                    <StatusBadge status={project.status} locale={locale} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
