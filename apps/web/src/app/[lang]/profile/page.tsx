'use client';

// docs/16-API-CONTRACT.md §3 (Profiles) is documented but was NEVER
// implemented in the real backend (verified: no ProfilesModule exists
// anywhere in apps/api). "View profile" therefore uses the real
// GET /users/me (via useAuth().profile) — id, email, emailVerified,
// roles, status, locale, createdAt only; no displayName/bio/avatar exist
// in this response. "Edit profile" uses the real PATCH /users/me, which
// only accepts `locale`/`timezone` — not the full profile-editing flow
// docs/16 describes. This is a genuine, verified backend gap, not a
// frontend limitation: displayName/bio/avatar editing is
// BLOCKED BY DOCUMENTATION (missing ProfilesModule / PATCH /profiles/me,
// POST /profiles/me/avatar) and is not built here.

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useAuth } from '../../../hooks/useAuth';
import { useUpdateProfile } from '../../../hooks/useUpdateProfile';
import { getErrorMessage } from '../../../utils/errors';

const COPY = {
  ar: {
    title: 'الملف الشخصي',
    email: 'البريد الإلكتروني',
    status: 'الحالة',
    roles: 'الأدوار',
    verified: 'مفعّل',
    notVerified: 'غير مفعّل',
    memberSince: 'عضو منذ',
    editTitle: 'التفضيلات',
    locale: 'اللغة',
    timezone: 'المنطقة الزمنية',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    saved: 'تم الحفظ.',
    blockedNote: 'تعديل الاسم والصورة الشخصية غير متاح حاليًا (لا يوجد نظام ملفات شخصية في الخادم بعد).',
  },
  en: {
    title: 'Profile',
    email: 'Email',
    status: 'Status',
    roles: 'Roles',
    verified: 'Verified',
    notVerified: 'Not verified',
    memberSince: 'Member since',
    editTitle: 'Preferences',
    locale: 'Language',
    timezone: 'Timezone',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved.',
    blockedNote: 'Editing your display name and avatar isn’t available yet (no profile system exists on the backend).',
  },
} as const;

function ProfileContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { profile } = useAuth();
  const { mutate, isPending, data, error: mutationError } = useUpdateProfile();

  const [formLocale, setFormLocale] = useState<'ar' | 'en'>(locale);
  const [timezone, setTimezone] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutate({ locale: formLocale, timezone: timezone || undefined });
  }

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page ph-page-narrow">
        <h1 className="ph-page-title">{t.title}</h1>

        {profile && (
          <div className="ph-module">
            <div className="ph-lesson-row"><span>{t.email}</span><span>{profile.email}</span></div>
            <div className="ph-lesson-row">
              <span>{t.email === 'Email' ? 'Email verified' : 'تأكيد البريد'}</span>
              <span>{profile.emailVerified ? t.verified : t.notVerified}</span>
            </div>
            <div className="ph-lesson-row"><span>{t.status}</span><span>{profile.status}</span></div>
            <div className="ph-lesson-row"><span>{t.roles}</span><span>{profile.roles.join(', ')}</span></div>
            <div className="ph-lesson-row">
              <span>{t.memberSince}</span>
              <span>{new Date(profile.createdAt).toLocaleDateString(locale)}</span>
            </div>
          </div>
        )}

        <h2 className="ph-catalogue-card-title" style={{ marginTop: '2rem' }}>{t.editTitle}</h2>
        <p className="ph-page-subtitle">{t.blockedNote}</p>

        <form className="ph-form" onSubmit={handleSubmit} noValidate>
          {data?.error && <div className="ph-form-error" role="alert">{getErrorMessage(data.error)}</div>}
          {mutationError && <div className="ph-form-error" role="alert">{getErrorMessage(mutationError)}</div>}
          {data && !data.error && <div className="ph-form-success" role="status">{t.saved}</div>}

          <div className="ph-field">
            <label className="ph-label" htmlFor="locale">{t.locale}</label>
            <select
              id="locale"
              className="ph-input"
              value={formLocale}
              onChange={(e) => setFormLocale(e.target.value as 'ar' | 'en')}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="ph-field">
            <label className="ph-label" htmlFor="timezone">{t.timezone}</label>
            <input
              id="timezone"
              type="text"
              className="ph-input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Riyadh"
              maxLength={64}
            />
          </div>

          <button type="submit" className="ph-btn-grad" disabled={isPending}>
            {isPending ? t.saving : t.save}
          </button>
        </form>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
