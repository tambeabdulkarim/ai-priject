'use client';

// Derives breadcrumb labels purely from the current pathname's segments
// after `/[lang]/admin` — no hidden routing table to keep in sync, works
// for every admin page (including dynamic `[id]`/`[key]` segments,
// shown as the raw param value since there's no name to look up without
// an extra fetch).

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import { ROUTES, withLang } from '../../constants/routes';

const SEGMENT_LABELS: Record<string, { ar: string; en: string }> = {
  admin: { ar: 'المشرف', en: 'Admin' },
  'audit-logs': { ar: 'سجل التدقيق', en: 'Audit logs' },
  analytics: { ar: 'التحليلات', en: 'Analytics' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  users: { ar: 'المستخدمون', en: 'Users' },
};

export function AdminBreadcrumbs({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? '';
  const segments = pathname.split('/').filter(Boolean).slice(1); // drop the leading [lang] segment

  return (
    <nav
      aria-label="breadcrumb"
      style={{ marginBottom: '1rem', fontSize: '0.875rem', opacity: 0.8 }}
    >
      <Link href={withLang(ROUTES.adminDashboard, locale)}>{SEGMENT_LABELS.admin[locale]}</Link>
      {segments.slice(1).map((segment, index) => {
        const fullHref = `/${locale}/${segments.slice(0, index + 2).join('/')}`;
        const label = SEGMENT_LABELS[segment]?.[locale] ?? decodeURIComponent(segment);
        const isLast = index === segments.length - 2;
        return (
          <span key={fullHref}>
            {' / '}
            {isLast ? <span>{label}</span> : <Link href={fullHref}>{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
