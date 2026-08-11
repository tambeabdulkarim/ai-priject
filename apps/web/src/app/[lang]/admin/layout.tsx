'use client';

// Shared Admin Workspace shell — Sidebar + Breadcrumbs + RequireRole gate,
// wrapping every /admin/* page so none of them re-implement the
// role-gate/nav chrome individually. Reuses the existing global
// Navigation/Footer/RequireRole/AppProviders (QueryClient/Auth), adding
// nothing new to the provider tree.

import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../guards/RequireRole';
import { AdminSidebar } from '../../../components/admin/AdminSidebar';
import { AdminBreadcrumbs } from '../../../components/admin/AdminBreadcrumbs';
import { ADMIN_ROLES } from '../../../constants/routes';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';

  return (
    <RequireRole roles={[...ADMIN_ROLES]}>
      <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
        <Navigation locale={locale} />
        <main
          className="ph-page"
          style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}
        >
          <AdminSidebar locale={locale} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <AdminBreadcrumbs locale={locale} />
            {children}
          </div>
        </main>
        <Footer locale={locale} />
      </div>
    </RequireRole>
  );
}
