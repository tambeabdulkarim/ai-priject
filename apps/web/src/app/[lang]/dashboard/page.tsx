'use client';

// Authenticated Home. Replaces the previous DashboardPageContent (a
// generic, unrelated task-manager placeholder — no real data, not
// Phoenix-specific). Wired entirely to real backend data: GET /users/me
// (via useAuth's profile), GET /enrollments/me, GET /notifications/me,
// GET /certificates/me — no mock data.

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, Bell, Award, User as UserIcon } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { useAuth } from '../../../hooks/useAuth';
import { useEnrollmentsList } from '../../../hooks/useEnrollments';
import { useNotificationsList } from '../../../hooks/useNotifications';
import { useCertificatesList } from '../../../hooks/useCertificates';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    welcome: 'مرحبًا',
    subtitle: 'إليك نظرة سريعة على رحلتك التعليمية.',
    courses: 'دوراتي',
    notifications: 'الإشعارات',
    certificates: 'شهاداتي',
    profile: 'الملف الشخصي',
    unread: 'غير مقروء',
  },
  en: {
    welcome: 'Welcome',
    subtitle: 'Here’s a quick look at your learning journey.',
    courses: 'My courses',
    notifications: 'Notifications',
    certificates: 'My certificates',
    profile: 'Profile',
    unread: 'unread',
  },
} as const;

function DashboardContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { profile } = useAuth();
  const { data: enrollments } = useEnrollmentsList({ status: 'active' });
  const { data: notifications } = useNotificationsList({ status: 'unread', limit: 1 });
  const { data: certificates } = useCertificatesList({ limit: 1 });

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">
          {t.welcome}
          {profile ? `, ${profile.email}` : ''}
        </h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        <div className="ph-grid">
          <Link href={withLang(ROUTES.myCourses, locale)} className="ph-catalogue-card">
            <BookOpen size={24} strokeWidth={1.5} aria-hidden="true" />
            <h2 className="ph-catalogue-card-title">{t.courses}</h2>
            <p className="ph-catalogue-card-desc">{enrollments?.items.length ?? 0}</p>
          </Link>

          <Link href={withLang(ROUTES.notifications, locale)} className="ph-catalogue-card">
            <Bell size={24} strokeWidth={1.5} aria-hidden="true" />
            <h2 className="ph-catalogue-card-title">{t.notifications}</h2>
            <p className="ph-catalogue-card-desc">{notifications?.unreadCount ?? 0} {t.unread}</p>
          </Link>

          <Link href={withLang(ROUTES.certificatesList, locale)} className="ph-catalogue-card">
            <Award size={24} strokeWidth={1.5} aria-hidden="true" />
            <h2 className="ph-catalogue-card-title">{t.certificates}</h2>
            <p className="ph-catalogue-card-desc">{certificates?.items.length ?? 0}</p>
          </Link>

          <Link href={withLang(ROUTES.profile, locale)} className="ph-catalogue-card">
            <UserIcon size={24} strokeWidth={1.5} aria-hidden="true" />
            <h2 className="ph-catalogue-card-title">{t.profile}</h2>
          </Link>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
