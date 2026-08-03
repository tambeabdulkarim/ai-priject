import { notFound } from 'next/navigation';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import LocalStorageSync from '@/components/LocalStorageSync';
import { defaultLocale, isLocale } from '@/lib/i18n';

type PageProps = {
  params: { lang?: string };
};

export default function LocaleAnalyticsPage({ params }: PageProps) {
  const lang = params.lang ?? defaultLocale;

  if (!isLocale(lang)) {
    notFound();
  }

  return (
    <main className="workspace-page">
      <section className="workspace-grid">
        <AnalyticsPanel />
        <LocalStorageSync />
      </section>
    </main>
  );
}
