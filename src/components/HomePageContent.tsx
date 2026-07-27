'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getDictionary, type Locale } from '@/lib/i18n';

const FEATURES = [
  { id: 'ebooks',   icon: '📚', color: '#e879f9', title: 'الكتب الإلكترونية',        desc: 'كتب تعليمية ومراجع مختارة بعناية',                                                              badge: null,          badgeColor: null,     link: null },
  { id: 'products', icon: '🛒', color: '#f59e0b', title: 'المنتجات الرقمية',         desc: 'قوالب، قوالب، أدوات، جاهزة للاستخدام',                                                         badge: null,          badgeColor: null,     link: null },
  { id: 'tools',    icon: '🤖', color: '#8b5cf6', title: 'أدوات الذكاء الاصطناعي',  desc: 'اكتشف أفضل الأدوات الذكية المحدثة يومياً مع شرحات وتقييمات حقيقية',                           badge: 'الأكثر زيارة', badgeColor: '#8b5cf6', link: 'استكشف الأدوات' },
  { id: 'courses',  icon: '🎓', color: '#db2777', title: 'الدورات التدريبية',        desc: 'دورات عملية من الصفر إلى الاحتراف مع مشاريع وشهادات إتمام',                                   badge: 'الأكثر شيوعاً', badgeColor: '#db2777', link: 'تصفح الدورات' },
  { id: 'careers',  icon: '🗺️', color: '#06b6d4', title: 'المسارات المهنية',         desc: 'خطط تعلم مخصصة حسب مهنتك وهدفك',                                                               badge: null,          badgeColor: null,     link: null },
  { id: 'news',     icon: '⚡',  color: '#f59e0b', title: 'أخبار الذكاء الاصطناعي', desc: 'أحدث التطورات والأخبار والتحديثات يومياً',                                                      badge: null,          badgeColor: null,     link: null },
] as const;

const NEWS_ITEMS = [
  { id: 1, badge: 'عاجل',     badgeColor: '#ef4444', img: '🤖', title: 'إطلاق الإصدار GPT-4o من OpenAI الجديد',                  time: 'منذ ساعات',   bg: 'linear-gradient(135deg,#1a0a2e,#2d1b69)' },
  { id: 2, badge: 'تحديثات',  badgeColor: '#3b82f6', img: '💻', title: 'أدوات جديدة لتحسين الإنتاجية بالذكاء الاصطناعي',       time: 'منذ يوم واحد', bg: 'linear-gradient(135deg,#0f172a,#1e3a5f)' },
  { id: 3, badge: 'أخبار',    badgeColor: '#8b5cf6', img: '∞',  title: 'Meta تطلق نموذج Llama 3.1 مفتوح المصدر',               time: 'منذ يومين',   bg: 'linear-gradient(135deg,#1a0a2e,#3b1f5a)' },
] as const;

const ROADMAP_ITEMS = [
  { id: 1, icon: '⌨️', title: 'مطور برمجيات', sub: 'تعلم أساسيات البرمجة',          count: 32, color: '#8b5cf6' },
  { id: 2, icon: '✏️', title: 'صانع محتوى',   sub: 'AI في الكتابة المحتوى',           count: 28, color: '#db2777' },
  { id: 3, icon: '📈', title: 'مسوق رقمي',    sub: 'AI في التسويق وتحليل البيانات',  count: 26, color: '#06b6d4' },
  { id: 4, icon: '🎨', title: 'مصمم جرافيك',  sub: 'أدوات AI للمصممين',              count: 24, color: '#f59e0b' },
  { id: 5, icon: '💼', title: 'رائد أعمال',   sub: 'AI في إدارة الأعمال',             count: 20, color: '#10b981' },
] as const;

const BOTTOM_STATS = [
  { icon: '👥', number: '+10,000', label: 'متعلم نشط' },
  { icon: '🎓', number: '+150',    label: 'دورة تدريبية' },
  { icon: '🤖', number: '+200',    label: 'أداة ذكاء اصطناعي' },
  { icon: '🗺️', number: '+30',     label: 'مسار مهني' },
  { icon: '⭐', number: '4.9/5',   label: 'تقييم المتعلمين' },
] as const;

type HomePageContentProps = { locale: Locale };

export default function HomePageContent({ locale }: HomePageContentProps) {
  const dict = getDictionary(locale);
  void dict; // dict available for future locale-aware copy

  return (
    <div className={`page-shell ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <Navigation locale={locale} />

      <main className="ph-main">

        {/* ─── Hero ─────────────────────────────────────── */}
        <section className="ph-hero">
          <div className="ph-hero-inner">

            {/* COLUMN 1: TEXT COPY (LEFT) */}
            <div className="ph-hero-copy">
              <h1 className="ph-h1">
                تعلم الذكاء الاصطناعي<br />
                من البداية إلى الاحتراف
              </h1>
              <p className="ph-hero-sub">
                منصة شاملة تحتوي على أحدث أدوات الذكاء الاصطناعي، دورات تدريبية عملية،
                مسارات مهنية، وكتب إلكترونية مختارة بعناية.
              </p>
              <div className="ph-search">
                <input
                  className="ph-search-input"
                  type="search"
                  placeholder="ابحث عن أداة، دورة، مقال، كتاب أو موضوع..."
                  aria-label="Search"
                />
                <button className="ph-search-btn" type="button" aria-label="Search">🔍</button>
              </div>
              <div className="ph-hero-btns">
                <a href={`/${locale}/workspace`} className="ph-btn-primary">← ابدأ التعلم الآن</a>
                <button className="ph-btn-ghost" type="button">▶ شاهد كيف تعمل المنصة</button>
              </div>
            </div>

            {/* COLUMN 2: IMAGES + ICONS (CENTER) */}
            <div className="ph-images-wrapper">
              {/* ROBOT (LEFT) */}
              <div className="ph-illus-robot">
                <img 
                  src="/images/phoenix-hero-robot.png" 
                  alt="AI Robot"
                  className="ph-robot-img"
                />
              </div>

              {/* ICONS (AROUND IMAGES) */}
              <div className="ph-illus-icons">
                <div className="ph-float-icon top-left">
                  <div className="ph-icon-box">📊</div>
                </div>
                <div className="ph-float-icon top-right">
                  <div className="ph-icon-box">&lt;/&gt;</div>
                </div>
                <div className="ph-float-icon bottom-left">
                  <div className="ph-icon-box">💼</div>
                </div>
                <div className="ph-float-icon bottom-right">
                  <div className="ph-icon-box">🚀</div>
                </div>
              </div>

              {/* PHOENIX (RIGHT) */}
              <div className="ph-illus-phoenix">
                <img 
                  src="/images/phoenix-hero-bird.png" 
                  alt="Phoenix Bird"
                  className="ph-phoenix-img"
                />
              </div>
            </div>

            {/* COLUMN 3: STATS PANEL (RIGHT) */}
            <div className="ph-hero-stats">
              {([
                { g: 'linear-gradient(135deg,#7c3aed,#a78bfa)', icon: '🤖', num: '+200', lbl: 'أداة ذكاء اصطناعي' },
                { g: 'linear-gradient(135deg,#db2777,#f472b6)', icon: '🎓', num: '+150', lbl: 'دورة تدريبية' },
                { g: 'linear-gradient(135deg,#0891b2,#38bdf8)', icon: '🗺️', num: '+30',  lbl: 'مسار مهني' },
                { g: 'linear-gradient(135deg,#059669,#34d399)', icon: '👥', num: '+10K', lbl: 'متعلم نشط' },
              ] as const).map((s) => (
                <div key={s.lbl} className="ph-hstat">
                  <span className="ph-hstat-icon" style={{ background: s.g }}>{s.icon}</span>
                  <div>
                    <div className="ph-hstat-num">{s.num}</div>
                    <div className="ph-hstat-lbl">{s.lbl}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ─── Feature grid ──────────────────────────────── */}
        <section className="ph-sec">
          <div className="ph-wrap">
            <div className="ph-feat-grid">
              {FEATURES.map((f) => (
                <article key={f.id} className="ph-feat-card">
                  {f.badge && (
                    <span className="ph-pill" style={{ background: f.badgeColor ?? undefined }}>
                      {f.badge}
                    </span>
                  )}
                  <div className="ph-feat-ico" style={{ background: f.color + '22', color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="ph-feat-title">{f.title}</h3>
                  <p className="ph-feat-desc">{f.desc}</p>
                  {f.link && (
                    <button type="button" className="ph-feat-link" style={{ color: f.color }}>
                      {f.link} →
                    </button>
                  )}
                  <span className="ph-card-arr">←</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── News + Roadmap ────────────────────────────── */}
        <section className="ph-sec">
          <div className="ph-wrap ph-dual">

            {/* News */}
            <div>
              <div className="ph-sec-hdr">
                <h2 className="ph-sec-title">آخر الأخبار</h2>
                <a href="#" className="ph-see-all">عرض جميع الأخبار</a>
              </div>
              <div className="ph-news-list">
                {NEWS_ITEMS.map((n) => (
                  <article key={n.id} className="ph-news-card" style={{ background: n.bg }}>
                    <div className="ph-news-img">{n.img}</div>
                    <div className="ph-news-body">
                      <span className="ph-pill" style={{ background: n.badgeColor }}>{n.badge}</span>
                      <p className="ph-news-title">{n.title}</p>
                      <span className="ph-news-time">⏱ {n.time}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Roadmap */}
            <div>
              <div className="ph-sec-hdr">
                <h2 className="ph-sec-title">عرض قريبك في المسارات العملية</h2>
                <a href="#" className="ph-see-all">عرض قريبك في المسارات</a>
              </div>
              <div className="ph-roadmap-grid">
                {ROADMAP_ITEMS.map((r) => (
                  <article
                    key={r.id}
                    className="ph-road-card"
                    style={{ borderColor: r.color + '44' }}
                  >
                    <div className="ph-road-ico" style={{ background: r.color + '22', color: r.color }}>
                      {r.icon}
                    </div>
                    <div className="ph-road-info">
                      <span className="ph-road-title">{r.title}</span>
                      <span className="ph-road-count">{r.count} مرحلة</span>
                      <span className="ph-road-sub">{r.sub}</span>
                      <div className="ph-prog-track">
                        <div
                          className="ph-prog-fill"
                          style={{ width: `${(r.count / 32) * 100}%`, background: r.color }}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ─── Bottom stats bar ─────────────────────────── */}
        <div className="ph-statsbar">
          <div className="ph-wrap ph-statsbar-inner">
            {BOTTOM_STATS.map((s) => (
              <div key={s.label} className="ph-bstat">
                <span className="ph-bstat-icon">{s.icon}</span>
                <span className="ph-bstat-num">{s.number}</span>
                <span className="ph-bstat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer locale={locale} />
    </div>
  );
}
