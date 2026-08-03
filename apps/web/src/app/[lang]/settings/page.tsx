'use client';

// docs/16-API-CONTRACT.md POST /users/me/change-password, POST
// /auth/logout, POST /auth/logout-all — all via the existing Foundation
// (hooks/useChangePassword.ts, useAuth().logout/logoutAll). Per the real
// backend, a successful password change revokes every OTHER session (the
// acting one survives); logout-all revokes every session including the
// acting one and forces a fresh login.

import { useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useAuth } from '../../../hooks/useAuth';
import { useChangePassword } from '../../../hooks/useChangePassword';
import { getErrorMessage } from '../../../utils/errors';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'إعدادات الحساب',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    saved: 'تم تغيير كلمة المرور. تم تسجيل خروجك من الأجهزة الأخرى.',
    sessions: 'الجلسات',
    logout: 'تسجيل الخروج',
    logoutAll: 'تسجيل الخروج من كل الأجهزة',
    loggingOut: 'جارٍ تسجيل الخروج...',
  },
  en: {
    title: 'Account settings',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Password changed. You’ve been signed out of other devices.',
    sessions: 'Sessions',
    logout: 'Log out',
    logoutAll: 'Log out of all devices',
    loggingOut: 'Signing out...',
  },
} as const;

function SettingsContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const router = useRouter();
  const { logout, logoutAll } = useAuth();
  const { mutate, isPending, data, error: mutationError } = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutate(
      { currentPassword, newPassword },
      { onSuccess: (result) => { if (!result.error) { setCurrentPassword(''); setNewPassword(''); } } },
    );
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    router.replace(withLang(ROUTES.home, locale));
  }

  async function handleLogoutAll() {
    setIsLoggingOut(true);
    await logoutAll();
    router.replace(withLang(ROUTES.home, locale));
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>

        <h2 className="ph-catalogue-card-title">{t.changePassword}</h2>
        <form className="ph-form" onSubmit={handleSubmit} noValidate>
          {data?.error && <div className="ph-form-error" role="alert">{getErrorMessage(data.error)}</div>}
          {mutationError && <div className="ph-form-error" role="alert">{getErrorMessage(mutationError)}</div>}
          {data && !data.error && <div className="ph-form-success" role="status">{t.saved}</div>}

          <div className="ph-field">
            <label className="ph-label" htmlFor="currentPassword">{t.currentPassword}</label>
            <input
              id="currentPassword"
              type="password"
              className="ph-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="ph-field">
            <label className="ph-label" htmlFor="newPassword">{t.newPassword}</label>
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
            {isPending ? t.saving : t.save}
          </button>
        </form>

        <h2 className="ph-catalogue-card-title" style={{ marginTop: '2.5rem' }}>{t.sessions}</h2>
        <div className="ph-form" style={{ flexDirection: 'row', gap: '1rem' }}>
          <button type="button" className="ph-btn-outline" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? t.loggingOut : t.logout}
          </button>
          <button type="button" className="ph-btn-outline" onClick={handleLogoutAll} disabled={isLoggingOut}>
            {isLoggingOut ? t.loggingOut : t.logoutAll}
          </button>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
