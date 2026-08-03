'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getDictionary, type Locale } from '@/lib/i18n';

type DashboardPageContentProps = {
  locale: Locale;
};

export default function DashboardPageContent({ locale }: DashboardPageContentProps) {
  const dict = getDictionary(locale);

  return (
    <div className={`page-shell ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <Navigation locale={locale} />

      <main>
        <section className="dashboard-shell">
          <header className="dashboard-header">
            <div>
              <p className="hero-badge">{dict.dashboard.badge}</p>
              <h1>{dict.dashboard.title}</h1>
              <p>{dict.dashboard.description}</p>
            </div>
            <div className="pill-card">
              <span>{dict.dashboard.focus}</span>
              <strong>{dict.dashboard.focusValue}</strong>
            </div>
          </header>

          <section className="stats-grid">
            {dict.dashboard.stats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <h3>{stat.label}</h3>
                <p>{stat.value}</p>
                <span>{stat.caption}</span>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="panel-card wide-panel">
              <h2>{dict.dashboard.tasksTitle}</h2>
              <ul className="task-list">
                {dict.dashboard.tasks.map((task) => (
                  <li key={task}>
                    <span>•</span>
                    {task}
                  </li>
                ))}
              </ul>
            </article>

            <article className="panel-card">
              <h2>{dict.dashboard.insightsTitle}</h2>
              <div className="insight-list">
                {dict.dashboard.insights.map((item) => (
                  <div key={item.title} className="insight-item">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
