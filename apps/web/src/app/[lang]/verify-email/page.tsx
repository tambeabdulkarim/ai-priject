'use client';

// docs/16-API-CONTRACT.md POST /auth/verify-email. Auto-submits on mount
// when a `?token=` is present (the normal flow — the user arrived by
// clicking the emailed link), rather than requiring a manual form.

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { useVerifyEmail } from '../../../hooks/useVerifyEmail';
import { getErrorMessage } from '../../../utils/errors';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'تفعيل البريد الإلكتروني',
    verifying: 'جارٍ التحقق من بريدك الإلكتروني...',
    missingToken: 'رابط التفعيل غير صالح أو غير مكتمل.',
    successTitle: 'تم تفعيل بريدك الإلكتروني',
    goToLogin: 'الذهاب إلى تسجيل الدخول',
  },
  en: {
    title: 'Verify email',
    verifying: 'Verifying your email...',
    missingToken: 'This verification link is invalid or incomplete.',
    successTitle: 'Your email is verified',
    goToLogin: 'Go to sign in',
  },
} as const;

export default function VerifyEmailPage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { mutate, isPending, isIdle, data, error: mutationError } = useVerifyEmail();
  const attempted = useRef(false);

  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true;
      mutate(token);
    }
  }, [token, mutate]);

  const succeeded = data && !data.error;

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>

        {!token && (
          <div className="ph-form-error" role="alert">
            {t.missingToken}
          </div>
        )}

        {token && (isPending || isIdle) && <p className="ph-state">{t.verifying}</p>}

        {token && succeeded && (
          <div className="ph-form-success" role="status">
            <strong>{t.successTitle}</strong>
            <p style={{ marginTop: '1rem' }}>
              <Link href={withLang(ROUTES.login, locale)}>{t.goToLogin}</Link>
            </p>
          </div>
        )}

        {token && data?.error && (
          <div className="ph-form-error" role="alert">
            {getErrorMessage(data.error)}
          </div>
        )}
        {token && mutationError && (
          <div className="ph-form-error" role="alert">
            {getErrorMessage(mutationError)}
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
