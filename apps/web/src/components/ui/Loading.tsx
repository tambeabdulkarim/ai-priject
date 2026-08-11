// Phase 14.8: reusable loading primitives — the platform previously had
// no Spinner or Skeleton anywhere; every list page showed a bare
// "جارٍ التحميل..." text string while loading (a real finding from
// docs/platform-pixel-audit.md's "Missing Design Work"). One file, one
// component family (Spinner + 3 Skeleton shapes) rather than four
// separate component files, since they share the same shimmer mechanics
// and are always reached for together.
//
// Respects prefers-reduced-motion via the existing global rule in
// globals.css (`@media (prefers-reduced-motion: reduce) { * { animation-
// duration: 0.01ms !important } }`) — no extra handling needed here.

export function Spinner({ size = 22 }: { size?: number }) {
  return (
    <span
      className="ph-spinner"
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="ph-skeleton-card" aria-hidden="true">
      <div className="ph-skel-line ph-skel-title" />
      <div className="ph-skel-line ph-skel-meta" />
      <div className="ph-skel-line ph-skel-desc" />
    </div>
  );
}

/** A grid of SkeletonCard, matching the real `.ph-grid` layout it stands in for. */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="ph-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="ph-skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ph-skel-row">
          <div className="ph-skel-line" style={{ width: '40%' }} />
          <div className="ph-skel-line" style={{ width: '20%' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="ph-skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="ph-skel-table-row">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="ph-skel-line" />
          ))}
        </div>
      ))}
    </div>
  );
}
