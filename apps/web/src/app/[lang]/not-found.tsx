// Next.js special file — rendered automatically for any unmatched route
// under /[lang]/... or when notFound() is called (e.g. News/Courses/
// Library detail pages on a RESOURCE_NOT_FOUND from the backend).
// Server Component (no 'use client') — matches Next.js's own convention
// for not-found.tsx.

import Link from 'next/link';
import { defaultLocale } from '@/lib/i18n';

export default function NotFound() {
  // not-found.tsx cannot read the [lang] route param (it renders when no
  // segment matched), so it falls back to the default locale — the same
  // constraint applies to every Next.js app using this pattern.
  const locale = defaultLocale;
  const isAr = locale === 'ar';

  return (
    <div className="ph-error-page">
      <div className="ph-error-code">404</div>
      <h1 className="ph-error-title">{isAr ? 'الصفحة غير موجودة' : 'Page not found'}</h1>
      <p className="ph-error-desc">
        {isAr
          ? 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
          : 'The page you’re looking for doesn’t exist or has moved.'}
      </p>
      <Link href={`/${locale}`} className="ph-btn-grad">
        {isAr ? 'العودة إلى الرئيسية' : 'Back to home'}
      </Link>
    </div>
  );
}
