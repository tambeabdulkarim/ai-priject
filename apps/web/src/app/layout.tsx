import './globals.css';
import LocaleHtmlSync from '@/components/LocaleHtmlSync';
import { AppProviders } from '../providers/AppProviders';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Phoenix Project | منصة تعلم الذكاء الاصطناعي',
  description:
    'منصة تبني مهاراتك خطوة بخطوة — أدوات ذكاء اصطناعي، دورات تدريبية، مسارات مهنية، وكتب إلكترونية في مكان واحد.',
  keywords: ['ذكاء اصطناعي', 'دورات تدريبية', 'مسارات مهنية', 'AI tools', 'Phoenix Project'],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Phoenix Project | منصة تعلم الذكاء الاصطناعي',
    description:
      'منصة تبني مهاراتك خطوة بخطوة — أدوات ذكاء اصطناعي، دورات تدريبية، مسارات مهنية، وكتب إلكترونية في مكان واحد.',
    siteName: 'Phoenix Project',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Phoenix Project | منصة تعلم الذكاء الاصطناعي',
    description:
      'منصة تبني مهاراتك خطوة بخطوة — أدوات ذكاء اصطناعي، دورات تدريبية، مسارات مهنية، وكتب إلكترونية في مكان واحد.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LocaleHtmlSync />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
