import { Users, GraduationCap, Bot, Map, Star, type LucideIcon } from 'lucide-react';

const BOTTOM_STATS: { Icon: LucideIcon; number: string; label: string }[] = [
  { Icon: Users, number: '+10,000', label: 'متعلم نشط' },
  { Icon: GraduationCap, number: '+150', label: 'دورة تدريبية' },
  { Icon: Bot, number: '+200', label: 'أداة ذكاء اصطناعي' },
  { Icon: Map, number: '+30', label: 'مسار مهني' },
  { Icon: Star, number: '4.9/5', label: 'تقييم المتعلمين' },
];

export default function BottomStatistics() {
  return (
    <div className="ph-statsbar">
      <div className="ph-wrap ph-statsbar-inner">
        {BOTTOM_STATS.map((s) => (
          <div key={s.label} className="ph-bstat">
            <span className="ph-bstat-icon" aria-hidden="true">
              <s.Icon size={18} strokeWidth={2} />
            </span>
            <span className="ph-bstat-num">{s.number}</span>
            <span className="ph-bstat-lbl">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
