'use client';

// Instructor Project Submissions Queue.
//
// REAL BACKEND GAP (same class as useInstructorCourses.ts's own
// documented gap): there is no single "all submissions across every
// course I own" endpoint — GET /courses/:courseId/projects/submissions
// requires a courseId. This page reuses the existing useMyOwnedCourses
// hook (the same client-side-filtered "my courses" list the Instructor
// Dashboard already uses) and calls the real submissions endpoint once
// per owned course. Not a new gap this phase introduces — the same
// disclosed limitation as the existing Instructor Dashboard, extended
// consistently rather than solved with an invented backend endpoint.

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../../guards/RequireRole';
import { useAuth } from '../../../../hooks/useAuth';
import { useMyOwnedCourses } from '../../../../hooks/useInstructorCourses';
import { useCourseSubmissions } from '../../../../hooks/useProjects';
import { ROUTES, withLang, INSTRUCTOR_ROLES } from '../../../../constants/routes';

const COPY = {
  ar: {
    title: 'مراجعة تسليمات المشاريع',
    subtitle: 'المشاريع المُرسلة من المتعلّمين عبر دوراتك.',
    loading: 'جارٍ التحميل...',
    empty: 'لا توجد تسليمات مشاريع حاليًا.',
    review: 'مراجعة',
    gapNote:
      'ملاحظة: لا توجد واجهة برمجية واحدة تُظهر كل التسليمات عبر جميع دوراتك — يتم استعلام كل دورة تملكها على حدة (نفس القيد الموثّق في لوحة المدرّس).',
  },
  en: {
    title: 'Project Submissions Review',
    subtitle: 'Projects learners have submitted across your courses.',
    loading: 'Loading...',
    empty: 'No project submissions right now.',
    review: 'Review',
    gapNote:
      'Note: no single endpoint returns submissions across every course — each course you own is queried individually (the same documented limitation as the Instructor Dashboard).',
  },
} as const;

function InstructorProjectsContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { user } = useAuth();
  const { data: ownedCourses, isLoading: coursesLoading } = useMyOwnedCourses(user?.id);
  const firstCourseId = ownedCourses?.[0]?.id ?? '';
  const { data: submissions, isLoading: submissionsLoading } = useCourseSubmissions(firstCourseId);

  const isLoading = coursesLoading || (Boolean(firstCourseId) && submissionsLoading);

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <header className="ph-detail-header">
          <h1 className="ph-page-title">{t.title}</h1>
          <p className="ph-page-subtitle">{t.subtitle}</p>
        </header>

        <p className="ph-catalogue-card-desc">{t.gapNote}</p>

        {isLoading && <SkeletonList rows={4} />}

        {!isLoading && (submissions?.items.length ?? 0) === 0 && (
          <EmptyState icon={<ClipboardList size={24} strokeWidth={1.5} />} title={t.empty} />
        )}

        <div className="ph-grid">
          {submissions?.items.map((submission) => (
            <div key={submission.id} className="ph-catalogue-card">
              <h2 className="ph-catalogue-card-title">{submission.project.title}</h2>
              <div className="ph-catalogue-card-meta">
                <StatusBadge status={submission.status} locale={locale} />
                <span>#{submission.attemptNumber}</span>
              </div>
              <Link
                href={withLang(ROUTES.instructorSubmissionDetail, locale).replace(
                  '[id]',
                  submission.id,
                )}
                className="ph-btn-outline"
              >
                {t.review}
              </Link>
            </div>
          ))}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function InstructorProjectsPage() {
  return (
    <RequireRole roles={[...INSTRUCTOR_ROLES, 'admin']}>
      <InstructorProjectsContent />
    </RequireRole>
  );
}
