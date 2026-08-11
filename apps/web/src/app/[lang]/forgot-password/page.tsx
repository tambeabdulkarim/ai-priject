'use client';

// docs/16-API-CONTRACT.md POST /auth/forgot-password, via
// hooks/useForgotPassword.ts. The backend's response is always the same
// generic message regardless of whether the email exists
// (enumeration-safe) — this page renders it verbatim, never branches.

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireGuest } from '../../../guards/RequireGuest';
import { useForgotPassword } from '../../../hooks/useForgotPassword';
import { getErrorMessage } from '../../../utils/errors';

const COPY = {
  ar: {
    title: 'نسيت كلمة المرور',
    subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.',
    email: 'البريد الإلكتروني',
    submit: 'إرسال الرابط',
    submitting: 'جارٍ الإرسال...',
  },
  en: {
    title: 'Forgot password',
    subtitle: 'Enter your email and we’ll send you a reset link.',
    email: 'Email',
    submit: 'Send reset link',
    submitting: 'Sending...',
  },
} as const;

function ForgotPasswordPageContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { mutate, isPending, data, error: mutationError } = useForgotPassword();

  const [email, setEmail] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutate(email);
  }

  const responseMessage = data?.error ? null : data?.data.message;

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>

        <div className="ph-form-card">
          {responseMessage ? (
            <div className="ph-form-success" role="status">
              {responseMessage}
            </div>
          ) : (
            <>
              <p className="ph-page-subtitle">{t.subtitle}</p>
              <form className="ph-form" onSubmit={handleSubmit} noValidate>
                {(data?.error || mutationError) && (
                  <div className="ph-form-error" role="alert">
                    {getErrorMessage(data?.error ?? mutationError)}
                  </div>
                )}

                <div className="ph-field">
                  <label className="ph-label" htmlFor="email">
                    {t.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="ph-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <button type="submit" className="ph-btn-grad" disabled={isPending}>
                  {isPending ? t.submitting : t.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <RequireGuest>
      <ForgotPasswordPageContent />
    </RequireGuest>
  );
}
