'use client';

// Next.js special file — the outermost error boundary, catching errors
// even in the root layout itself (where app/[lang]/error.tsx can't
// reach). Must render its own <html>/<body> since it replaces the entire
// root layout when triggered — this is the one legitimate exception to
// "content only" among this phase's error-page files.

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global error boundary]', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="ph-error-page">
          <div className="ph-error-code">500</div>
          <h1 className="ph-error-title">حدث خطأ غير متوقع</h1>
          <p className="ph-error-desc">نأسف على الإزعاج. حاول تحديث الصفحة.</p>
          <button type="button" className="ph-btn-grad" onClick={() => reset()}>
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
