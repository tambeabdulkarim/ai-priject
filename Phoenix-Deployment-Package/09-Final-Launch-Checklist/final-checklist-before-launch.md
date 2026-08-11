# القائمة النهائية قبل الضغط على زر Launch
# Final Checklist Before Pressing "Launch"

طباعة هذه الصفحة والاحتفاظ بها أثناء التنفيذ. لا تنتقل للسطر التالي قبل إتمام السطر الحالي فعليًا (وليس افتراضًا).
Print this page and keep it during execution. Do not check the next line until the current one is actually done — not assumed.

## 1) قبل البدء — Before you start

- [ ] قرأت `../03-Handover-Guide/handover-guide.md` كاملاً / Read `../03-Handover-Guide/handover-guide.md` in full.
- [ ] كل الحسابات المطلوبة في `../07-Required-Service-Accounts/` تم إنشاؤها / Every account in `../07-Required-Service-Accounts/` has been created.
- [ ] لدي وصول لسجلات DNS الخاصة بالدومين / I have access to the domain's DNS records.

## 2) الترتيب الفعلي للتنفيذ — The actual execution order

اتبع هذا الترتيب بالضبط (التفاصيل الكاملة في `../08-Deployment-Order-And-Rollback/`):
Follow this exact order (full detail in `../08-Deployment-Order-And-Rollback/`):

1. [ ] **قاعدة البيانات** Database (Neon) — إنشاء + تشغيل `prisma migrate deploy`
2. [ ] **التخزين** Storage (Backblaze) — إنشاء bucket إنتاجي منفصل
3. [ ] **البريد الإلكتروني** Email (Postmark) — التحقق من نطاق الإرسال (يأخذ وقتًا — ابدأ مبكرًا)
4. [ ] **الأسرار** Secrets — توليدها بنفسك على جهازك، ليس داخل أي جلسة AI (راجع `../06-Environment-Variables/`)
5. [ ] **الـ Backend** — نشره على Railway بكل المتغيرات
6. [ ] **Stripe Webhook** — تسجيله فقط بعد أن يصبح الـ backend حيًا فعليًا، ثم إعادة النشر
7. [ ] **Workers** — تخطَّ هذه الخطوة، `apps/workers` فارغ حاليًا وغير مطلوب للإطلاق
8. [ ] **الـ Frontend** — نشره على Vercel
9. [ ] **DNS** — توجيه الدومين للنشرين
10. [ ] **المراقبة** Monitoring — تفعيل Sentry + uptime monitor
11. [ ] **اختبار الدخان** Smoke Test — تشغيل `../04-Smoke-Test/production-smoke-test.js` على الروابط الحقيقية
12. [ ] **لقطة الرجوع** Rollback snapshot — تأكيد نسخة احتياطية للقاعدة + تسجيل أرقام commits

## 3) ماذا تفعل إذا فشل شيء؟ — What to do if something fails?

- **لا تكمل للخطوة التالية.** توقف عند أول فشل. / **Do not proceed to the next step.** Stop at the first failure.
- ارجع إلى `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` القسم 7 (Disaster Recovery Plan) — لكل حالة فشل (قاعدة بيانات، تخزين، بريد، دفع، backend، frontend) هناك خطوات محددة.
  Go to `../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` Section 7 (Disaster Recovery Plan) — every failure type has specific steps.
- إذا لم تجد الحل: أعد نشر آخر نسخة سليمة معروفة (rollback) بدل محاولة إصلاح الإنتاج مباشرة.
  If unsure: redeploy the last known-good build (rollback) rather than trying to fix production live.

## 4) ماذا تفعل بعد نجاح النشر؟ — What to do after a successful launch?

راجع خطة المتابعة الكاملة (24 ساعة / 48 ساعة / 7 أيام / 30 يومًا / 90 يومًا) في:
See the full follow-up plan (24h / 48h / 7 days / 30 days / 90 days) in:
`../08-Deployment-Order-And-Rollback/phase21-launch-preparation.md` — Section 9 (Post-Launch Checklist).

باختصار / In short:
- **أول 24 ساعة:** راقب لوحة الأخطاء باستمرار، تأكد أن التسجيل/الدفع يعملان فعليًا.
  **First 24h:** watch the error dashboard continuously, confirm real signups/orders are processing.
- **بعد 7 أيام:** راجع الاستخدام الحقيقي مقابل توقعات القابلية للتوسع.
  **After 7 days:** review real usage against scalability expectations.

## 5) البوابة الأخيرة — The final gate

لا تضغط "Launch" (أي لا تُعلن نجاح الإطلاق) حتى تتحقق كل هذه الشروط معًا:
Do not press "Launch" (i.e. do not declare launch successful) until ALL of the following are true together:

- [ ] اختبار الدخان الكامل أعطى **0 FAIL** (WARNING مقبول إذا كان مفهوماً ومبررًا) / The full smoke test returned **0 FAIL** (WARN is acceptable if understood and justified).
- [ ] `GET /api/v1/health` يُرجع `database`, `storage`, `stripe` = `true` (و `email` = `true` إذا كان البريد ضمن نطاق الإطلاق) / returns `database`, `storage`, `stripe` = `true` (and `email` = `true` if email is in launch scope).
- [ ] تم تأكيد تسليم إيميل حقيقي واحد على الأقل عبر Postmark / At least one real email delivery confirmed via Postmark.
- [ ] تم تأكيد عملية شراء تجريبية واحدة كاملة (checkout → webhook → تحديث الطلب) / One full test purchase confirmed end-to-end (checkout → webhook → order updated).
- [ ] المراقبة (Sentry + uptime) تستقبل بيانات فعلية / Monitoring (Sentry + uptime) is confirmed receiving real data.
- [ ] تم أخذ لقطة الرجوع (نسخة قاعدة البيانات + أرقام commits) / Rollback snapshot has been taken.

**إذا تحقق كل ما سبق: النشر ناجح. سجّل النتيجة في `../04-Smoke-Test/production-verification-report-template.md`.**
**If all of the above are true: the launch is successful. Record the result in `../04-Smoke-Test/production-verification-report-template.md`.**
