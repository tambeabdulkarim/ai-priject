'use client';

// docs/16-API-CONTRACT.md POST /auth/login, via the Foundation's
// useAuth().login (services/auth-client.ts + providers/AuthProvider.tsx)
// — no API logic reimplemented here.
//
// docs/10-SECURITY-BIBLE.md §5 (Phase 14.2): a second step is added for
// MFA-enabled accounts — `login()` returns `mfaRequired` instead of
// succeeding, and this component switches to a code-entry form calling
// `verifyMfa()`. A single "code" field accepts either a 6-digit TOTP
// code or a recovery code (the server tries both — see the MFA Security
// Architecture Review), so there's no separate recovery-code UI mode,
// just a hint below the field.

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireGuest } from '../../../guards/RequireGuest';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'تسجيل الدخول',
    subtitle: 'مرحبًا بعودتك — أدخل بياناتك للمتابعة.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    submit: 'تسجيل الدخول',
    submitting: 'جارٍ تسجيل الدخول...',
    forgot: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    register: 'إنشاء حساب',
    mfaTitle: 'التحقق بخطوتين',
    mfaSubtitle: 'أدخل رمز التطبيق المصادق، أو أحد رموز الاسترداد إذا لم يعد الجهاز متاحًا.',
    mfaCode: 'الرمز',
    mfaSubmit: 'تأكيد',
    mfaSubmitting: 'جارٍ التأكيد...',
    mfaBack: 'العودة لتسجيل الدخول',
  },
  en: {
    title: 'Sign in',
    subtitle: 'Welcome back — enter your details to continue.',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in...',
    forgot: 'Forgot your password?',
    noAccount: "Don't have an account?",
    register: 'Create one',
    mfaTitle: 'Two-factor verification',
    mfaSubtitle:
      "Enter the code from your authenticator app, or a recovery code if you've lost access to it.",
    mfaCode: 'Code',
    mfaSubmit: 'Verify',
    mfaSubmitting: 'Verifying...',
    mfaBack: 'Back to sign in',
  },
} as const;

function LoginPageContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyMfa } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  function goToDestination() {
    const redirect = searchParams.get('redirect');
    router.replace(redirect || withLang(ROUTES.dashboard, locale));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (!result.success) {
      if ('mfaRequired' in result) {
        setChallengeToken(result.challengeToken);
        return;
      }
      setError(result.message);
      return;
    }
    goToDestination();
  }

  async function handleMfaSubmit(event: FormEvent) {
    event.preventDefault();
    if (!challengeToken) return;
    setError(null);
    setIsSubmitting(true);
    const result = await verifyMfa(challengeToken, mfaCode);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    goToDestination();
  }

  if (challengeToken) {
    return (
      <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
        <Navigation locale={locale} />
        <main className="ph-page ph-page-narrow">
          <h1 className="ph-page-title">{t.mfaTitle}</h1>
          <p className="ph-page-subtitle">{t.mfaSubtitle}</p>

          <div className="ph-form-card">
            <form className="ph-form" onSubmit={handleMfaSubmit} noValidate>
              {error && (
                <div className="ph-form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="ph-field">
                <label className="ph-label" htmlFor="mfaCode">
                  {t.mfaCode}
                </label>
                <input
                  id="mfaCode"
                  type="text"
                  inputMode="text"
                  className="ph-input"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              <button type="submit" className="ph-btn-grad" disabled={isSubmitting || !mfaCode}>
                {isSubmitting ? t.mfaSubmitting : t.mfaSubmit}
              </button>
            </form>

            <p className="ph-form-footer">
              <button
                type="button"
                className="ph-btn-outline"
                onClick={() => {
                  setChallengeToken(null);
                  setMfaCode('');
                  setError(null);
                }}
              >
                {t.mfaBack}
              </button>
            </p>
          </div>
        </main>
        <Footer locale={locale} />
      </div>
    );
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        <div className="ph-form-card">
          <form className="ph-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="ph-form-error" role="alert">
                {error}
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

            <div className="ph-field">
              <label className="ph-label" htmlFor="password">
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                className="ph-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="ph-btn-grad" disabled={isSubmitting}>
              {isSubmitting ? t.submitting : t.submit}
            </button>
          </form>

          <p className="ph-form-footer">
            <Link href={withLang(ROUTES.forgotPassword, locale)}>{t.forgot}</Link>
          </p>
          <p className="ph-form-footer">
            {t.noAccount} <Link href={withLang(ROUTES.register, locale)}>{t.register}</Link>
          </p>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <RequireGuest>
      <LoginPageContent />
    </RequireGuest>
  );
}
