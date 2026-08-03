import { notFound } from 'next/navigation';
import ProjectsBoard from '@/components/ProjectsBoard';
import { defaultLocale, isLocale } from '@/lib/i18n';

type PageProps = {
  params: { lang?: string };
};

export default function LocaleProjectsPage({ params }: PageProps) {
  const lang = params.lang ?? defaultLocale;

  if (!isLocale(lang)) {
    notFound();
  }

  return (
    <main className="workspace-page">
      <ProjectsBoard />
    </main>
  );
}
