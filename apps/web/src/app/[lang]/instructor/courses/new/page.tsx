'use client';

// docs/16-API-CONTRACT.md POST /courses — `course:create` permission
// (instructor/content_editor/superadmin per prisma/seed.ts, see
// constants/routes.ts's INSTRUCTOR_ROLES comment).
//
// REAL BACKEND GAP: `categoryId` is required by the DTO but no endpoint
// anywhere in the real backend lists valid categories for an instructor
// to choose from (CategoriesModule has no controller; the only
// `/categories`-shaped route is the Marketplace-scoped
// `GET /marketplace/categories`, out of this phase's bounds). This form
// therefore takes a raw category ID text field with an explicit warning,
// not a dropdown — inventing a dropdown backed by guessed IDs would be
// exactly the kind of mock data this phase must not produce.

import { useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../../../guards/RequireRole';
import { useCreateCourse } from '../../../../../hooks/useInstructorCourses';
import { getErrorMessage } from '../../../../../utils/errors';
import { ROUTES, withLang, INSTRUCTOR_ROLES } from '../../../../../constants/routes';

const COPY = {
  ar: {
    title: 'إنشاء دورة جديدة',
    subtitle: 'ستبدأ الدورة كمسودة. يمكنك تعديلها وإرسالها للمراجعة لاحقًا.',
    courseTitle: 'عنوان الدورة',
    description: 'الوصف',
    categoryId: 'معرّف التصنيف (Category ID)',
    categoryWarning: 'لا توجد واجهة برمجية في الخادم لعرض قائمة التصنيفات المتاحة. أدخل معرّف تصنيف موجود بالفعل — قيمة غير صحيحة ستؤدي إلى رفض الطلب من الخادم.',
    priceCents: 'السعر (بالسنت، اختياري)',
    create: 'إنشاء الدورة',
    creating: 'جارٍ الإنشاء...',
  },
  en: {
    title: 'Create a new course',
    subtitle: 'The course starts as a draft. You can edit it and submit it for review later.',
    courseTitle: 'Course title',
    description: 'Description',
    categoryId: 'Category ID',
    categoryWarning: 'No backend endpoint lists available categories. Enter an existing category ID — an invalid value will be rejected by the server.',
    priceCents: 'Price (cents, optional)',
    create: 'Create course',
    creating: 'Creating...',
  },
} as const;

function CreateCourseContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const router = useRouter();
  const { mutate, isPending, error: mutationError } = useCreateCourse();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceCents, setPriceCents] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutate(
      {
        title,
        description: description || undefined,
        categoryId,
        priceCents: priceCents ? Number(priceCents) : undefined,
      },
      {
        onSuccess: (result) => {
          if (!result.error) {
            router.replace(withLang(ROUTES.instructorCourseEdit, locale).replace('[id]', result.data.id));
          }
        },
      },
    );
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        <form className="ph-form" onSubmit={handleSubmit} noValidate>
          {mutationError && <div className="ph-form-error" role="alert">{getErrorMessage(mutationError)}</div>}

          <div className="ph-field">
            <label className="ph-label" htmlFor="title">{t.courseTitle}</label>
            <input id="title" className="ph-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="ph-field">
            <label className="ph-label" htmlFor="description">{t.description}</label>
            <textarea id="description" className="ph-input" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="ph-field">
            <label className="ph-label" htmlFor="categoryId">{t.categoryId}</label>
            <input id="categoryId" className="ph-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required />
            <p className="ph-form-error" style={{ marginTop: '0.5rem' }} role="note">{t.categoryWarning}</p>
          </div>

          <div className="ph-field">
            <label className="ph-label" htmlFor="priceCents">{t.priceCents}</label>
            <input id="priceCents" type="number" min={0} className="ph-input" value={priceCents} onChange={(e) => setPriceCents(e.target.value)} />
          </div>

          <button type="submit" className="ph-btn-grad" disabled={isPending}>
            {isPending ? t.creating : t.create}
          </button>
        </form>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <RequireRole roles={[...INSTRUCTOR_ROLES]}>
      <CreateCourseContent />
    </RequireRole>
  );
}
