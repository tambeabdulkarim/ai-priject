import { type Locale } from '@/lib/i18n';

type FooterProps = { locale: Locale };

export default function Footer({ locale }: FooterProps) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <footer className="ph-footer" id="contact" dir={dir}>
      <div className="ph-footer-inner">

        {/* Brand column */}
        <div className="ph-footer-brand">
          <div className="ph-footer-logo">
            <span className="ph-brand-icon">🦅</span>
            <div>
              <div className="ph-brand-name">Phoenix Project</div>
              <div className="ph-brand-tag">منصة تبني مهاراتك، خطوة بخطوة</div>
            </div>
          </div>
          <div className="ph-social-row">
            <a href="#" className="ph-social-btn" aria-label="YouTube">▶</a>
            <a href="#" className="ph-social-btn" aria-label="Twitter">𝕏</a>
            <a href="#" className="ph-social-btn" aria-label="LinkedIn">in</a>
            <a href="#" className="ph-social-btn" aria-label="Instagram">📷</a>
            <a href="#" className="ph-social-btn" aria-label="Discord">💬</a>
          </div>
        </div>

        {/* Quick links */}
        <div className="ph-footer-col">
          <h4>روابط سريعة</h4>
          <ul>
            <li><a href="#">من نحن</a></li>
            <li><a href="#">السياسة التشغيلية</a></li>
            <li><a href="#">المدونة</a></li>
            <li><a href="#">اتصل بنا</a></li>
          </ul>
        </div>

        {/* Categories */}
        <div className="ph-footer-col">
          <h4>تصنيفات</h4>
          <ul>
            <li><a href="#">أدوات الذكاء الاصطناعي</a></li>
            <li><a href="#">الدورات التدريبية</a></li>
            <li><a href="#">المسارات المهنية</a></li>
            <li><a href="#">الكتب الإلكترونية</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="ph-footer-col">
          <h4>الدعم والمساعدة</h4>
          <ul>
            <li><a href="#">مركز المساعدة</a></li>
            <li><a href="#">سياسة الخصوصية</a></li>
            <li><a href="#">الشروط والأحكام</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="ph-footer-nl">
          <h4>اشترك في نشرتنا البريدية</h4>
          <p>احصل على آخر الأخبار والعروض مباشرة في بريدك</p>
          <div className="ph-nl-row">
            <input
              type="email"
              className="ph-nl-input"
              placeholder="أدخل بريدك الإلكتروني..."
              aria-label="Email for newsletter"
            />
            <button type="button" className="ph-nl-btn" aria-label="Subscribe">→</button>
          </div>
        </div>

      </div>
      <p className="ph-footer-copy">© 2024 Phoenix Project. جميع الحقوق محفوظة.</p>
    </footer>
  );
}
