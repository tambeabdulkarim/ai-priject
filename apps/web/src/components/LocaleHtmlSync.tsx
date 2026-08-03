'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { locales, defaultLocale } from '@/lib/i18n';

/**
 * The root layout can't read the [lang] route segment (it sits above it
 * and also serves non-locale routes), so <html lang/dir> is set here
 * from the current pathname after hydration — keeps the Homepage route
 * statically prerendered instead of forcing it dynamic via headers().
 */
export default function LocaleHtmlSync() {
  const pathname = usePathname();

  useEffect(() => {
    const segment = pathname.split('/').filter(Boolean)[0];
    const lang = locales.includes(segment as (typeof locales)[number]) ? segment : defaultLocale;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [pathname]);

  return null;
}
