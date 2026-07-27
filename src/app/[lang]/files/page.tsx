import { notFound } from 'next/navigation';
import FilesPanel from '@/components/FilesPanel';
import { defaultLocale, isLocale } from '@/lib/i18n';

type PageProps = {
  params: { lang?: string };
};

export default function LocaleFilesPage({ params }: PageProps) {
  const lang = params.lang ?? defaultLocale;

  if (!isLocale(lang)) {
    notFound();
  }

  return (
    <main className="workspace-page">
      <FilesPanel />
    </main>
  );
}
