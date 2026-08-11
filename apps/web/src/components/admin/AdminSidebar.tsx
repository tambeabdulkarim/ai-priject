'use client';

// Shared Admin Workspace sidebar — links only to sections this phase
// actually built (Dashboard/Audit Logs/Analytics/Settings/Users). The
// Settings link is hidden for a plain `admin` (SETTINGS_ROLES is
// superadmin-only per prisma/seed.ts — see constants/routes.ts), not
// shown-then-403'd.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScrollText, LineChart, Settings, Users } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, withLang, SETTINGS_ROLES } from '../../constants/routes';

const COPY = {
  ar: {
    dashboard: 'لوحة التحكم',
    auditLogs: 'سجل التدقيق',
    analytics: 'التحليلات',
    settings: 'الإعدادات',
    users: 'إدارة المستخدمين',
  },
  en: {
    dashboard: 'Dashboard',
    auditLogs: 'Audit logs',
    analytics: 'Analytics',
    settings: 'Settings',
    users: 'Users',
  },
} as const;

export function AdminSidebar({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.ar;
  const pathname = usePathname();
  const { hasAnyRole } = useAuth();

  const items = [
    {
      href: withLang(ROUTES.adminDashboard, locale),
      label: t.dashboard,
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: withLang(ROUTES.adminAuditLogs, locale),
      label: t.auditLogs,
      icon: ScrollText,
      show: true,
    },
    {
      href: withLang(ROUTES.adminAnalytics, locale),
      label: t.analytics,
      icon: LineChart,
      show: true,
    },
    { href: withLang(ROUTES.adminUsers, locale), label: t.users, icon: Users, show: true },
    {
      href: withLang(ROUTES.adminSettings, locale),
      label: t.settings,
      icon: Settings,
      show: hasAnyRole([...SETTINGS_ROLES]),
    },
  ];

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
      {items
        .filter((item) => item.show)
        .map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'ph-btn-grad' : 'ph-btn-outline'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'flex-start',
              }}
            >
              <Icon size={16} strokeWidth={1.5} aria-hidden="true" /> {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
