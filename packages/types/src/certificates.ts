// docs/16-API-CONTRACT.md §8 (Certificates). Verified against
// apps/api/src/modules/certificates/{certificates.service.ts,certificates.controller.ts}.

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  certificateNumber: string;
  issuedAt: string;
  revokedAt: string | null;
  pdfFileId: string | null;
}

/** GET /certificates/:id's real shape — the certificate plus a resolved signed PDF URL (null if no PDF has been generated yet — no PDF-rendering service exists in this backend, so `pdfUrl` is expected to be null for every certificate today; see certificates.service.ts's file header). */
export interface CertificateWithPdfUrl {
  certificate: Certificate;
  pdfUrl: string | null;
}

/** GET /certificates/verify/:certificateNumber — public, data-minimized (docs/13-DATABASE-BLUEPRINT.md Certificates Security Notes: "no other user data"). */
export interface VerifyCertificateResponse {
  valid: true;
  holderDisplayName: string;
  courseTitle: string;
  issuedAt: string;
}
