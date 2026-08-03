'use client';

// Course Review — reuses hooks/useCourses.ts's `useCourse(slug)` (built
// for the public course-detail view; the owning-instructor/editorial
// server-side visibility rule already applies, but a plain `moderator`
// is neither the owner nor `content_editor`/`admin` — see the gap note
// below).
//
// REAL BACKEND GAPS, not worked around:
//  - No reject/request-changes endpoint exists anywhere in the real
//    backend. The only ways to move a course out of `in_review` are
//    `publish` (course:publish — content_editor/admin/superadmin only,
//    NOT moderator) or `archive` (ownership-or-editorial — also not
//    satisfied by a plain moderator). A moderator can therefore only
//    ever VIEW a submitted course here, never act on it; the Publish
//    button is shown only to roles that actually hold `course:publish`.
//  - GET /courses/:slug does not join instructor display info — only
//    the raw `instructorId` FK is available, shown as-is.

import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../../../guards/RequireRole';
import { useAuth } from '../../../../../hooks/useAuth';
import { useCourse } from '../../../../../hooks/useCourses';
import { usePublishCourseReview } from '../../../../../hooks/useModeration';
import { getErrorMessage } from '../../../../../utils/errors';
import { MODERATOR_ROLES, COURSE_PUBLISH_ROLES } from '../../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    notFound: 'لم يتم العثور على الدورة.',
    instructor: 'معرّف المدرّس',
    status: { draft: 'مسودة', in_review: 'قيد المراجعة', published: 'منشورة', archived: 'مؤرشفة' } as Record<string, string>,
    publish: 'نشر الدورة',
    publishing: 'جارٍ النشر...',
    published: 'تم نشر الدورة.',
    noAction: 'لا يمكنك تنفيذ أي إجراء على هذه الدورة. صلاحية النشر (course:publish) مقتصرة على content_editor/admin. لا يوجد إجراء "رفض" في الخادم الحقيقي — الخيار الوحيد لإخراج الدورة من قيد المراجعة غير النشر هو الأرشفة، وهي مقتصرة على المالك أو فريق التحرير أيضًا.',
    modules: 'الوحدات',
    lessons: 'الدروس',
  },
  en: {
    loading: 'Loading...',
    notFound: 'Course not found.',
    instructor: 'Instructor ID',
    status: { draft: 'Draft', in_review: 'In review', published: 'Published', archived: 'Archived' } as Record<string, string>,
    publish: 'Publish course',
    publishing: 'Publishing...',
    published: 'Course published.',
    noAction: 'You cannot act on this course. The publish permission (course:publish) is restricted to content_editor/admin. There is no "reject" action on the real backend — the only way out of review besides publishing is archiving, which is also restricted to the owner or editorial roles.',
    modules: 'Modules',
    lessons: 'Lessons',
  },
} as const;

function CourseReviewContent() {
  const params = useParams<{ lang: string; slug: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { hasAnyRole } = useAuth();
  const { data: course, isLoading, isError } = useCourse(params.slug);
  const publish = usePublishCourseReview();

  const canPublish = hasAnyRole([...COURSE_PUBLISH_ROLES]);

  if (isLoading) return <p className="ph-state">{t.loading}</p>;
  if (isError || !course) return <p className="ph-state">{t.notFound}</p>;

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{course.title}</h1>
        <p className="ph-page-subtitle">{t.status[course.status] ?? course.status}</p>
        <p>{t.instructor}: {course.instructorId}</p>
        {course.description && <p style={{ marginTop: '0.75rem' }}>{course.description}</p>}

        <div style={{ marginTop: '1.5rem' }}>
          {publish.error && <div className="ph-form-error" role="alert">{getErrorMessage(publish.error)}</div>}
          {publish.isSuccess && !publish.data?.error && <div className="ph-form-success" role="status">{t.published}</div>}

          {course.status === 'in_review' && canPublish && (
            <button type="button" className="ph-btn-grad" onClick={() => publish.mutate(course.id)} disabled={publish.isPending}>
              {publish.isPending ? t.publishing : t.publish}
            </button>
          )}
          {course.status === 'in_review' && !canPublish && (
            <p className="ph-form-error" role="note">{t.noAction}</p>
          )}
        </div>

        <section style={{ marginTop: '2rem' }}>
          <h2 className="ph-catalogue-card-title">{t.modules}</h2>
          {course.modules.map((mod) => (
            <div key={mod.id} className="ph-catalogue-card" style={{ cursor: 'default', marginBottom: '1rem' }}>
              <h3 className="ph-catalogue-card-title">{mod.title}</h3>
              <h4>{t.lessons}</h4>
              <ul>
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id}>{lesson.title} <em>({lesson.contentType})</em></li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function CourseReviewPage() {
  return (
    <RequireRole roles={[...MODERATOR_ROLES]}>
      <CourseReviewContent />
    </RequireRole>
  );
}
