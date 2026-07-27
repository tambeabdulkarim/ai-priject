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
      contact: 'تواصل',
      workspace: 'المساحة',
      files: 'الملفات'
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
    },
    dashboard: {
      badge: 'لوحة تحكم إنتاجية',
      title: 'تابع تقدمك اليومي من مكان واحد.',
      description: 'لوحة مرئية تساعدك على تنظيم أولويات العمل والمهام والتقدم بشكل واضح.',
      focus: 'التركيز الحالي',
      focusValue: 'إكمال المشروع الأساسي',
      stats: [
        { label: 'المهام المكتملة', value: '12', caption: 'هذا الأسبوع' },
        { label: 'الوقت الموجه', value: '6.4h', caption: 'في العمل العميق' },
        { label: 'التقدم', value: '83%', caption: 'من الخطة الحالية' }
      ],
      tasksTitle: 'أولويات اليوم',
      tasks: ['مراجعة المتطلبات', 'تحديث المخطط', 'مواصلة التطوير', 'إرسال ملاحظات للفريق'],
      insightsTitle: 'رؤى سريعة',
      insights: [
        { title: 'التركيز', text: 'أفضل وقت للتنفيذ هو في بداية الصباح.' },
        { title: 'التعاون', text: 'المراجعات المؤقتة تحسن جودة العمل وتقلل التأخير.' }
      ]
    }
  },
  en: {
    nav: {
      brand: 'Opsive',
      home: 'Home',
      features: 'Features',
      about: 'About',
      contact: 'Contact',
      workspace: 'Workspace',
      files: 'Files'
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
    },
    dashboard: {
      badge: 'Productivity dashboard',
      title: 'Track your progress from one place.',
      description: 'A focused workspace that helps you organize priorities, tasks, and momentum clearly.',
      focus: 'Current focus',
      focusValue: 'Complete the core milestone',
      stats: [
        { label: 'Completed tasks', value: '12', caption: 'this week' },
        { label: 'Focused time', value: '6.4h', caption: 'in deep work' },
        { label: 'Progress', value: '83%', caption: 'of the current plan' }
      ],
      tasksTitle: 'Today priorities',
      tasks: ['Review requirements', 'Update roadmap', 'Continue implementation', 'Share feedback with the team'],
      insightsTitle: 'Quick insights',
      insights: [
        { title: 'Focus', text: 'The best execution window is early in the morning.' },
        { title: 'Collaboration', text: 'Short review cycles improve quality and reduce delays.' }
      ]
    }
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
