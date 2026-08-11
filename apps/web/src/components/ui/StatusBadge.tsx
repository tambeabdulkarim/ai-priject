// Phase 14.7: the one shared status component every list/detail screen
// should use instead of rendering `{item.status}` as plain text — a
// repeated High-priority finding in docs/platform-pixel-audit.md
// (Instructor Dashboard course cards, Orders). Colors are semantic
// (draft=grey, in-review=blue, published/paid/completed=green,
// pending=amber, failed/cancelled=red), not per-page, so the same status
// always reads the same way anywhere it appears.
//
// Deliberately a plain lookup table, not a generic enum mapper: the real
// status vocabulary across this codebase (packages/types/src/{courses,
// marketplace}.ts) is a small, fixed, already-known set. Extending it
// when a new status is added elsewhere is a one-line addition here.

import type { Locale } from '@/lib/i18n';

export type KnownStatus =
  | 'draft'
  | 'in_review'
  | 'published'
  | 'archived'
  | 'pending'
  | 'paid'
  | 'succeeded'
  | 'refunded'
  | 'cancelled'
  | 'failed'
  | 'active'
  | 'suspended'
  | 'deactivated'
  | 'submitted'
  | 'evaluated';

type StatusMeta = { color: 'grey' | 'blue' | 'amber' | 'green' | 'red'; ar: string; en: string };

const STATUS_MAP: Record<string, StatusMeta> = {
  draft: { color: 'grey', ar: 'مسودة', en: 'Draft' },
  in_review: { color: 'blue', ar: 'قيد المراجعة', en: 'In review' },
  published: { color: 'green', ar: 'منشورة', en: 'Published' },
  archived: { color: 'grey', ar: 'مؤرشفة', en: 'Archived' },
  pending: { color: 'amber', ar: 'قيد الانتظار', en: 'Pending' },
  paid: { color: 'green', ar: 'مدفوع', en: 'Paid' },
  succeeded: { color: 'green', ar: 'ناجح', en: 'Succeeded' },
  refunded: { color: 'blue', ar: 'مسترد', en: 'Refunded' },
  cancelled: { color: 'red', ar: 'ملغى', en: 'Cancelled' },
  failed: { color: 'red', ar: 'فشل', en: 'Failed' },
  active: { color: 'green', ar: 'نشط', en: 'Active' },
  suspended: { color: 'amber', ar: 'موقوف', en: 'Suspended' },
  deactivated: { color: 'red', ar: 'معطّل', en: 'Deactivated' },
  submitted: { color: 'amber', ar: 'بانتظار التقييم', en: 'Awaiting evaluation' },
  evaluated: { color: 'green', ar: 'تم التقييم', en: 'Evaluated' },
};

export function StatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const meta = STATUS_MAP[status];
  const label = meta ? (locale === 'ar' ? meta.ar : meta.en) : status;
  const color = meta?.color ?? 'grey';
  return <span className={`ph-status-badge ph-status-${color}`}>{label}</span>;
}
