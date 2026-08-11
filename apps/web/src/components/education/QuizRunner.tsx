'use client';

// Real quiz-taking UI (Phase 28). Loads real questions via
// GET /progress/quizzes/:quizId (correctAnswer never present in that
// response — stripped server-side), submits via the existing
// POST .../attempts, and renders exactly the score/pass-fail the server
// returns. No score is ever computed client-side.

import { useState } from 'react';
import { ApiError } from '@phoenix/api-client';
import type { QuizForLearner } from '@phoenix/types';
import { Spinner } from '@/components/ui/Loading';
import { type Locale } from '@/lib/i18n';
import { useQuiz, useSubmitQuizAttempt } from '../../hooks/useProgress';
import { getErrorMessage } from '../../utils/errors';

const COPY = {
  ar: {
    loading: 'جارٍ تحميل الاختبار...',
    error: 'تعذّر تحميل الاختبار.',
    submit: 'إرسال الإجابات',
    submitting: 'جارٍ التصحيح...',
    passed: 'اجتزت الاختبار',
    failed: 'لم تجتز الاختبار',
    scoreLabel: 'درجتك',
    passingScore: 'الدرجة المطلوبة للنجاح',
    attemptsExhausted: 'لقد استنفدت عدد المحاولات المسموح بها لهذا الاختبار.',
    incomplete: 'يجب الإجابة على جميع الأسئلة قبل الإرسال.',
    textPlaceholder: 'اكتب إجابتك هنا...',
  },
  en: {
    loading: 'Loading quiz...',
    error: 'Couldn’t load this quiz.',
    submit: 'Submit answers',
    submitting: 'Scoring...',
    passed: 'You passed',
    failed: 'You did not pass',
    scoreLabel: 'Your score',
    passingScore: 'Passing score required',
    attemptsExhausted: 'You’ve used all allowed attempts for this quiz.',
    incomplete: 'Answer every question before submitting.',
    textPlaceholder: 'Type your answer...',
  },
} as const;

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: QuizForLearner['questions'][number];
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const options = Array.isArray(question.options) ? (question.options as string[]) : [];

  if (question.questionType === 'single') {
    return (
      <div>
        {options.map((option) => (
          <label key={option} style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="radio"
              name={question.id}
              checked={value === option}
              onChange={() => onChange(option)}
            />{' '}
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (question.questionType === 'multiple') {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        {options.map((option) => (
          <label key={option} style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selected, option]);
                } else {
                  onChange(selected.filter((o) => o !== option));
                }
              }}
            />{' '}
            {option}
          </label>
        ))}
      </div>
    );
  }

  // 'text'
  return (
    <textarea
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
    />
  );
}

export function QuizRunner({ quizId, locale }: { quizId: string; locale: Locale }) {
  const t = COPY[locale] ?? COPY.ar;
  const { data: quiz, error, isLoading } = useQuiz(quizId);
  const submitAttempt = useSubmitQuizAttempt();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  if (isLoading) {
    return (
      <p className="ph-state">
        <Spinner size={18} /> {t.loading}
      </p>
    );
  }

  if (error) {
    return <p className="ph-form-error">{getErrorMessage(error)}</p>;
  }

  if (!quiz) {
    return null;
  }

  const allAnswered = quiz.questions.every((q) => {
    const a = answers[q.id];
    if (q.questionType === 'multiple') return Array.isArray(a) && a.length > 0;
    return typeof a === 'string' && a.length > 0;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitAttempt.mutate({ quizId, answers });
  }

  if (submitAttempt.isSuccess && submitAttempt.data) {
    const { attempt, perQuestionCorrectness } = submitAttempt.data;
    return (
      <div className="ph-form-card">
        <p className={attempt.passed ? 'ph-form-success' : 'ph-form-error'}>
          {attempt.passed ? t.passed : t.failed}
        </p>
        <div className="ph-catalogue-card-meta">
          <span>
            {t.scoreLabel}: {attempt.scorePercent}%
          </span>
          <span>
            {t.passingScore}: {quiz.passingScorePercent}%
          </span>
        </div>
        <ul>
          {quiz.questions.map((q, index) => (
            <li key={q.id}>
              {index + 1}. {q.prompt} —{' '}
              {perQuestionCorrectness[q.id] ? '✓' : '✗'}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form className="ph-form" onSubmit={handleSubmit}>
      {quiz.questions.map((question, index) => (
        <div key={question.id} className="ph-field">
          <label>
            {index + 1}. {question.prompt}
          </label>
          <QuestionInput
            question={question}
            value={answers[question.id]}
            onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
          />
        </div>
      ))}

      {submitAttempt.isError && (
        <p className="ph-form-error">
          {submitAttempt.error instanceof ApiError && submitAttempt.error.code === 'CONFLICT'
            ? t.attemptsExhausted
            : getErrorMessage(submitAttempt.error)}
        </p>
      )}

      <button type="submit" className="ph-btn-grad" disabled={!allAnswered || submitAttempt.isPending}>
        {submitAttempt.isPending ? (
          <>
            <Spinner size={16} /> {t.submitting}
          </>
        ) : (
          t.submit
        )}
      </button>
      {!allAnswered && <p className="ph-catalogue-card-desc">{t.incomplete}</p>}
    </form>
  );
}
