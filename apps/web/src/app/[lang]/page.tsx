import { notFound } from 'next/navigation';
import HomePageContent from '@/components/HomePageContent';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

export function generateStaticParams() {
  return [{ lang: 'ar' }, { lang: 'en' }];
}

type PageProps = {
  params: { lang?: string };
};

export function generateMetadata({ params }: PageProps) {
  const lang = params.lang ?? defaultLocale;
  const isAr = lang === 'ar';
  const title = isAr
    ? 'Phoenix Project | تعلم الذكاء الاصطناعي من البداية إلى الاحتراف'
    : 'Phoenix Project | Learn AI From Zero to Pro';
  const description = isAr
    ? 'منصة متكاملة تجمع أحدث أدوات الذكاء الاصطناعي، والدورات التدريبية، والمسارات المهنية، والمنتجات الرقمية في مكان واحد.'
    : 'An all-in-one platform for AI tools, training courses, career paths, and digital products.';

  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}`,
      languages: { ar: '/ar', en: '/en' },
    },
    openGraph: { title, description, url: `/${lang}`, locale: isAr ? 'ar_AR' : 'en_US' },
    twitter: { title, description },
  };
}

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Phoenix Project',
  description: 'منصة متكاملة تجمع أحدث أدوات الذكاء الاصطناعي، والدورات التدريبية، والمسارات المهنية، والمنتجات الرقمية في مكان واحد.',
};

export default function LocalePage({ params }: PageProps) {
  const lang = params.lang ?? defaultLocale;

  if (!isLocale(lang)) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Static, build-time-known JSON — not user input, safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <HomePageContent locale={lang as Locale} />
    </>
  );
}
