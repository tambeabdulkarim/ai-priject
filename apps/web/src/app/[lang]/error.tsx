'use client';

// Next.js special file — a React error boundary for this route segment.
// MUST be a Client Component (Next.js requirement). Catches any
// unhandled render-time error under /[lang]/... (a genuine bug, not a
// documented ApiError — those are handled in-page per §2.5/§4.13 of
// docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md, never allowed to reach here
// as an uncaught throw).

import { useEffect } from 'react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[app error boundary]', error);
  }, [error]);

  return (
    <div className="ph-error-page">
      <div className="ph-error-code">500</div>
      <h1 className="ph-error-title">حدث خطأ غير متوقع</h1>
      <p className="ph-error-desc">
        نأسف على الإزعاج. يمكنك المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" className="ph-btn-grad" onClick={() => reset()}>
          إعادة المحاولة
        </button>
        <a href="/" className="ph-btn-outline">
          الصفحة الرئيسية
        </a>
      </div>
    </div>
  );
}
