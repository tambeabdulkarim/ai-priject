'use client';

// docs/16-API-CONTRACT.md §17 (Notifications), via hooks/useNotifications.ts.

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Bell, Check, CheckCheck } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireAuth } from '../../../guards/RequireAuth';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useNotificationsList,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../../../hooks/useNotifications';

const COPY = {
  ar: {
    title: 'الإشعارات',
    all: 'الكل',
    unread: 'غير مقروء',
    read: 'مقروء',
    markAllRead: 'وضع علامة على الكل كمقروء',
    markRead: 'وضع علامة كمقروء',
    loading: 'جارٍ التحميل...',
    error: 'تعذّر تحميل الإشعارات.',
    empty: 'لا توجد إشعارات.',
  },
  en: {
    title: 'Notifications',
    all: 'All',
    unread: 'Unread',
    read: 'Read',
    markAllRead: 'Mark all as read',
    markRead: 'Mark as read',
    loading: 'Loading...',
    error: 'Couldn’t load notifications.',
    empty: 'No notifications.',
  },
} as const;

function NotificationsContent() {
  const params = useParams<{ lang: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const [filter, setFilter] = useState<'read' | 'unread' | undefined>(undefined);
  const { data, isLoading, isError } = useNotificationsList({ status: filter, limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <div className="ph-sec-hdr">
          <h1 className="ph-page-title" style={{ marginBottom: 0 }}>
            {t.title}
            {typeof data?.unreadCount === 'number' && data.unreadCount > 0
              ? ` (${data.unreadCount})`
              : ''}
          </h1>
          <button
            type="button"
            className="ph-btn-outline"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || !data?.unreadCount}
          >
            <CheckCheck size={16} strokeWidth={2} aria-hidden="true" /> {t.markAllRead}
          </button>
        </div>

        <div className="ph-filters">
          <button
            type="button"
            className="ph-btn-outline"
            aria-pressed={filter === undefined}
            onClick={() => setFilter(undefined)}
          >
            {t.all}
          </button>
          <button
            type="button"
            className="ph-btn-outline"
            aria-pressed={filter === 'unread'}
            onClick={() => setFilter('unread')}
          >
            {t.unread}
          </button>
          <button
            type="button"
            className="ph-btn-outline"
            aria-pressed={filter === 'read'}
            onClick={() => setFilter('read')}
          >
            {t.read}
          </button>
        </div>

        {isLoading && <p className="ph-state">{t.loading}</p>}
        {isError && <p className="ph-state">{t.error}</p>}
        {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
          <EmptyState icon={<Bell size={24} strokeWidth={1.5} />} title={t.empty} />
        )}

        <div style={{ marginTop: '1.5rem' }}>
          {data?.items.map((notification) => (
            <div
              key={notification.id}
              className="ph-module"
              style={{ opacity: notification.readAt ? 0.6 : 1 }}
            >
              <div className="ph-lesson-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={16} strokeWidth={2} aria-hidden="true" />
                  <strong>{notification.title}</strong>
                </span>
                {!notification.readAt && (
                  <button
                    type="button"
                    className="ph-btn-outline"
                    onClick={() => markRead.mutate(notification.id)}
                    disabled={markRead.isPending}
                  >
                    <Check size={14} strokeWidth={2} aria-hidden="true" /> {t.markRead}
                  </button>
                )}
              </div>
              {notification.body && <p className="ph-catalogue-card-desc">{notification.body}</p>}
              <span className="ph-lesson-locked">
                {new Date(notification.createdAt).toLocaleString(locale)}
              </span>
            </div>
          ))}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}
