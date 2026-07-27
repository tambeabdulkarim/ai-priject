'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getDictionary, type Locale } from '@/lib/i18n';

type HomePageContentProps = {
  locale: Locale;
};

export default function HomePageContent({ locale }: HomePageContentProps) {
  const dict = getDictionary(locale);

  return (
    <div className={`page-shell ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <Navigation locale={locale} />

      <main>
        <section className="hero" id="about">
          <div className="hero-copy">
            <span className="hero-badge">{dict.hero.badge}</span>
            <h1>{dict.hero.title}</h1>
            <p>{dict.hero.description}</p>
            <div className="hero-actions">
              <a href={`/${locale}#features`} className="primary-button">
                {dict.hero.primaryCta}
              </a>
              <a href={`/${locale}#features`} className="secondary-button">
                {dict.hero.secondaryCta}
              </a>
            </div>
          </div>

          <div className="hero-panel" id="features">
            <div className="panel-card">
              <h2>{dict.metrics.title}</h2>
              <div className="metric-list">
                {dict.metrics.items.map((item) => (
                  <div key={item.title} className="metric-item">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
