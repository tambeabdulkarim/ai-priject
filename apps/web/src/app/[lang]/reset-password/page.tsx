'use client';

// docs/16-API-CONTRACT.md POST /auth/reset-password. The token arrives
// as a query param from the emailed link (?token=...) — per the real
// backend, a successful reset revokes EVERY session (not "other" — there
// is no "current" session mid-reset-flow), so this always sends the user
// to /login afterward, never attempts to keep them signed in.

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireGuest } from '../../../guards/RequireGuest';
import { useResetPassword } from '../../../hooks/useResetPassword';
import { getErrorMessage } from '../../../utils/errors';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'إعادة تعيين كلمة المرور',
    subtitle: 'أدخل كلمة مرور جديدة لحسابك.',
    newPassword: 'كلمة المرور الجديدة',
    submit: 'إعادة التعيين',
    submitting: 'جارٍ الحفظ...',
    missingToken: 'رابط إعادة التعيين غير صالح أو غير مكتمل.',
    successTitle: 'تم تعيين كلمة المرور',
    successBody: 'تم تسجيل خروجك من كل الجلسات لأسباب أمنية. سجّل الدخول بكلمة المرور الجديدة.',
    goToLogin: 'الذهاب إلى تسجيل الدخول',
  },
  en: {
    title: 'Reset password',
    subtitle: 'Enter a new password for your account.',
    newPassword: 'New password',
    submit: 'Reset password',
    submitting: 'Saving...',
    missingToken: 'This reset link is invalid or incomplete.',
    successTitle: 'Password updated',
    successBody:
      'You’ve been signed out of every session for security. Sign in with your new password.',
    goToLogin: 'Go to sign in',
  },
} as const;

function ResetPasswordPageContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { mutate, isPending, data, error: mutationError } = useResetPassword();

  const [newPassword, setNewPassword] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    mutate({ token, newPassword });
  }

  const succeeded = data && !data.error;

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>

        <div className="ph-form-card">
          {!token ? (
            <div className="ph-form-error" role="alert">
              {t.missingToken}
            </div>
          ) : succeeded ? (
            <div className="ph-form-success" role="status">
              <strong>{t.successTitle}</strong>
              <p style={{ marginTop: '0.5rem' }}>{t.successBody}</p>
              <p style={{ marginTop: '1rem' }}>
                <Link href={withLang(ROUTES.login, locale)}>{t.goToLogin}</Link>
              </p>
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
                  <label className="ph-label" htmlFor="newPassword">
                    {t.newPassword}
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className="ph-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={10}
                    autoComplete="new-password"
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

export default function ResetPasswordPage() {
  return (
    <RequireGuest>
      <ResetPasswordPageContent />
    </RequireGuest>
  );
}
