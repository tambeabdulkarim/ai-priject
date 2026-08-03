import DashboardPageContent from '@/components/DashboardPageContent';
import { defaultLocale, type Locale } from '@/lib/i18n';

export default function DashboardPage() {
  return <DashboardPageContent locale={defaultLocale as Locale} />;
}
