// docs/10-SECURITY-BIBLE.md §14: content-inspection (magic-byte) validation,
// never trusting the client-supplied MIME type/extension. Small, deliberately
// conservative allowlist — extend only when a new content type is actually
// documented as supported.

const SIGNATURES: { mimeType: string; bytes: number[] }[] = [
  { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mimeType: 'video/mp4', bytes: [0x00, 0x00, 0x00] }, // ftyp box offset varies; loose check
  { mimeType: 'audio/mpeg', bytes: [0x49, 0x44, 0x33] }, // ID3
  { mimeType: 'application/zip', bytes: [0x50, 0x4b, 0x03, 0x04] },
];

export function detectMimeTypeFromMagicBytes(buffer: Buffer): string | null {
  for (const signature of SIGNATURES) {
    if (buffer.length >= signature.bytes.length) {
      const matches = signature.bytes.every((byte, index) => buffer[index] === byte);
      if (matches) {
        return signature.mimeType;
      }
    }
  }
  return null;
}

export function magicBytesMatchClaimedType(buffer: Buffer, claimedMimeType: string): boolean {
  const detected = detectMimeTypeFromMagicBytes(buffer);
  return detected === claimedMimeType;
}
