'use client';

// docs/16-API-CONTRACT.md POST /auth/login, via the Foundation's
// useAuth().login (services/auth-client.ts + providers/AuthProvider.tsx)
// — no API logic reimplemented here.

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
  },
} as const;

function LoginPageContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    const redirect = searchParams.get('redirect');
    router.replace(redirect || withLang(ROUTES.dashboard, locale));
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        <form className="ph-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="ph-form-error" role="alert">
              {error}
            </div>
          )}

          <div className="ph-field">
            <label className="ph-label" htmlFor="email">{t.email}</label>
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
            <label className="ph-label" htmlFor="password">{t.password}</label>
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
