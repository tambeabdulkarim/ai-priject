'use client';

// Instructor Dashboard. Statistics (draft/published/in-review/archived
// counts) are derived client-side from hooks/useInstructorCourses.ts's
// `useMyOwnedCourses` — see that hook's own comment for the real,
// documented reason (`GET /courses` has no instructor-filter parameter)
// this is a best-effort client-side filter, not a dedicated stats
// endpoint. "Instructor Progress View" (enrollment count, completion %,
// certificates issued) is NOT rendered here — see the note below the
// stats grid: no endpoint anywhere in the real backend exposes
// per-course enrollment counts, aggregate completion, or
// certificates-issued-for-a-course to an instructor. Not invented.

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, FileEdit, Eye, Archive, Plus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../guards/RequireRole';
import { useAuth } from '../../../hooks/useAuth';
import { useMyOwnedCourses } from '../../../hooks/useInstructorCourses';
import { ROUTES, withLang, INSTRUCTOR_ROLES } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'مساحة المدرّس',
    subtitle: 'إدارة دوراتك ومحتواك التعليمي.',
    newCourse: 'دورة جديدة',
    total: 'إجمالي الدورات',
    draft: 'مسودة',
    inReview: 'قيد المراجعة',
    published: 'منشورة',
    archived: 'مؤرشفة',
    yourCourses: 'دوراتك',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل دوراتك.',
    empty: 'لم تنشئ أي دورة بعد.',
    progressBlockedTitle: 'إحصاءات التقدّم غير متاحة',
    progressBlocked: 'لا يوجد أي واجهة برمجية في الخادم لعرض عدد المسجّلين أو نسبة الإكمال أو عدد الشهادات الصادرة لكل دورة. هذه ليست قيودًا في الواجهة الأمامية.',
  },
  en: {
    title: 'Instructor workspace',
    subtitle: 'Manage your courses and content.',
    newCourse: 'New course',
    total: 'Total courses',
    draft: 'Draft',
    inReview: 'In review',
    published: 'Published',
    archived: 'Archived',
    yourCourses: 'Your courses',
    loading: 'Loading...',
    error: 'Couldn’t load your courses.',
    empty: 'You haven’t created any course yet.',
    progressBlockedTitle: 'Progress statistics unavailable',
    progressBlocked: 'No endpoint on the backend exposes per-course enrollment counts, completion percentage, or certificates issued. This is a real backend gap, not a frontend limitation.',
  },
} as const;

function InstructorDashboardContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { user } = useAuth();
  const { data: courses, isLoading, isError } = useMyOwnedCourses(user?.id);

  const counts = {
    draft: courses?.filter((c) => c.status === 'draft').length ?? 0,
    in_review: courses?.filter((c) => c.status === 'in_review').length ?? 0,
    published: courses?.filter((c) => c.status === 'published').length ?? 0,
    archived: courses?.filter((c) => c.status === 'archived').length ?? 0,
  };

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <div className="ph-sec-hdr">
          <div>
            <h1 className="ph-page-title" style={{ marginBottom: 0 }}>{t.title}</h1>
            <p className="ph-page-subtitle">{t.subtitle}</p>
          </div>
          <Link href={withLang(ROUTES.instructorCourseNew, locale)} className="ph-btn-grad">
            <Plus size={16} strokeWidth={2} aria-hidden="true" /> {t.newCourse}
          </Link>
        </div>

        <div className="ph-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <BookOpen size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.total}</div>
            <p className="ph-catalogue-card-desc">{courses?.length ?? 0}</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <FileEdit size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.draft}</div>
            <p className="ph-catalogue-card-desc">{counts.draft}</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <Eye size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.inReview}</div>
            <p className="ph-catalogue-card-desc">{counts.in_review}</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <BookOpen size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.published}</div>
            <p className="ph-catalogue-card-desc">{counts.published}</p>
          </div>
          <div className="ph-catalogue-card" style={{ cursor: 'default' }}>
            <Archive size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.archived}</div>
            <p className="ph-catalogue-card-desc">{counts.archived}</p>
          </div>
        </div>

        <div className="ph-form-error" style={{ marginTop: '2rem' }} role="note">
          <strong>{t.progressBlockedTitle}</strong>
          <p style={{ marginTop: '0.5rem' }}>{t.progressBlocked}</p>
        </div>

        <h2 className="ph-catalogue-card-title" style={{ marginTop: '2.5rem' }}>{t.yourCourses}</h2>
        {isLoading && <p className="ph-state">{t.loading}</p>}
        {isError && <p className="ph-state">{t.error}</p>}
        {!isLoading && !isError && (courses?.length ?? 0) === 0 && <p className="ph-state">{t.empty}</p>}

        <div className="ph-grid">
          {courses?.map((course) => (
            <Link
              key={course.id}
              href={withLang(ROUTES.instructorCourseEdit, locale).replace('[id]', course.id)}
              className="ph-catalogue-card"
            >
              <h3 className="ph-catalogue-card-title">{course.title}</h3>
              <div className="ph-catalogue-card-meta">
                <span>{course.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function InstructorDashboardPage() {
  return (
    <RequireRole roles={[...INSTRUCTOR_ROLES]}>
      <InstructorDashboardContent />
    </RequireRole>
  );
}
