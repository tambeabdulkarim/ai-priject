'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Moon, Bird, Menu, X, Bell, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { locales, type Locale } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationsList } from '@/hooks/useNotifications';
import { ROUTES, withLang } from '@/constants/routes';

// Phase 14.7: this component previously never called useAuth() at all —
// it unconditionally rendered the logged-out Login/Create Account
// buttons on every page, regardless of session state. That was the root
// cause of the Critical "header never reflects logged-in state" finding
// in docs/platform-pixel-audit.md, reproduced identically across every
// authenticated screenshot and every role tested. Fix is to read real
// auth state here, once, since all 38 pages that render <Navigation>
// share this one component.
const AUTH_COPY = {
  ar: { login: 'تسجيل الدخول', register: 'إنشاء حساب', dashboard: 'لوحة التحكم', settings: 'الإعدادات', logout: 'تسجيل الخروج' },
  en: { login: 'Log in', register: 'Create account', dashboard: 'Dashboard', settings: 'Settings', logout: 'Log out' },
} as const;

type NavigationProps = { locale: Locale };

// docs/16-API-CONTRACT.md: hrefs corrected during Frontend Phase 3 to
// point at the real, now-implemented public pages — previously pointed
// at leftover generic-scaffold routes (/workspace, /projects, /analytics,
// /files, /dashboard) that had nothing to do with the labels shown.
// "أدوات الذكاء التدريبي" (AI tools) now points at the real AI Workspace
// (Frontend Phase 9) — auth-gated by the page itself via RequireAuth,
// same as every other authenticated section linked from this nav bar.
// "المنتجات الرقمية" now points at the real Marketplace (Frontend Phase 8).
const NAV_ITEMS = (locale: Locale) => [
  { href: `/${locale}`, label: 'الرئيسية', active: true },
  { href: `/${locale}/ai`, label: 'أدوات الذكاء التدريبي', active: false },
  { href: `/${locale}/courses`, label: 'المسارات المهنية', active: false },
  { href: `/${locale}/news`, label: 'الأخبار', active: false },
  { href: `/${locale}/library`, label: 'الكتب الإلكترونية', active: false },
  { href: `/${locale}/marketplace`, label: 'المنتجات الرقمية', active: false },
];

export default function Navigation({ locale }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const userMenuId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const t = AUTH_COPY[locale] ?? AUTH_COPY.ar;

  const { status, user, profile, logout } = useAuth();
  const isAuthenticated = status === 'authenticated';

  // services/auth-client.ts's getCurrentAuthUser() — used by
  // recoverSession() on every FRESH page load/refresh while
  // authenticated, which is the common case, not an edge case —
  // deliberately returns `email: ''` (its own comment: a "lighter-weight
  // fallback derived purely from the token" since the JWT itself carries
  // no email claim). `user.email` is only ever populated immediately
  // after an in-app login submission. `profile` (GET /users/me, fetched
  // fresh via React Query whenever a session exists) reliably has the
  // real email regardless of which path authenticated the session — use
  // it first, with `user.email` only as the brief pre-profile-load
  // fallback so the header isn't fully blank for that one fetch.
  const displayEmail = profile?.email || user?.email || '';

  // Real unread count (docs/16-API-CONTRACT.md GET /notifications/me),
  // only fetched once a session exists — this is the "Notifications
  // indicator" the phase brief asks for on the header itself, reusing
  // the same endpoint the Notifications page already reads instead of a
  // new one.
  const { data: notifData } = useNotificationsList({ limit: 1 }, { enabled: isAuthenticated });
  const unreadCount = isAuthenticated ? (notifData?.unreadCount ?? 0) : 0;

  // AuthUser (packages/types/src/auth.ts) has no displayName — the real
  // GET /users/me response is exactly id/email/roles/status/locale/
  // createdAt/mfaEnabled (see MeProfile's own comment). Email is the only
  // real identity string available here; not inventing a name field.
  const initial = (displayEmail[0] ?? '?').toUpperCase();

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    router.push(`/${locale}`);
  };

  const switchLocale = (nextLocale: Locale) => {
    const segments = pathname.split('/').filter(Boolean);
    const idx = segments.findIndex((s) => locales.includes(s as Locale));
    if (idx >= 0) segments[idx] = nextLocale;
    else segments.unshift(nextLocale);
    router.push(`/${segments.join('/')}` || '/');
  };

  // Close the mobile menu on Escape and lock body scroll while it's open.
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  // Close the menu automatically after a route change (e.g. tapping a link).
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navItems = NAV_ITEMS(locale);

  return (
    <>
      <header className="ph-topbar">
        <div className="ph-topbar-inner">
          {/* Brand */}
          <Link href={`/${locale}`} className="ph-brand">
            <span className="ph-brand-icon" aria-hidden="true">
              <Bird size={16} strokeWidth={2} />
            </span>
            <div>
              <div className="ph-brand-name">Phoenix Project</div>
              <div className="ph-brand-tag">منصة تبني مهاراتك، خطوة بخطوة</div>
            </div>
          </Link>

          {/* Desktop nav links — unchanged */}
          <nav className="ph-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`ph-nav-link${item.active ? ' ph-nav-active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <span className="ph-nav-link ph-nav-more">المزيد ▾</span>
          </nav>

          {/* Actions */}
          <div className="ph-nav-actions">
            <button type="button" className="ph-icon-btn" aria-label="Search">
              <Search size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            {isAuthenticated && (
              <Link
                href={withLang(ROUTES.notifications, locale)}
                className="ph-icon-btn"
                aria-label={locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                style={{ position: 'relative' }}
              >
                <Bell size={16} strokeWidth={2} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="ph-notif-dot" aria-hidden="true">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button type="button" className="ph-icon-btn" aria-label="Toggle theme">
              <Moon size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <div className="ph-lang-pill">
              {locales.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchLocale(l)}
                  aria-pressed={locale === l}
                  className={`ph-lang-btn${locale === l ? ' ph-lang-active' : ''}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="ph-user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="ph-user-trigger"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-controls={userMenuId}
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                >
                  <span className="ph-user-avatar" aria-hidden="true">
                    {initial}
                  </span>
                  <span>{displayEmail}</span>
                </button>
                {isUserMenuOpen && (
                  <div id={userMenuId} className="ph-user-dropdown" role="menu">
                    <div className="ph-user-dropdown-header">
                      <div className="ph-user-dropdown-email">{displayEmail}</div>
                    </div>
                    <Link
                      href={withLang(ROUTES.dashboard, locale)}
                      className="ph-user-dropdown-item"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <LayoutDashboard size={15} strokeWidth={2} aria-hidden="true" />
                      {t.dashboard}
                    </Link>
                    <Link
                      href={withLang(ROUTES.settings, locale)}
                      className="ph-user-dropdown-item"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={15} strokeWidth={2} aria-hidden="true" />
                      {t.settings}
                    </Link>
                    <button
                      type="button"
                      className="ph-user-dropdown-item ph-danger"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href={`/${locale}/login`} className="ph-btn-outline">
                  {t.login}
                </Link>
                <Link href={`/${locale}/register`} className="ph-btn-grad">
                  {t.register}
                </Link>
              </>
            )}

            {/* Mobile hamburger — only visible below the tablet breakpoint */}
            <button
              type="button"
              className="ph-menu-btn ph-icon-btn"
              aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={isMenuOpen}
              aria-controls={menuId}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? (
                <X size={20} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Menu size={20} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer — rendered outside <header> because its
          backdrop-filter creates a containing block for position:fixed
          descendants, which broke height:100% (it was sizing against the
          ~100px header instead of the viewport). */}
      <div
        id={menuId}
        className={`ph-mobile-menu${isMenuOpen ? ' ph-mobile-menu-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={!isMenuOpen}
      >
        <nav className="ph-mobile-nav" aria-label="Mobile primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`ph-mobile-nav-link${item.active ? ' ph-nav-active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ph-mobile-menu-actions">
          {isAuthenticated ? (
            <>
              <Link
                href={withLang(ROUTES.dashboard, locale)}
                className="ph-btn-outline"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.dashboard}
              </Link>
              <button
                type="button"
                className="ph-btn-grad"
                onClick={() => {
                  setIsMenuOpen(false);
                  void handleLogout();
                }}
              >
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="ph-btn-outline"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="ph-btn-grad"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.register}
              </Link>
            </>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <button
          type="button"
          className="ph-mobile-menu-backdrop"
          aria-label="إغلاق القائمة"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}
