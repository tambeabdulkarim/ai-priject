'use client';

// docs/16-API-CONTRACT.md GET /projects/submissions/:id,
// POST /projects/submissions/:id/evaluate — via hooks/useProjects.ts.
// The server is the ONLY authorization boundary: a learner who reaches
// this URL still gets a real 403 from GET/POST if they attempt to view
// or evaluate a submission they don't own the course for — this page's
// RequireRole wrapper is a UI convenience, never treated as the real
// check. No second grading system exists here — this form calls the
// exact same evaluate endpoint the backend already defines; nothing is
// computed or decided client-side.

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { ApiError } from '@phoenix/api-client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Loading';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../../../../guards/RequireRole';
import { useSubmission, useEvaluateSubmission } from '../../../../../../hooks/useProjects';
import { getErrorMessage } from '../../../../../../utils/errors';
import { ROUTES, withLang, INSTRUCTOR_ROLES } from '../../../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل التسليم.',
    back: 'العودة إلى قائمة المراجعة',
    submissionContent: 'محتوى التسليم',
    alreadyEvaluated: 'تم تقييم هذا التسليم مسبقًا.',
    evaluate: 'تقييم التسليم',
    scoreLabel: 'الدرجة (0-100)',
    passedLabel: 'هل اجتاز المتعلّم المشروع؟',
    yes: 'نعم',
    no: 'لا',
    feedbackLabel: 'الملاحظات (مطلوبة)',
    submit: 'حفظ التقييم',
    submitting: 'جارٍ الحفظ...',
    submitSuccess: 'تم حفظ التقييم بنجاح.',
    forbidden: 'لا تملك صلاحية تقييم هذا التسليم.',
  },
  en: {
    loading: 'Loading...',
    error: 'Couldn’t load this submission.',
    back: 'Back to review queue',
    submissionContent: 'Submission content',
    alreadyEvaluated: 'This submission has already been evaluated.',
    evaluate: 'Evaluate submission',
    scoreLabel: 'Score (0-100)',
    passedLabel: 'Did the learner pass this project?',
    yes: 'Yes',
    no: 'No',
    feedbackLabel: 'Feedback (required)',
    submit: 'Save evaluation',
    submitting: 'Saving...',
    submitSuccess: 'Evaluation saved.',
    forbidden: 'You are not authorized to evaluate this submission.',
  },
} as const;

function SubmissionDetailContent() {
  const params = useParams<{ lang: string; id: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { data: submission, error, isLoading } = useSubmission(params.id);
  const evaluate = useEvaluateSubmission(params.id);
  const [scorePercent, setScorePercent] = useState(80);
  const [passed, setPassed] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') {
    notFound();
  }

  function handleEvaluate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!feedback.trim()) {
      setFormError(t.feedbackLabel);
      return;
    }
    evaluate.mutate({ scorePercent, passed, feedback: feedback.trim() });
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <Link href={withLang(ROUTES.instructorProjectSubmissions, locale)} className="ph-form-footer">
          &larr; {t.back}
        </Link>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {error && !(error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') && (
          <p className="ph-state">
            {error instanceof ApiError && error.code === 'FORBIDDEN' ? t.forbidden : getErrorMessage(error)}
          </p>
        )}

        {submission && (
          <>
            <header className="ph-detail-header">
              <h1 className="ph-page-title">{submission.project.title}</h1>
              <div className="ph-detail-meta">
                <StatusBadge status={submission.status} locale={locale} />
                <span>#{submission.attemptNumber}</span>
              </div>
            </header>

            <section className="ph-form-card">
              <h2 className="ph-catalogue-card-title">{t.submissionContent}</h2>
              <p className="ph-catalogue-card-desc">{submission.content}</p>
            </section>

            {submission.evaluation ? (
              <section className="ph-form-card">
                <p className="ph-form-success">{t.alreadyEvaluated}</p>
                <div className="ph-catalogue-card-meta">
                  <span>
                    {submission.evaluation.scorePercent}% —{' '}
                    {submission.evaluation.passed ? t.yes : t.no}
                  </span>
                </div>
                <p className="ph-catalogue-card-desc">{submission.evaluation.feedback}</p>
              </section>
            ) : (
              <section className="ph-form-card">
                <h2 className="ph-catalogue-card-title">{t.evaluate}</h2>
                <form className="ph-form" onSubmit={handleEvaluate}>
                  <div className="ph-field">
                    <label htmlFor="score">{t.scoreLabel}</label>
                    <input
                      id="score"
                      type="number"
                      min={0}
                      max={100}
                      value={scorePercent}
                      onChange={(e) => setScorePercent(Number(e.target.value))}
                    />
                  </div>

                  <div className="ph-field">
                    <label>{t.passedLabel}</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label>
                        <input
                          type="radio"
                          name="passed"
                          checked={passed}
                          onChange={() => setPassed(true)}
                        />{' '}
                        {t.yes}
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="passed"
                          checked={!passed}
                          onChange={() => setPassed(false)}
                        />{' '}
                        {t.no}
                      </label>
                    </div>
                  </div>

                  <div className="ph-field">
                    <label htmlFor="feedback">{t.feedbackLabel}</label>
                    <textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {formError && <p className="ph-form-error">{formError}</p>}
                  {evaluate.isError && (
                    <p className="ph-form-error">
                      {evaluate.error instanceof ApiError && evaluate.error.code === 'FORBIDDEN'
                        ? t.forbidden
                        : getErrorMessage(evaluate.error)}
                    </p>
                  )}
                  {evaluate.isSuccess && <p className="ph-form-success">{t.submitSuccess}</p>}

                  <button type="submit" className="ph-btn-grad" disabled={evaluate.isPending}>
                    {evaluate.isPending ? (
                      <>
                        <Spinner size={16} /> {t.submitting}
                      </>
                    ) : (
                      t.submit
                    )}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function InstructorSubmissionDetailPage() {
  return (
    <RequireRole roles={[...INSTRUCTOR_ROLES, 'admin']}>
      <SubmissionDetailContent />
    </RequireRole>
  );
}
