# حسابات الخدمات المطلوبة — ملخص سريع
# Required Service Accounts — Quick Summary

هذا ملخص مقتضب فقط. للتفاصيل الكاملة (كل حساب، ولماذا نحتاجه، وهل هو إلزامي أم اختياري) راجع `launch-package.md` في هذا نفس المجلد.
This is a quick summary only. For full detail on every account (purpose, required vs. optional), see `launch-package.md` in this same folder.

## إلزامي قبل النشر — Required before launch

| # | الخدمة / Service | الغرض / Purpose |
|---|---|---|
| 1 | **Vercel** | استضافة الواجهة الأمامية / Frontend hosting |
| 2 | **Railway** | استضافة الـ backend والـ workers / Backend + workers hosting |
| 3 | **Neon** | قاعدة بيانات Postgres الإنتاجية / Production Postgres database |
| 4 | **Upstash** | Redis الإنتاجي / Production Redis |
| 5 | **Backblaze B2** | تخزين الملفات (صور، فيديوهات، مستندات) / File/media object storage |
| 6 | **Postmark** | إرسال الإيميلات (تفعيل الحساب، استعادة كلمة المرور، MFA) / Transactional email |
| 7 | **Stripe** (Live mode) | الدفعات / Payments — **يجب استخدام مفاتيح Live وليس Test** |
| 8 | مسجل نطاق (Domain registrar) | الدومين الحقيقي للمنصة / The real production domain |

## موصى به بشدة، ليس إلزاميًا للنشر نفسه — Strongly recommended, not strictly launch-blocking

| # | الخدمة / Service | الغرض / Purpose |
|---|---|---|
| 9 | **Sentry** (أو مكافئ) | تتبع الأخطاء / Error tracking |
| 10 | خدمة مراقبة uptime | مراقبة توفر الموقع / Uptime monitoring |

## اختياري — Optional

| # | الخدمة / Service | الغرض / Purpose |
|---|---|---|
| 11 | **OpenAI** و/أو **Anthropic** | ميزات الذكاء الاصطناعي (AI Gateway) — فقط إذا كانت ضمن نطاق الإطلاق / Only if AI is in launch scope |

## غير مطلوب حاليًا — Not needed right now

- **Meilisearch** — البحث غير مُفعّل في الكود بعد (خطة مستقبلية) / Search is not wired into the application layer yet — a future v1.1+ item, not something to configure now.

---

**ملاحظة أمنية مهمة / Important security note:** لا تقم أبدًا بإنشاء أو مشاركة أي بيانات اعتماد حقيقية (مفاتيح API، كلمات مرور) داخل محادثة مع أداة ذكاء اصطناعي. أنشئها بنفسك مباشرة على جهازك أو في لوحة تحكم كل خدمة.
Never generate or share real credentials (API keys, passwords) inside an AI chat session. Generate them yourself, directly, on your own machine or in each service's own dashboard. See `../06-Environment-Variables/production-secrets-checklist.md` for exactly where each one comes from.
