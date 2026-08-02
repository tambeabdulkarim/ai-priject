// Jest-only substitute for `isomorphic-dompurify`. The real library pulls
// in `jsdom`, whose own dependency tree includes several ESM-only
// packages (`@asamuzakjp/css-color`, `cssstyle`, etc.) that this
// project's CommonJS/ts-jest test setup cannot parse — a tooling
// limitation, not a production issue (the real library compiles and runs
// correctly under `nest build`/`node dist/main.js`, confirmed via a live
// smoke test). This substitute performs the same class of allowlist
// sanitization (strip disallowed tags/attributes, always strip
// <script>/<iframe> and on*= handlers) using regex — a real, correct-for-
// its-purpose implementation, not a pass-through stub — so unit tests
// against `sanitizeRichText` still exercise genuine stripping behavior.

interface SanitizeOptions {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
}

function sanitize(html: string, options: SanitizeOptions = {}): string {
  const allowedTags = new Set((options.ALLOWED_TAGS ?? []).map((t) => t.toLowerCase()));
  const allowedAttrs = new Set((options.ALLOWED_ATTR ?? []).map((a) => a.toLowerCase()));

  // Always-stripped dangerous elements, regardless of allowlist.
  let result = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<iframe\b[^>]*\/?>/gi, '');

  // Strip any tag not on the allowlist (keeps inner text).
  result = result.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (match, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      return '';
    }
    const isClosing = match.startsWith('</');
    if (isClosing) {
      return `</${tag}>`;
    }
    const cleanedAttrs = (attrs.match(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g) ?? [])
      .filter((pair: string) => {
        const attrName = pair.split('=')[0].trim().toLowerCase();
        return allowedAttrs.has(attrName) && !attrName.startsWith('on');
      })
      .join(' ');
    return cleanedAttrs ? `<${tag} ${cleanedAttrs}>` : `<${tag}>`;
  });

  return result;
}

export default { sanitize };
