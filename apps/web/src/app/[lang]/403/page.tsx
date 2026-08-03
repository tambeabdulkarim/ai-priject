'use client';

// Custom 403 page — not a Next.js special file (unlike 404/500), just a
// regular route. Reached via guards/RequireRole.tsx's redirect when an
// authenticated user lacks the role for a route-group-level page. Per
// docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §4.13, an in-page 403 from a
// specific action is rendered inline where it happened instead — this
// page is only for the "wrong navigation entirely" case.

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import { ROUTES, withLang } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'غير مصرح لك بالوصول',
    desc: 'ليس لديك صلاحية للوصول إلى هذه الصفحة.',
    home: 'العودة إلى الرئيسية',
  },
  en: {
    title: 'Access denied',
    desc: 'You don’t have permission to view this page.',
    home: 'Back to home',
  },
} as const;

export default function ForbiddenPage() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;

  return (
    <div className="ph-error-page">
      <div className="ph-error-code">403</div>
      <h1 className="ph-error-title">{t.title}</h1>
      <p className="ph-error-desc">{t.desc}</p>
      <Link href={withLang(ROUTES.home, locale)} className="ph-btn-grad">
        {t.home}
      </Link>
    </div>
  );
}
