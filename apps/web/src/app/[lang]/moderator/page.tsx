'use client';

// Moderation Dashboard. "Pending review count" / "flagged comments
// count" are NOT exact totals — see hooks/useModeration.ts and
// packages/types/src/moderation.ts: no paginated response anywhere in
// this backend carries a `total`/count field, so these numbers are the
// first page's item count, with an explicit "+ more" indicator whenever
// a `nextCursor` shows there are additional pages. Not a fabricated
// total. "Recent moderation activity" is sourced from GET
// /admin/audit-logs, which requires `audit:read` — held only by
// admin/superadmin, NOT a plain moderator (prisma/seed.ts). A plain
// moderator therefore sees an explicit BLOCKED notice instead, never a
// silently empty or fake activity feed.

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShieldAlert, MessageSquareWarning, History } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../guards/RequireRole';
import { useAuth } from '../../../hooks/useAuth';
import { useModerationQueue, useAuditLogs } from '../../../hooks/useModeration';
import { getErrorMessage } from '../../../utils/errors';
import { ROUTES, withLang, MODERATOR_ROLES, AUDIT_READ_ROLES } from '../../../constants/routes';

const COPY = {
  ar: {
    title: 'مساحة المشرف',
    subtitle: 'مراجعة الدورات المرسلة والتعليقات المبلّغ عنها.',
    pendingCourses: 'دورات قيد المراجعة',
    flaggedComments: 'تعليقات مبلّغ عنها',
    more: '+ المزيد',
    openQueue: 'فتح قائمة المراجعة',
    recentActivity: 'أحدث إجراءات الإشراف',
    activityBlocked:
      'يتطلب هذا صلاحية "admin" لعرض سجل التدقيق (audit:read). دور المشرف (moderator) لا يملك هذه الصلاحية في الخادم الحقيقي.',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل البيانات.',
    empty: 'لا توجد إجراءات مسجّلة.',
  },
  en: {
    title: 'Moderator workspace',
    subtitle: 'Review submitted courses and flagged comments.',
    pendingCourses: 'Courses in review',
    flaggedComments: 'Flagged comments',
    more: '+ more',
    openQueue: 'Open moderation queue',
    recentActivity: 'Recent moderation activity',
    activityBlocked:
      'Requires the "admin" permission to view the audit trail (audit:read). The moderator role does not hold this permission on the real backend.',
    loading: 'Loading...',
    error: 'Couldn’t load data.',
    empty: 'No recorded actions.',
  },
} as const;

function ModeratorDashboardContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const { hasAnyRole } = useAuth();

  const coursesQueue = useModerationQueue('course');
  const commentsQueue = useModerationQueue('comment');
  const canViewAudit = hasAnyRole([...AUDIT_READ_ROLES]);
  const auditLogs = useAuditLogs({ limit: 10 }, canViewAudit);

  const coursesPage = coursesQueue.data?.pages[0]?.courses;
  const commentsPage = commentsQueue.data?.pages[0]?.comments;

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{t.title}</h1>
        <p className="ph-page-subtitle">{t.subtitle}</p>

        <div
          className="ph-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
        >
          <Link href={withLang(ROUTES.moderationQueue, locale)} className="ph-catalogue-card">
            <ShieldAlert size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.pendingCourses}</div>
            <p className="ph-catalogue-card-desc">
              {coursesQueue.isLoading ? t.loading : (coursesPage?.items.length ?? 0)}
              {coursesPage?.nextCursor ? ` ${t.more}` : ''}
            </p>
          </Link>
          <Link href={withLang(ROUTES.moderationQueue, locale)} className="ph-catalogue-card">
            <MessageSquareWarning size={20} strokeWidth={1.5} aria-hidden="true" />
            <div className="ph-catalogue-card-title">{t.flaggedComments}</div>
            <p className="ph-catalogue-card-desc">
              {commentsQueue.isLoading ? t.loading : (commentsPage?.items.length ?? 0)}
              {commentsPage?.nextCursor ? ` ${t.more}` : ''}
            </p>
          </Link>
        </div>

        <Link
          href={withLang(ROUTES.moderationQueue, locale)}
          className="ph-btn-grad"
          style={{ marginTop: '1.5rem', display: 'inline-flex' }}
        >
          {t.openQueue}
        </Link>

        <section style={{ marginTop: '2.5rem' }}>
          <h2
            className="ph-catalogue-card-title"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <History size={18} strokeWidth={1.5} aria-hidden="true" /> {t.recentActivity}
          </h2>

          {!canViewAudit && (
            <p className="ph-form-error" role="note">
              {t.activityBlocked}
            </p>
          )}

          {canViewAudit && auditLogs.isLoading && <p className="ph-state">{t.loading}</p>}
          {canViewAudit && auditLogs.isError && (
            <p className="ph-state">{getErrorMessage(auditLogs.error)}</p>
          )}
          {canViewAudit && auditLogs.data && auditLogs.data.items.length === 0 && (
            <EmptyState icon={<History size={24} strokeWidth={1.5} />} title={t.empty} />
          )}

          {canViewAudit && auditLogs.data && auditLogs.data.items.length > 0 && (
            <ul className="ph-form" style={{ gap: '0.5rem' }}>
              {auditLogs.data.items.map((entry) => (
                <li key={entry.id} className="ph-catalogue-card" style={{ cursor: 'default' }}>
                  <strong>{entry.action}</strong> — {entry.targetType} ({entry.targetId})
                  <div className="ph-catalogue-card-meta">
                    {new Date(entry.occurredAt).toLocaleString(locale)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function ModeratorDashboardPage() {
  return (
    <RequireRole roles={[...MODERATOR_ROLES]}>
      <ModeratorDashboardContent />
    </RequireRole>
  );
}
