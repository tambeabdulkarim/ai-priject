export type Locale = 'ar' | 'en';

export const locales = ['ar', 'en'] as const;
export const defaultLocale: Locale = 'ar';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const dictionaries = {
  ar: {
    nav: {
      brand: 'أوبسيف',
      home: 'الرئيسية',
      features: 'المميزات',
      about: 'حولنا',
      contact: 'تواصل'
    },
    hero: {
      badge: 'منصة إنتاجية ذكية',
      title: 'خطط يومك، وابدأ العمل بثقة.',
      description: 'أطلق رحلتك في إدارة المهام والتخطيط مع واجهة احترافية مصممة لتسريع الإنتاجية وتوحيد العمل.',
      primaryCta: 'ابدأ الآن',
      secondaryCta: 'اكتشف المميزات'
    },
    metrics: {
      title: 'ماذا تقدّم لك المنصة؟',
      items: [
        { title: 'تنظيم ذكي', description: 'أدر مهامك اليومية بسهولة عبر لوحة واضحة ومبسطة.' },
        { title: 'تعاون سريع', description: 'شارك العمل مع الفريق دون فقدان الترتيب أو الوضوح.' },
        { title: 'تقدم واضح', description: 'تابع الإنجازات والمؤشرات في لمحة سريعة.' }
      ]
    },
    footer: {
      brand: 'أوبسيف',
      tagline: 'مساعدتك على بناء يوم إنتاجي ومرتب.',
      copyright: '© 2026 أوبسيف. جميع الحقوق محفوظة.'
    }
  },
  en: {
    nav: {
      brand: 'Opsive',
      home: 'Home',
      features: 'Features',
      about: 'About',
      contact: 'Contact'
    },
    hero: {
      badge: 'Smart productivity platform',
      title: 'Plan your day and start working with confidence.',
      description: 'Launch your workflow with a polished experience for task management, planning, and daily execution.',
      primaryCta: 'Get started',
      secondaryCta: 'Explore features'
    },
    metrics: {
      title: 'What the platform offers',
      items: [
        { title: 'Smart organization', description: 'Keep daily tasks in order through a simple and focused workspace.' },
        { title: 'Fast collaboration', description: 'Share work with your team without losing clarity or momentum.' },
        { title: 'Clear progress', description: 'Track achievements and performance in a single glance.' }
      ]
    },
    footer: {
      brand: 'Opsive',
      tagline: 'Helping you build a productive and structured day.',
      copyright: '© 2026 Opsive. All rights reserved.'
    }
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
