'use client';

// Renders a friendly, honest explanation for the specific real backend
// error a failed AI call returned — 501 (BLOCKED BY DOCUMENTATION, the
// real, permanent state of POST /ai/requests), 402/429 (quota/payment,
// documented by docs/16-API-CONTRACT.md but never actually produced by
// this backend since dispatch never reaches that logic), or any other
// real error code, via the existing shared `getErrorMessage` mapping.
// Never retries automatically — the caller decides if/when to offer a
// manual retry action.

import { ApiError } from '@phoenix/api-client';
import { getErrorMessage } from '../../utils/errors';

const COPY = {
  ar: {
    blockedTitle: 'هذه الميزة محظورة حاليًا حسب التوثيق',
    blockedBody:
      'الخادم الحقيقي يرفض هذا الطلب دائمًا (HTTP 501) لأن وثيقة تكامل الذكاء الاصطناعي لا تحدد فهرس الميزات، ولا مخطط الإدخال لكل ميزة، ولا مفاتيح الصلاحيات، ولا تطبيقًا فعليًا لمزوّد خارجي. هذا ليس خطأ مؤقتًا ولن يُحل بإعادة المحاولة.',
    quotaTitle: 'تجاوزت الحصة أو مطلوب دفع',
    quotaBody: 'أعاد الخادم خطأ متعلقًا بالحصة أو الدفع.',
    genericTitle: 'تعذّر إتمام الطلب',
  },
  en: {
    blockedTitle: 'This feature is currently blocked by documentation',
    blockedBody:
      'The real backend always rejects this request (HTTP 501) because the AI Integration Bible defines no feature catalog, no per-feature input schema, no permission keys, and no real external-provider implementation. This is not a transient error and will not resolve by retrying.',
    quotaTitle: 'Quota exceeded or payment required',
    quotaBody: 'The backend returned a quota- or payment-related error.',
    genericTitle: 'Request failed',
  },
} as const;

export interface BlockedRequestNoticeProps {
  error: unknown;
  locale: 'ar' | 'en';
}

export function BlockedRequestNotice({ error, locale }: BlockedRequestNoticeProps) {
  const t = COPY[locale] ?? COPY.ar;
  const isNotImplemented =
    error instanceof ApiError && (error.status === 501 || error.code === 'NOT_IMPLEMENTED');
  const isQuotaOrPayment =
    error instanceof ApiError &&
    (error.status === 402 ||
      error.status === 429 ||
      error.code === 'PAYMENT_REQUIRED' ||
      error.code === 'RATE_LIMITED');

  const title = isNotImplemented
    ? t.blockedTitle
    : isQuotaOrPayment
      ? t.quotaTitle
      : t.genericTitle;
  const body = isNotImplemented
    ? t.blockedBody
    : isQuotaOrPayment
      ? t.quotaBody
      : getErrorMessage(error);

  return (
    <div className="ph-form-error" role="alert">
      <strong>{title}</strong>
      <p style={{ marginTop: '0.5rem' }}>{body}</p>
      {error instanceof ApiError && (
        <p style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.85rem' }}>
          {error.code} · HTTP {error.status} · {error.message}
        </p>
      )}
    </div>
  );
}
