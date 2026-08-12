import Image from 'next/image';
import {
  Search,
  Rocket,
  Play,
  Network,
  BarChart3,
  Activity,
  TrendingUp,
  Cpu,
  PieChart,
  Boxes,
  Zap,
  Database,
  CloudCog,
  Bot,
  GraduationCap,
  Map,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { type Locale } from '@/lib/i18n';

type HeroProps = { locale: Locale };

const LEFT_CARDS: {
  Icon: LucideIcon;
  title: string;
  status: string;
  kind: 'dot' | 'bar' | 'dots';
  pct?: number;
}[] = [
  { Icon: Network, title: 'Neural Network', status: 'نشط', kind: 'dot' },
  { Icon: BarChart3, title: 'Model Training', status: 'جاري التدريب', kind: 'bar', pct: 75 },
  { Icon: Activity, title: 'Data Processing', status: 'جاري المعالجة', kind: 'dots' },
];

const RIGHT_CARDS: {
  Icon: LucideIcon;
  title: string;
  status: string;
  value: string;
  kind: 'bars' | 'progress' | 'ring';
  pct?: number;
}[] = [
  {
    Icon: TrendingUp,
    title: 'AI Performance',
    status: 'كفاءة عالية',
    value: '98.6%',
    kind: 'bars',
  },
  {
    Icon: Cpu,
    title: 'GPU Status',
    status: 'NVIDIA A100',
    value: '92%',
    kind: 'progress',
    pct: 92,
  },
  { Icon: PieChart, title: 'System Uptime', status: 'متاح دائماً', value: '99.9%', kind: 'ring' },
];

const PILLS_LEFT: { Icon: LucideIcon; label: string; value: string }[] = [
  { Icon: Boxes, label: 'AI Models', value: '12 Active' },
  { Icon: Zap, label: 'API Requests', value: '1.2M / Day' },
];

const PILLS_RIGHT: { Icon: LucideIcon; label: string; value: string }[] = [
  { Icon: Database, label: 'Dataset', value: '8.4 TB' },
  { Icon: CloudCog, label: 'Cloud Sync', value: 'Active' },
];

const HERO_STATS: { g: string; Icon: LucideIcon; num: string; lbl: string }[] = [
  {
    g: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
    Icon: Bot,
    num: '+200',
    lbl: 'أداة ذكاء اصطناعي',
  },
  {
    g: 'linear-gradient(135deg,#db2777,#f472b6)',
    Icon: GraduationCap,
    num: '+150',
    lbl: 'دورة تدريبية',
  },
  { g: 'linear-gradient(135deg,#0891b2,#38bdf8)', Icon: Map, num: '+30', lbl: 'مسار مهني' },
  { g: 'linear-gradient(135deg,#059669,#34d399)', Icon: Users, num: '+10K', lbl: 'متعلم نشط' },
];

export default function Hero({ locale }: HeroProps) {
  return (
    <section className="ph-hero">
      <div className="ph-hero-inner">
        {/* Artwork + decorative dashboard cards — flavor content only,
            hidden from assistive tech so it doesn't clutter real content */}
        <div className="ph-hero-stage">
          <div className="ph-hero-float ph-hero-float-left" aria-hidden="true">
            {LEFT_CARDS.map((c) => (
              <div key={c.title} className="ph-float-card">
                <div className="ph-float-head">
                  <span className="ph-float-ico">
                    <c.Icon size={14} strokeWidth={2} />
                  </span>
                  <span className="ph-float-title">{c.title}</span>
                </div>
                {c.kind === 'dot' && (
                  <span className="ph-float-status">
                    <i className="ph-dot-live" />
                    {c.status}
                  </span>
                )}
                {c.kind === 'bar' && (
                  <div className="ph-float-bar-row">
                    <div className="ph-float-track">
                      <div className="ph-float-fill" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="ph-float-pct">{c.status}</span>
                  </div>
                )}
                {c.kind === 'dots' && (
                  <div className="ph-float-dots-row">
                    <span className="ph-float-dots">••••••</span>
                    <span className="ph-float-status-txt">{c.status}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="ph-hero-artwork">
            <Image
              src="/images/phoenix-hero-master.png"
              alt="Phoenix Project — روبوت الذكاء الاصطناعي وطائر الفينيق"
              width={1667}
              height={944}
              className="ph-hero-master-img"
              sizes="(max-width: 1200px) 90vw, 640px"
              priority
            />
          </div>

          <div className="ph-hero-float ph-hero-float-right" aria-hidden="true">
            {RIGHT_CARDS.map((c) => (
              <div key={c.title} className="ph-float-card">
                <div className="ph-float-head">
                  <span className="ph-float-ico">
                    <c.Icon size={14} strokeWidth={2} />
                  </span>
                  <span className="ph-float-title">{c.title}</span>
                </div>
                <div className="ph-float-value-row">
                  <span className="ph-float-value">{c.value}</span>
                  <span className="ph-float-status-txt">{c.status}</span>
                </div>
                {c.kind === 'progress' && (
                  <div className="ph-float-track">
                    <div
                      className="ph-float-fill ph-float-fill-cyan"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Title / subtitle / search / CTAs, centered below the artwork */}
        <div className="ph-hero-copy-center">
          <h1 className="ph-h1">
            تعلم الذكاء الاصطناعي
            <br />
            من البداية إلى الاحتراف
          </h1>
          <p className="ph-hero-sub">
            منصة متكاملة تجمع أحدث أدوات الذكاء الاصطناعي، والدورات التدريبية، والمسارات المهنية،
            والمنتجات الرقمية في مكان واحد.
          </p>

          <div className="ph-hero-pills-row" aria-hidden="true">
            <div className="ph-hero-pill-group">
              {PILLS_LEFT.map((p) => (
                <div key={p.label} className="ph-hero-pill">
                  <span className="ph-hero-pill-ico">
                    <p.Icon size={14} strokeWidth={2} />
                  </span>
                  <div>
                    <div className="ph-hero-pill-lbl">{p.label}</div>
                    <div className="ph-hero-pill-val">{p.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ph-hero-pill-group">
              {PILLS_RIGHT.map((p) => (
                <div key={p.label} className="ph-hero-pill">
                  <span className="ph-hero-pill-ico">
                    <p.Icon size={14} strokeWidth={2} />
                  </span>
                  <div>
                    <div className="ph-hero-pill-lbl">{p.label}</div>
                    <div className="ph-hero-pill-val">{p.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ph-search ph-hero-search">
            <input
              className="ph-search-input"
              type="search"
              placeholder="ابحث عن أداة، دورة، مسار مهني أو موضوع..."
              aria-label="Search"
            />
            <button className="ph-search-btn" type="button" aria-label="Search">
              <Search size={14} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>

          <div className="ph-hero-cta-row">
            <div className="ph-hero-btns">
              <a href={`/${locale}/workspace`} className="ph-btn-primary">
                <Rocket size={16} strokeWidth={2.25} aria-hidden="true" />
                ابدأ التعلم الآن
              </a>
              <button className="ph-btn-ghost" type="button">
                <Play size={16} strokeWidth={2.25} aria-hidden="true" />
                شاهد كيف تعمل المنصة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Hero statistics panel — horizontal bar directly under the Hero */}
      <div className="ph-statsbar ph-hero-statsbar">
        <div className="ph-wrap ph-statsbar-inner">
          {HERO_STATS.map((s) => (
            <div key={s.lbl} className="ph-bstat">
              <span className="ph-bstat-icon" style={{ background: s.g }} aria-hidden="true">
                <s.Icon size={18} strokeWidth={2} color="#fff" />
              </span>
              <span className="ph-bstat-num">{s.num}</span>
              <span className="ph-bstat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
