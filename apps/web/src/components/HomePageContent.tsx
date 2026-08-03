'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import FeatureCards from '@/components/FeatureCards';
import News from '@/components/News';
import Roadmap from '@/components/Roadmap';
import BottomStatistics from '@/components/BottomStatistics';
import { type Locale } from '@/lib/i18n';

type HomePageContentProps = { locale: Locale };

export default function HomePageContent({ locale }: HomePageContentProps) {
  return (
    <div className={`page-shell ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <Navigation locale={locale} />

      <main className="ph-main">

        {/* ─── Hero ─────────────────────────────────────── */}
        <Hero locale={locale} />

        {/* ─── Feature grid ──────────────────────────────── */}
        <FeatureCards />

        {/* ─── News + Roadmap ────────────────────────────── */}
        <section className="ph-sec">
          <div className="ph-wrap ph-dual">
            <News />
            <Roadmap />
          </div>
        </section>

        {/* ─── Bottom stats bar ─────────────────────────── */}
        <BottomStatistics />

      </main>

      <Footer locale={locale} />
    </div>
  );
}
