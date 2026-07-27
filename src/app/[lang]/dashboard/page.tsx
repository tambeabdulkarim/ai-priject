import { notFound } from 'next/navigation';
import DashboardPageContent from '@/components/DashboardPageContent';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

type PageProps = {
  params: { lang?: string };
};

export default function LocaleDashboardPage({ params }: PageProps) {
  const lang = params.lang ?? defaultLocale;

  if (!isLocale(lang)) {
    notFound();
  }

  return <DashboardPageContent locale={lang as Locale} />;
}
