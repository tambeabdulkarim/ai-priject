import { Keyboard, Pencil, TrendingUp, Palette, Briefcase, type LucideIcon } from 'lucide-react';

const ROADMAP_ITEMS: {
  id: number;
  Icon: LucideIcon;
  title: string;
  sub: string;
  count: number;
  color: string;
}[] = [
  {
    id: 1,
    Icon: Keyboard,
    title: 'مطور برمجيات',
    sub: 'تعلم أساسيات البرمجة',
    count: 32,
    color: '#8b5cf6',
  },
  {
    id: 2,
    Icon: Pencil,
    title: 'صانع محتوى',
    sub: 'AI في الكتابة المحتوى',
    count: 28,
    color: '#db2777',
  },
  {
    id: 3,
    Icon: TrendingUp,
    title: 'مسوق رقمي',
    sub: 'AI في التسويق وتحليل البيانات',
    count: 26,
    color: '#06b6d4',
  },
  {
    id: 4,
    Icon: Palette,
    title: 'مصمم جرافيك',
    sub: 'أدوات AI للمصممين',
    count: 24,
    color: '#f59e0b',
  },
  {
    id: 5,
    Icon: Briefcase,
    title: 'رائد أعمال',
    sub: 'AI في إدارة الأعمال',
    count: 20,
    color: '#10b981',
  },
];

export default function Roadmap() {
  return (
    <div>
      <div className="ph-sec-hdr">
        <h2 className="ph-sec-title">عرض قريبك في المسارات العملية</h2>
        <a href="#" className="ph-see-all">
          عرض قريبك في المسارات
        </a>
      </div>
      <div className="ph-roadmap-grid">
        {ROADMAP_ITEMS.map((r) => (
          <article key={r.id} className="ph-road-card" style={{ borderColor: r.color + '44' }}>
            <div
              className="ph-road-ico"
              style={{ background: r.color + '22', color: r.color }}
              aria-hidden="true"
            >
              <r.Icon size={16} strokeWidth={2} />
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
  );
}
