'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

type NavigationProps = {
  locale: Locale;
};

export default function Navigation({ locale }: NavigationProps) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (nextLocale: Locale) => {
    const segments = pathname.split('/').filter(Boolean);
    const currentLocaleIndex = segments.findIndex((segment) => locales.includes(segment as Locale));

    if (currentLocaleIndex >= 0) {
      segments[currentLocaleIndex] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }

    const nextPath = `/${segments.join('/')}`;
    router.push(nextPath || '/');
  };

  return (
    <header className="topbar">
      <Link href={`/${locale}`} className="brand-link">
        {dict.nav.brand}
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        <Link href={`/${locale}`}>{dict.nav.home}</Link>
        <Link href={`/${locale}#features`}>{dict.nav.features}</Link>
        <Link href={`/${locale}#about`}>{dict.nav.about}</Link>
        <Link href={`/${locale}/workspace`}>{dict.nav.workspace}</Link>
        <Link href={`/${locale}/files`}>{dict.nav.files}</Link>
        <Link href={`/${locale}/projects`}>{dict.nav.projects}</Link>
        <Link href={`/${locale}/analytics`}>{dict.nav.analytics}</Link>
        <Link href={`/${locale}#contact`}>{dict.nav.contact}</Link>
      </nav>

      <div className="lang-switcher" aria-label="Language switcher">
        <button type="button" onClick={() => switchLocale('ar')} className={locale === 'ar' ? 'active' : ''}>
          العربية
        </button>
        <button type="button" onClick={() => switchLocale('en')} className={locale === 'en' ? 'active' : ''}>
          English
        </button>
      </div>
    </header>
  );
}
