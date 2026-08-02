import { sanitizeRichText } from './sanitize-html';

describe('sanitizeRichText', () => {
  it('strips script tags', () => {
    const result = sanitizeRichText('<p>Hello</p><script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Hello</p>');
  });

  it('strips disallowed attributes like onerror', () => {
    const result = sanitizeRichText('<img src="x.png" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
  });

  it('keeps allowlisted tags and attributes', () => {
    const result = sanitizeRichText('<p>Text with <a href="https://example.com">a link</a></p>');
    expect(result).toContain('<a href="https://example.com">a link</a>');
  });

  it('strips disallowed tags such as iframe', () => {
    const result = sanitizeRichText('<iframe src="https://evil.example"></iframe><p>safe</p>');
    expect(result).not.toContain('<iframe');
    expect(result).toContain('<p>safe</p>');
  });
});
