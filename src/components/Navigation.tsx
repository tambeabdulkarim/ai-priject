'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';

type NavigationProps = { locale: Locale };

export default function Navigation({ locale }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (nextLocale: Locale) => {
    const segments = pathname.split('/').filter(Boolean);
    const idx = segments.findIndex((s) => locales.includes(s as Locale));
    if (idx >= 0) segments[idx] = nextLocale;
    else segments.unshift(nextLocale);
    router.push(`/${segments.join('/')}` || '/');
  };

  return (
    <header className="ph-topbar">
      <div className="ph-topbar-inner">

        {/* Brand */}
        <Link href={`/${locale}`} className="ph-brand">
          <span className="ph-brand-icon">🦅</span>
          <div>
            <div className="ph-brand-name">Phoenix Project</div>
            <div className="ph-brand-tag">منصة تبني مهاراتك، خطوة بخطوة</div>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="ph-nav" aria-label="Primary navigation">
          <Link href={`/${locale}`}              className="ph-nav-link ph-nav-active">الرئيسية</Link>
          <Link href={`/${locale}/workspace`}    className="ph-nav-link">أدوات الذكاء التدريبي</Link>
          <Link href={`/${locale}/projects`}     className="ph-nav-link">المسارات المهنية</Link>
          <Link href={`/${locale}/analytics`}    className="ph-nav-link">الأخبار</Link>
          <Link href={`/${locale}/files`}         className="ph-nav-link">الكتب الإلكترونية</Link>
          <Link href={`/${locale}/dashboard`}    className="ph-nav-link">المنتجات الرقمية</Link>
          <span className="ph-nav-link ph-nav-more">المزيد ▾</span>
        </nav>

        {/* Actions */}
        <div className="ph-nav-actions">
          <button type="button" className="ph-icon-btn" aria-label="Search">🔍</button>
          <div className="ph-lang-pill">
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => switchLocale(l)}
                className={`ph-lang-btn${locale === l ? ' ph-lang-active' : ''}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" className="ph-icon-btn" aria-label="Toggle theme">🌙</button>
          <button type="button" className="ph-btn-outline">تسجيل الدخول</button>
          <button type="button" className="ph-btn-grad">إنشاء حساب</button>
        </div>

      </div>
    </header>
  );
}
