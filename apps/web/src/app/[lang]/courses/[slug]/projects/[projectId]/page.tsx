'use client';

// docs/16-API-CONTRACT.md GET /projects/:id, POST /projects/:id/submissions,
// GET /projects/submissions/me — via hooks/useProjects.ts. Submission
// requires an active enrollment, enforced entirely server-side
// (ProjectsService.submit) — a 403 here is real, not a client-side guess.
// Self-grading is intentionally not implemented anywhere on this page —
// evaluation only ever happens on the separate instructor screen, backed
// by the server's own ownership-OR-editorial check.

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { ApiError } from '@phoenix/api-client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Loading';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../../../../guards/RequireAuth';
import { useProject, useMySubmissions, useSubmitProject } from '../../../../../../hooks/useProjects';
import { getErrorMessage } from '../../../../../../utils/errors';
import { ROUTES, withLang } from '../../../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل المشروع.',
    backToProjects: 'العودة إلى المشاريع',
    instructions: 'التعليمات والمتطلبات',
    seeLesson: 'التعليمات الكاملة متوفرة داخل الدرس المرتبط:',
    openLesson: 'فتح الدرس',
    yourSubmissions: 'محاولاتك السابقة',
    noSubmissions: 'لم تُقدّم هذا المشروع بعد.',
    attempt: 'محاولة',
    submitNew: 'تقديم محاولة جديدة',
    contentLabel: 'رابط أو نص التسليم (مثال: رابط GitHub، أو وصف العمل المُنجز)',
    submit: 'تقديم المشروع',
    submitting: 'جارٍ الإرسال...',
    submitError: 'تعذّر إرسال المشروع.',
    submitSuccess: 'تم إرسال مشروعك بنجاح — بانتظار التقييم.',
    evaluation: 'التقييم',
    score: 'الدرجة',
    passed: 'ناجح',
    failed: 'غير مجتاز',
    feedback: 'الملاحظات',
    forbidden: 'يجب أن يكون لديك تسجيل نشط في هذه الدورة لتقديم هذا المشروع.',
    contentRequired: 'يجب إدخال نص أو رابط للتسليم.',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load this project.',
    backToProjects: 'Back to projects',
    instructions: 'Instructions & Requirements',
    seeLesson: 'Full instructions are in the linked lesson:',
    openLesson: 'Open lesson',
    yourSubmissions: 'Your submissions',
    noSubmissions: 'You haven’t submitted this project yet.',
    attempt: 'Attempt',
    submitNew: 'Submit a new attempt',
    contentLabel: 'Submission link or text (e.g. a GitHub link, or a description of your work)',
    submit: 'Submit project',
    submitting: 'Submitting...',
    submitError: 'Couldn’t submit the project.',
    submitSuccess: 'Your project was submitted — awaiting evaluation.',
    evaluation: 'Evaluation',
    score: 'Score',
    passed: 'Passed',
    failed: 'Not passed',
    feedback: 'Feedback',
    forbidden: 'You need an active enrollment in this course to submit this project.',
    contentRequired: 'Enter submission text or a link.',
  },
} as const;

function ProjectDetailContent() {
  const params = useParams<{ lang: string; slug: string; projectId: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: project, error, isLoading } = useProject(params.projectId);
  const { data: mySubmissions } = useMySubmissions();
  const submitProject = useSubmitProject(params.projectId);
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  const submissionsForThisProject =
    mySubmissions?.items.filter((s) => s.projectId === params.projectId) ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!content.trim()) {
      setFormError(t.contentRequired);
      return;
    }
    submitProject.mutate(
      { content: content.trim() },
      { onSuccess: () => setContent('') },
    );
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <Link
          href={withLang(ROUTES.courseProjects, locale).replace('[slug]', params.slug)}
          className="ph-form-footer"
        >
          &larr; {t.backToProjects}
        </Link>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {error && !(error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') && (
          <p className="ph-state">{getErrorMessage(error)}</p>
        )}

        {project && (
          <>
            <header className="ph-detail-header">
              <h1 className="ph-page-title">{project.title}</h1>
              {project.description && <p className="ph-page-subtitle">{project.description}</p>}
              <div className="ph-detail-meta">
                <StatusBadge status={project.status} locale={locale} />
              </div>
            </header>

            <section className="ph-form-card">
              <h2 className="ph-catalogue-card-title">{t.instructions}</h2>
              {project.instructions && (
                <div className="ph-detail-body">{project.instructions}</div>
              )}
              {!project.instructions && project.sourceLesson && (
                <div className="ph-detail-body">
                  <p>{t.seeLesson}</p>
                  <Link
                    href={withLang(ROUTES.lessonLearn, locale)
                      .replace('[slug]', params.slug)
                      .replace('[lessonId]', project.sourceLesson.id)}
                    className="ph-btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <FileText size={16} strokeWidth={2} aria-hidden="true" />
                    {t.openLesson}: {project.sourceLesson.title}
                  </Link>
                </div>
              )}
            </section>

            <section className="ph-form-card">
              <h2 className="ph-catalogue-card-title">{t.yourSubmissions}</h2>
              {submissionsForThisProject.length === 0 && (
                <p className="ph-catalogue-card-desc">{t.noSubmissions}</p>
              )}
              {submissionsForThisProject.map((submission) => (
                <div key={submission.id} className="ph-module" style={{ marginBottom: '1rem' }}>
                  <div className="ph-catalogue-card-meta">
                    <span>
                      {t.attempt} #{submission.attemptNumber}
                    </span>
                    <StatusBadge status={submission.status} locale={locale} />
                  </div>
                  <p className="ph-catalogue-card-desc">{submission.content}</p>
                  {submission.evaluation && (
                    <div className="ph-form-card" style={{ marginTop: '0.75rem' }}>
                      <div className="ph-catalogue-card-meta">
                        <strong>{t.evaluation}</strong>
                        <span>
                          {t.score}: {submission.evaluation.scorePercent}% —{' '}
                          {submission.evaluation.passed ? t.passed : t.failed}
                        </span>
                      </div>
                      <p className="ph-catalogue-card-desc">
                        {t.feedback}: {submission.evaluation.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section className="ph-form-card">
              <h2 className="ph-catalogue-card-title">{t.submitNew}</h2>
              <form className="ph-form" onSubmit={handleSubmit}>
                <div className="ph-field">
                  <label htmlFor="submission-content">{t.contentLabel}</label>
                  <textarea
                    id="submission-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                  />
                </div>

                {formError && <p className="ph-form-error">{formError}</p>}

                {submitProject.isError && (
                  <p className="ph-form-error">
                    {submitProject.error instanceof ApiError &&
                    submitProject.error.code === 'FORBIDDEN'
                      ? t.forbidden
                      : getErrorMessage(submitProject.error)}
                  </p>
                )}

                {submitProject.isSuccess && <p className="ph-form-success">{t.submitSuccess}</p>}

                <button type="submit" className="ph-btn-grad" disabled={submitProject.isPending}>
                  {submitProject.isPending ? (
                    <>
                      <Spinner size={16} /> {t.submitting}
                    </>
                  ) : (
                    t.submit
                  )}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <RequireAuth>
      <ProjectDetailContent />
    </RequireAuth>
  );
}
