# AI Productivity Platform

منصة إنتاجية احترافية مبنية من الصفر لتوفير تجربة حديثة وفعالة لإدارة العمل والمهام.

## الميزات
- واجهة احترافية وسهلة الاستخدام
- بنية قابلة للتوسع
- جاهزة للانتقال إلى تطوير ميزات متقدمة مثل المهام والتقويم والتحليلات

## البدء
```bash
npm install
npm run dev
```

## التحقق
```bash
npm run build
node --test tests/taskFeatures.test.js tests/notes.test.js tests/tasks.test.js
```

## البنية
- src/app: الصفحات والتطبيق
- src/components: المكونات القابلة لإعادة الاستخدام
- src/lib: الأدوات والمنطق المساعد
- public: الأصول الثابتة
