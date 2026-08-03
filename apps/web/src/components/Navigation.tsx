'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Moon, Bird, Menu, X } from 'lucide-react';
import { locales, type Locale } from '@/lib/i18n';

type NavigationProps = { locale: Locale };

// docs/16-API-CONTRACT.md: hrefs corrected during Frontend Phase 3 to
// point at the real, now-implemented public pages — previously pointed
// at leftover generic-scaffold routes (/workspace, /projects, /analytics,
// /files, /dashboard) that had nothing to do with the labels shown.
// "أدوات الذكاء التدريبي" (AI tools) and "المنتجات الرقمية" (digital
// products/Marketplace) are left pointing at their prior targets — AI and
// Marketplace are explicitly out of scope this phase, not yet real pages.
const NAV_ITEMS = (locale: Locale) => [
  { href: `/${locale}`, label: 'الرئيسية', active: true },
  { href: `/${locale}/workspace`, label: 'أدوات الذكاء التدريبي', active: false },
  { href: `/${locale}/courses`, label: 'المسارات المهنية', active: false },
  { href: `/${locale}/news`, label: 'الأخبار', active: false },
  { href: `/${locale}/library`, label: 'الكتب الإلكترونية', active: false },
  { href: `/${locale}/dashboard`, label: 'المنتجات الرقمية', active: false },
];

export default function Navigation({ locale }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <span className="ph-brand-icon" aria-hidden="true"><Bird size={16} strokeWidth={2} /></span>
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
          <Link href={`/${locale}/login`} className="ph-btn-outline">تسجيل الدخول</Link>
          <Link href={`/${locale}/register`} className="ph-btn-grad">إنشاء حساب</Link>

          {/* Mobile hamburger — only visible below the tablet breakpoint */}
          <button
            type="button"
            className="ph-menu-btn ph-icon-btn"
            aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={20} strokeWidth={2} aria-hidden="true" /> : <Menu size={20} strokeWidth={2} aria-hidden="true" />}
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
          <Link href={`/${locale}/login`} className="ph-btn-outline" onClick={() => setIsMenuOpen(false)}>تسجيل الدخول</Link>
          <Link href={`/${locale}/register`} className="ph-btn-grad" onClick={() => setIsMenuOpen(false)}>إنشاء حساب</Link>
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
