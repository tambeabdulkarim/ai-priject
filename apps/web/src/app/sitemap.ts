import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return [
    { url: `${siteUrl}/ar`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/en`, changeFrequency: 'weekly', priority: 1 },
  ];
}
