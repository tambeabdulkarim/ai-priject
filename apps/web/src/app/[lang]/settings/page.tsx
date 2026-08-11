'use client';

// docs/16-API-CONTRACT.md POST /users/me/change-password, POST
// /auth/logout, POST /auth/logout-all — all via the existing Foundation
// (hooks/useChangePassword.ts, useAuth().logout/logoutAll). Per the real
// backend, a successful password change revokes every OTHER session (the
// acting one survives); logout-all revokes every session including the
// acting one and forces a fresh login.
//
// docs/10-SECURITY-BIBLE.md §5 (Phase 14.2): MFA enroll/disable/
// recovery-code-regeneration UI added below, via hooks/useMfa.ts.

import { useState, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useAuth } from '../../../hooks/useAuth';
import { useChangePassword } from '../../../hooks/useChangePassword';
import {
  useMfaEnrollBegin,
  useMfaEnrollConfirm,
  useMfaDisable,
  useMfaRegenerateRecoveryCodes,
} from '../../../hooks/useMfa';
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
    mfa: 'التحقق بخطوتين (MFA)',
    mfaEnabledStatus: 'مُفعّل على حسابك.',
    mfaDisabledStatus: 'غير مُفعّل على حسابك.',
    mfaEnable: 'تفعيل',
    mfaDisable: 'إيقاف',
    mfaScan:
      'امسح رمز QR باستخدام تطبيق المصادقة (Google Authenticator أو ما شابه)، أو أدخل هذا الرمز يدويًا:',
    mfaConfirmCode: 'أدخل الرمز المكوّن من 6 أرقام لتأكيد التفعيل',
    mfaConfirm: 'تأكيد',
    mfaConfirming: 'جارٍ التأكيد...',
    mfaCancel: 'إلغاء',
    mfaRecoveryTitle: 'رموز الاسترداد',
    mfaRecoveryWarning:
      'احفظ هذه الرموز الآن في مكان آمن — لن تظهر مرة أخرى. كل رمز يُستخدم مرة واحدة فقط إذا فقدت الوصول إلى تطبيق المصادقة.',
    mfaRecoveryDone: 'لقد حفظت هذه الرموز',
    mfaDisablePassword: 'أدخل كلمة المرور لتأكيد إيقاف التحقق بخطوتين',
    mfaRegenerate: 'إنشاء رموز استرداد جديدة',
    mfaRegenerating: 'جارٍ الإنشاء...',
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
    mfa: 'Two-factor authentication (MFA)',
    mfaEnabledStatus: 'Enabled on your account.',
    mfaDisabledStatus: 'Not enabled on your account.',
    mfaEnable: 'Enable',
    mfaDisable: 'Disable',
    mfaScan:
      'Scan this QR code with your authenticator app (Google Authenticator or similar), or enter this code manually:',
    mfaConfirmCode: 'Enter the 6-digit code to confirm',
    mfaConfirm: 'Confirm',
    mfaConfirming: 'Confirming...',
    mfaCancel: 'Cancel',
    mfaRecoveryTitle: 'Recovery codes',
    mfaRecoveryWarning:
      "Save these somewhere safe now — they won't be shown again. Each one works once, if you ever lose access to your authenticator app.",
    mfaRecoveryDone: "I've saved these codes",
    mfaDisablePassword: 'Enter your password to confirm disabling MFA',
    mfaRegenerate: 'Generate new recovery codes',
    mfaRegenerating: 'Generating...',
  },
} as const;

type MfaCopy = (typeof COPY)[keyof typeof COPY];

/**
 * docs/10-SECURITY-BIBLE.md §5 (Phase 14.2). Split out from
 * SettingsContent — it's a self-contained mini state machine (idle →
 * enrolling → recovery-codes-shown-once, or idle → disabling), not just
 * a form, so it stays cleaner as its own component. `mfaEnabled` comes
 * from the caller's already-fetched GET /users/me profile — this
 * component doesn't independently re-fetch it.
 */
function MfaSection({ t, mfaEnabled }: { t: MfaCopy; mfaEnabled: boolean }) {
  const enrollBegin = useMfaEnrollBegin();
  const enrollConfirm = useMfaEnrollConfirm();
  const disable = useMfaDisable();
  const regenerate = useMfaRegenerateRecoveryCodes();

  const [mode, setMode] = useState<'idle' | 'enrolling' | 'recovery-codes' | 'disabling'>('idle');
  const [confirmCode, setConfirmCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  async function handleStartEnroll() {
    setMode('enrolling');
    enrollBegin.mutate();
  }

  function handleConfirmEnroll(event: FormEvent) {
    event.preventDefault();
    enrollConfirm.mutate(confirmCode, {
      onSuccess: (result) => {
        if (!result.error) {
          setRecoveryCodes(result.data.recoveryCodes);
          setMode('recovery-codes');
          setConfirmCode('');
        }
      },
    });
  }

  function handleDisable(event: FormEvent) {
    event.preventDefault();
    disable.mutate(disablePassword, {
      onSuccess: (result) => {
        if (!result.error) {
          setMode('idle');
          setDisablePassword('');
        }
      },
    });
  }

  function handleRegenerate() {
    regenerate.mutate(undefined, {
      onSuccess: (result) => {
        if (!result.error) {
          setRecoveryCodes(result.data.recoveryCodes);
          setMode('recovery-codes');
        }
      },
    });
  }

  if (mode === 'recovery-codes') {
    return (
      <div className="ph-form-card" style={{ marginTop: 'var(--ph-space-5)' }}>
        <h2 className="ph-catalogue-card-title" style={{ marginTop: 0 }}>
          {t.mfa}
        </h2>
        <div className="ph-form">
          <h3 className="ph-label">{t.mfaRecoveryTitle}</h3>
          <div className="ph-form-error" role="alert">
            {t.mfaRecoveryWarning}
          </div>
          <ul style={{ fontFamily: 'monospace', fontSize: '1rem', lineHeight: 1.8 }}>
            {recoveryCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
          <button type="button" className="ph-btn-grad" onClick={() => setMode('idle')}>
            {t.mfaRecoveryDone}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'enrolling') {
    return (
      <div className="ph-form-card" style={{ marginTop: 'var(--ph-space-5)' }}>
        <h2 className="ph-catalogue-card-title" style={{ marginTop: 0 }}>
          {t.mfa}
        </h2>
        <div className="ph-form">
          {enrollBegin.data?.error && (
            <div className="ph-form-error" role="alert">
              {getErrorMessage(enrollBegin.data.error)}
            </div>
          )}
          {enrollConfirm.data?.error && (
            <div className="ph-form-error" role="alert">
              {getErrorMessage(enrollConfirm.data.error)}
            </div>
          )}

          {enrollBegin.data && !enrollBegin.data.error && (
            <form onSubmit={handleConfirmEnroll} className="ph-form">
              <p>{t.mfaScan}</p>
              <QRCodeSVG value={enrollBegin.data.data.otpauthUri} size={192} />
              <code style={{ userSelect: 'all' }}>{enrollBegin.data.data.secret}</code>

              <div className="ph-field">
                <label className="ph-label" htmlFor="mfaConfirmCode">
                  {t.mfaConfirmCode}
                </label>
                <input
                  id="mfaConfirmCode"
                  type="text"
                  className="ph-input"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  required
                  autoComplete="one-time-code"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  className="ph-btn-grad"
                  disabled={enrollConfirm.isPending || !confirmCode}
                >
                  {enrollConfirm.isPending ? t.mfaConfirming : t.mfaConfirm}
                </button>
                <button type="button" className="ph-btn-outline" onClick={() => setMode('idle')}>
                  {t.mfaCancel}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'disabling') {
    return (
      <div className="ph-form-card" style={{ marginTop: 'var(--ph-space-5)' }}>
        <h2 className="ph-catalogue-card-title" style={{ marginTop: 0 }}>
          {t.mfa}
        </h2>
        <form className="ph-form" onSubmit={handleDisable} noValidate>
          {disable.data?.error && (
            <div className="ph-form-error" role="alert">
              {getErrorMessage(disable.data.error)}
            </div>
          )}
          <div className="ph-field">
            <label className="ph-label" htmlFor="mfaDisablePassword">
              {t.mfaDisablePassword}
            </label>
            <input
              id="mfaDisablePassword"
              type="password"
              className="ph-input"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="ph-btn-grad" disabled={disable.isPending}>
              {t.mfaDisable}
            </button>
            <button type="button" className="ph-btn-outline" onClick={() => setMode('idle')}>
              {t.mfaCancel}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="ph-form-card" style={{ marginTop: 'var(--ph-space-5)' }}>
      <h2 className="ph-catalogue-card-title" style={{ marginTop: 0 }}>
        {t.mfa}
      </h2>
      <div className="ph-form" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
        <span>{mfaEnabled ? t.mfaEnabledStatus : t.mfaDisabledStatus}</span>
        {mfaEnabled ? (
          <>
            <button type="button" className="ph-btn-outline" onClick={() => setMode('disabling')}>
              {t.mfaDisable}
            </button>
            <button
              type="button"
              className="ph-btn-outline"
              onClick={handleRegenerate}
              disabled={regenerate.isPending}
            >
              {regenerate.isPending ? t.mfaRegenerating : t.mfaRegenerate}
            </button>
          </>
        ) : (
          <button type="button" className="ph-btn-grad" onClick={handleStartEnroll}>
            {t.mfaEnable}
          </button>
        )}
      </div>
    </div>
  );
}

function SettingsContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const router = useRouter();
  const { logout, logoutAll, profile } = useAuth();
  const { mutate, isPending, data, error: mutationError } = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutate(
      { currentPassword, newPassword },
      {
        onSuccess: (result) => {
          if (!result.error) {
            setCurrentPassword('');
            setNewPassword('');
          }
        },
      },
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

        <div className="ph-form-card">
          <h2 className="ph-catalogue-card-title" style={{ marginTop: 0 }}>
            {t.changePassword}
          </h2>
          <form className="ph-form" onSubmit={handleSubmit} noValidate>
            {data?.error && (
              <div className="ph-form-error" role="alert">
                {getErrorMessage(data.error)}
              </div>
            )}
            {mutationError && (
              <div className="ph-form-error" role="alert">
                {getErrorMessage(mutationError)}
              </div>
            )}
            {data && !data.error && (
              <div className="ph-form-success" role="status">
                {t.saved}
              </div>
            )}

            <div className="ph-field">
              <label className="ph-label" htmlFor="currentPassword">
                {t.currentPassword}
              </label>
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
              {isPending ? t.saving : t.save}
            </button>
          </form>
        </div>

        <div className="ph-form-card" style={{ marginTop: 'var(--ph-space-5)' }}>
          <h2 className="ph-catalogue-card-title" style={{ marginTop: 0 }}>
            {t.sessions}
          </h2>
          <div className="ph-form" style={{ flexDirection: 'row', gap: '1rem' }}>
            <button
              type="button"
              className="ph-btn-outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? t.loggingOut : t.logout}
            </button>
            <button
              type="button"
              className="ph-btn-outline"
              onClick={handleLogoutAll}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? t.loggingOut : t.logoutAll}
            </button>
          </div>
        </div>

        {profile && <MfaSection t={t} mfaEnabled={profile.mfaEnabled} />}
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
