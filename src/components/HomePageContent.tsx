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

            {/* STATS (Right in LTR, Left in RTL) */}
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

            {/* PHOENIX WINGS */}
            <div className="ph-illus-phoenix">
              <svg viewBox="0 0 300 300" className="ph-phoenix-svg">
                <defs>
                  <radialGradient id="phoenixGrad" cx="40%" cy="50%">
                    <stop offset="0%" stopColor="#db2777" stopOpacity="1" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3" />
                  </radialGradient>
                  <filter id="phoenixGlow">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Left Wing */}
                <path d="M 150 150 Q 100 100 80 60 Q 70 40 85 50 Q 110 80 140 130 Z" fill="url(#phoenixGrad)" filter="url(#phoenixGlow)" />
                <path d="M 150 150 Q 90 110 60 70 Q 45 50 65 65 Q 95 95 135 145 Z" fill="#db2777" opacity="0.6" />
                
                {/* Right Wing */}
                <path d="M 150 150 Q 200 100 220 60 Q 230 40 215 50 Q 190 80 160 130 Z" fill="url(#phoenixGrad)" filter="url(#phoenixGlow)" />
                <path d="M 150 150 Q 210 110 240 70 Q 255 50 235 65 Q 205 95 165 145 Z" fill="#db2777" opacity="0.6" />
                
                {/* Center Flame */}
                <circle cx="150" cy="140" r="35" fill="#db2777" opacity="0.9" filter="url(#phoenixGlow)" />
                <circle cx="150" cy="135" r="25" fill="#f472b6" opacity="0.8" />
                <circle cx="150" cy="130" r="15" fill="#fbbf24" opacity="0.9" />
                <circle cx="150" cy="128" r="8" fill="#fef3c7" />
              </svg>
              <div className="ph-phoenix-glow" />
            </div>

            {/* ROBOT */}
            <div className="ph-illus-robot">
              <svg viewBox="0 0 200 250" className="ph-robot-svg">
                <defs>
                  <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e5e7eb" />
                    <stop offset="100%" stopColor="#9ca3af" />
                  </linearGradient>
                  <filter id="robotGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Head */}
                <rect x="50" y="20" width="100" height="110" rx="15" fill="url(#headGrad)" stroke="#0ea5e9" strokeWidth="2" filter="url(#robotGlow)" />
                
                {/* Left Eye */}
                <circle cx="75" cy="55" r="15" fill="#0ea5e9" />
                <circle cx="75" cy="55" r="10" fill="#0369a1" />
                <circle cx="77" cy="52" r="5" fill="#e0f2fe" />
                
                {/* Right Eye */}
                <circle cx="125" cy="55" r="15" fill="#0ea5e9" />
                <circle cx="125" cy="55" r="10" fill="#0369a1" />
                <circle cx="127" cy="52" r="5" fill="#e0f2fe" />
                
                {/* Mouth */}
                <path d="M 80 95 Q 100 105 120 95" stroke="#0ea5e9" strokeWidth="2" fill="none" strokeLinecap="round" />
                
                {/* Neck */}
                <rect x="75" y="125" width="50" height="15" fill="#9ca3af" />
                
                {/* Chest */}
                <rect x="40" y="145" width="120" height="90" rx="10" fill="url(#headGrad)" stroke="#0ea5e9" strokeWidth="2" />
                
                {/* AI Text */}
                <text x="100" y="210" fontSize="48" fontWeight="bold" textAnchor="middle" fill="#0066ff" fontFamily="Arial">
                  AI
                </text>
                
                {/* Chest Details - Left Arm */}
                <rect x="25" y="160" width="15" height="50" rx="7" fill="#9ca3af" />
                
                {/* Chest Details - Right Arm */}
                <rect x="160" y="160" width="15" height="50" rx="7" fill="#9ca3af" />
              </svg>
              <div className="ph-robot-glow" />
            </div>

            {/* ICONS around center */}
            <div className="ph-illus-icons">
              <div className="ph-float-icon top-left">
                <div className="ph-icon-box">📊</div>
              </div>
              <div className="ph-float-icon top-right">
                <div className="ph-icon-box">💡</div>
              </div>
              <div className="ph-float-icon bottom-left">
                <div className="ph-icon-box">📝</div>
              </div>
              <div className="ph-float-icon bottom-right">
                <div className="ph-icon-box">⚙️</div>
              </div>
            </div>

            {/* TEXT COPY (Left in LTR, Right in RTL) */}
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
