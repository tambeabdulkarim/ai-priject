// docs/10-SECURITY-BIBLE.md §10 (XSS Protection): "a server-side sanitizer
// (allowlist-based, e.g., DOMPurify with a strict tag/attribute
// allowlist)" — DOMPurify is explicitly named, so this is a direct
// implementation of the documented mechanism, not an invented one. The
// exact tag/attribute list isn't given (doc10 only states the principle:
// "strict allowlist"), so this is a conservative, rich-text-article-
// appropriate default — the same operational-default pattern already
// used elsewhere (e.g. SessionsService's concurrent-session limits).

import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'code',
  'pre',
  'img',
];
const ALLOWED_ATTR = ['href', 'src', 'alt', 'title'];

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
