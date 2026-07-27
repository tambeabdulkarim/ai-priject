import './globals.css';

export const metadata = {
  title: 'Opsive | Productivity Platform',
  description: 'منصة إنتاجية احترافية مبنية من الصفر مع إدارة المهام والمشاريع والتحليلات',
  keywords: ['productivity', 'dashboard', 'tasks', 'projects', 'analytics']
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
