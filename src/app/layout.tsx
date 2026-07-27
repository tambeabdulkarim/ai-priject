import './globals.css';

export const metadata = {
  title: 'AI Productivity Platform',
  description: 'منصة إنتاجية احترافية مبنية من الصفر مع إدارة المهام والتقويم والإعدادات'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
