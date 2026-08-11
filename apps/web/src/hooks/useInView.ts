import { useEffect, useRef, useState } from 'react';

/**
 * Phase 13.3 — minimal IntersectionObserver wrapper. Once an element has
 * been seen, stays "in view" permanently (observer disconnects) — a
 * preview that scrolled into view once doesn't need to re-fetch its
 * signed URL just because it scrolled back out.
 */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === 'undefined') {
      // No IO support (or SSR) — fail open rather than never rendering a preview.
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return { ref, inView };
}
