import { Zap, GraduationCap, Code2, ShoppingBag, BookOpen, FileText, type LucideIcon } from 'lucide-react';

const FEATURES: { id: string; Icon: LucideIcon; color: string; title: string; desc: string; link: string }[] = [
  { id: 'tools',    Icon: Zap,           color: '#f59e0b', title: 'أدوات الذكاء الاصطناعي', desc: 'اكتشف أفضل الأدوات الذكية مع شروحات وتقييمات مستمرة',      link: 'استكشف الأدوات' },
  { id: 'courses',  Icon: GraduationCap, color: '#db2777', title: 'الدورات التدريبية',      desc: 'دورات تدريبية عملية من المبتدئ إلى الاحتراف. مع مشاريع وشهادات', link: 'تصفح الدورات' },
  { id: 'careers',  Icon: Code2,         color: '#06b6d4', title: 'المسارات المهنية',       desc: 'اختر المسار المناسب لطموحك وطور مهاراتك باستخدام الذكاء الاصطناعي', link: 'استكشف المسارات' },
  { id: 'products', Icon: ShoppingBag,   color: '#8b5cf6', title: 'المنتجات الرقمية',       desc: 'قوالب وملفات وأدوات رقمية جاهزة للاستخدام',                  link: 'تصفح المنتجات' },
  { id: 'ebooks',   Icon: BookOpen,      color: '#a78bfa', title: 'الكتب الإلكترونية',      desc: 'مكتبة إلكترونية متخصصة ومراجع مختارة بعناية',               link: 'استكشف الكتب' },
  { id: 'news',     Icon: FileText,      color: '#10b981', title: 'أخبار الذكاء الاصطناعي', desc: 'أحدث أخبار وتقنيات الذكاء الاصطناعي والتطورات اليومية',      link: 'اقرأ الأخبار' },
];

export default function FeatureCards() {
  return (
    <section className="ph-sec">
      <div className="ph-wrap">
        <h2 className="ph-sr-only">الخدمات الرئيسية</h2>
        <div className="ph-feat-grid">
          {FEATURES.map((f) => (
            <article key={f.id} className="ph-feat-card" style={{ borderBottomColor: f.color }}>
              <div className="ph-feat-ico" style={{ background: f.color + '22', color: f.color }} aria-hidden="true">
                <f.Icon size={22} strokeWidth={2} />
              </div>
              <h3 className="ph-feat-title">{f.title}</h3>
              <p className="ph-feat-desc">{f.desc}</p>
              <button type="button" className="ph-feat-link" style={{ color: f.color }}>
                <span aria-hidden="true">←</span>{f.link}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
