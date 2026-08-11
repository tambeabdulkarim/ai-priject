// docs/10-SECURITY-BIBLE.md §14: content-inspection (magic-byte) validation,
// never trusting the client-supplied MIME type/extension. Small, deliberately
// conservative allowlist — extend only when a new content type is actually
// documented as supported.
//
// Each signature is a list of (offset, bytes) checks — ALL must match. Two
// signatures were tightened during the Phase 13 final audit: `image/webp`
// previously matched on the generic 4-byte RIFF container header alone
// (bytes 0-3), which any RIFF-based format (WAV, AVI, ...) also satisfies;
// it now also verifies the `WEBP` FourCC at offset 8-11. `video/mp4`
// previously matched on 3 null bytes at offset 0 with a comment admitting
// it was a "loose check" many non-MP4 binaries could satisfy by
// coincidence; it now checks for the standard `ftyp` box type at offset
// 4-7, the actual robust MP4 signature.
const SIGNATURES: { mimeType: string; checks: { offset: number; bytes: number[] }[] }[] = [
  { mimeType: 'image/jpeg', checks: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  {
    mimeType: 'image/png',
    checks: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  },
  {
    mimeType: 'image/webp',
    checks: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
    ],
  },
  { mimeType: 'application/pdf', checks: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }] },
  { mimeType: 'video/mp4', checks: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }] }, // "ftyp"
  { mimeType: 'audio/mpeg', checks: [{ offset: 0, bytes: [0x49, 0x44, 0x33] }] }, // ID3
  { mimeType: 'application/zip', checks: [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }] },
];

export function detectMimeTypeFromMagicBytes(buffer: Buffer): string | null {
  for (const signature of SIGNATURES) {
    const matches = signature.checks.every(
      ({ offset, bytes }) =>
        buffer.length >= offset + bytes.length &&
        bytes.every((byte, i) => buffer[offset + i] === byte),
    );
    if (matches) {
      return signature.mimeType;
    }
  }
  return null;
}

export function magicBytesMatchClaimedType(buffer: Buffer, claimedMimeType: string): boolean {
  const detected = detectMimeTypeFromMagicBytes(buffer);
  return detected === claimedMimeType;
}
