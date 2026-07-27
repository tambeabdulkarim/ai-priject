import { notFound } from 'next/navigation';
import HomePageContent from '@/components/HomePageContent';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

export function generateStaticParams() {
  return [{ lang: 'ar' }, { lang: 'en' }];
}

type PageProps = {
  params: { lang?: string };
};

export default function LocalePage({ params }: PageProps) {
  const lang = params.lang ?? defaultLocale;

  if (!isLocale(lang)) {
    notFound();
  }

  return <HomePageContent locale={lang as Locale} />;
}
