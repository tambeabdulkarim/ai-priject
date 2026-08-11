// Root-level 404 — catches truly unmatched routes outside any /[lang]/...
// segment (e.g. a bare nonexistent path). Rendered inside the existing
// root layout.tsx (which already provides <html>/<body>), so this is
// content only. The locale-aware version at app/[lang]/not-found.tsx
// handles everything under a matched locale segment.

import Link from 'next/link';

export default function RootNotFound() {
  return (
    <div className="ph-error-page">
      <div className="ph-error-code">404</div>
      <h1 className="ph-error-title">الصفحة غير موجودة</h1>
      <p className="ph-error-desc">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
      <Link href="/ar" className="ph-btn-grad">
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}
