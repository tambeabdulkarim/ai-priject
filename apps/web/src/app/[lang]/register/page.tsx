'use client';

// docs/16-API-CONTRACT.md POST /auth/register, via useAuth().register.
// Per docs §4.2 (and the real backend's enumeration-safe response), a
// successful submission NEVER signs the user in and ALWAYS shows the
// same "check your email" state — this page must not (and does not)
// branch on whether the email was actually new.

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireGuest } from '../../../guards/RequireGuest';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'إنشاء حساب',
    subtitle: 'انضم إلى فينيكس وابدأ رحلة التعلم.',
    name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    passwordHint: '10 أحرف على الأقل',
    submit: 'إنشاء حساب',
    submitting: 'جارٍ الإنشاء...',
    haveAccount: 'لديك حساب بالفعل؟',
    login: 'تسجيل الدخول',
    successTitle: 'تحقق من بريدك الإلكتروني',
    successBody: 'إذا كان هذا البريد الإلكتروني صالحًا للتسجيل، فسنرسل رابط تفعيل إليه.',
  },
  en: {
    title: 'Create an account',
    subtitle: 'Join Phoenix and start learning.',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 10 characters',
    submit: 'Create account',
    submitting: 'Creating...',
    haveAccount: 'Already have an account?',
    login: 'Sign in',
    successTitle: 'Check your email',
    successBody: 'If this email is eligible for registration, we’ve sent it a verification link.',
  },
} as const;

function RegisterPageContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await register({ email, password, displayName, locale });
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>

        <div className="ph-form-card">
          {submitted ? (
            <div className="ph-form-success" role="status">
              <strong>{t.successTitle}</strong>
              <p style={{ marginTop: '0.5rem' }}>{t.successBody}</p>
            </div>
          ) : (
            <>
              <p className="ph-page-subtitle">{t.subtitle}</p>
              <form className="ph-form" onSubmit={handleSubmit} noValidate>
                {error && (
                  <div className="ph-form-error" role="alert">
                    {error}
                  </div>
                )}

                <div className="ph-field">
                  <label className="ph-label" htmlFor="displayName">
                    {t.name}
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    className="ph-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    maxLength={120}
                    autoComplete="name"
                  />
                </div>

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
                    minLength={10}
                    autoComplete="new-password"
                    aria-describedby="password-hint"
                  />
                  <span
                    id="password-hint"
                    className="ph-field-error"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.passwordHint}
                  </span>
                </div>

                <button type="submit" className="ph-btn-grad" disabled={isSubmitting}>
                  {isSubmitting ? t.submitting : t.submit}
                </button>
              </form>
            </>
          )}

          <p className="ph-form-footer">
            {t.haveAccount} <Link href={withLang(ROUTES.login, locale)}>{t.login}</Link>
          </p>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <RequireGuest>
      <RegisterPageContent />
    </RequireGuest>
  );
}
