// Phase 14.7: reusable EmptyState (phase addendum + docs/platform-pixel-audit.md
// "Missing Design Work" #4). The platform's inline empty states
// (My Courses, Certificates, Checkout, Notifications, Media Manager) were
// independently found to be the single most visually consistent pattern
// on the whole product — this formalizes that existing pattern into one
// component instead of replacing it with something new.

import type { ReactNode } from 'react';
import Link from 'next/link';

type EmptyStateAction = { label: string; href: string };

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}) {
  return (
    <div className="ph-empty-state">
      {icon && (
        <div className="ph-empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="ph-empty-state-title">{title}</p>
      {description && <p className="ph-empty-state-desc">{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="ph-empty-state-actions">
          {primaryAction && (
            <Link href={primaryAction.href} className="ph-btn-grad">
              {primaryAction.label}
            </Link>
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href} className="ph-btn-outline">
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
