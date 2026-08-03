type IconProps = { size?: number };

/** Minimal, production-quality brand marks — lucide-react ships no
 * social/brand icons in the installed version, so these are hand-drawn
 * simplified glyphs instead of generic placeholder icons. */

export function YouTubeIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
    </svg>
  );
}

export function XIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.83-5.97 6.83H1.66l7.73-8.84L1.25 2.25h6.83l4.72 6.24 5.44-6.24Zm-1.16 17.52h1.83L7.02 4.13H5.06l12.02 15.64Z" />
    </svg>
  );
}

export function LinkedInIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.15 1.45-2.15 2.94v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DiscordIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.3 5.35A18.8 18.8 0 0 0 15.6 4c-.2.37-.44.87-.6 1.27a17.5 17.5 0 0 0-5.98 0C8.85 4.87 8.6 4.37 8.4 4a18.7 18.7 0 0 0-4.7 1.36C1.05 9.6.4 13.72.72 17.78a18.9 18.9 0 0 0 5.7 2.83c.46-.62.87-1.28 1.22-1.98a12 12 0 0 1-1.92-.9c.16-.12.32-.24.47-.37a13.6 13.6 0 0 0 11.6 0c.16.13.31.25.47.37-.6.36-1.25.66-1.92.9.35.7.76 1.36 1.22 1.98a18.8 18.8 0 0 0 5.7-2.83c.38-4.7-.78-8.78-3.36-12.43ZM9.6 15.3c-1.03 0-1.87-.93-1.87-2.07 0-1.13.82-2.07 1.87-2.07 1.05 0 1.9.94 1.88 2.07 0 1.14-.83 2.07-1.88 2.07Zm5.32 0c-1.03 0-1.87-.93-1.87-2.07 0-1.13.82-2.07 1.87-2.07 1.05 0 1.9.94 1.88 2.07 0 1.14-.82 2.07-1.88 2.07Z" />
    </svg>
  );
}
