import { getDictionary, type Locale } from '@/lib/i18n';

type FooterProps = {
  locale: Locale;
};

export default function Footer({ locale }: FooterProps) {
  const dict = getDictionary(locale);

  return (
    <footer className="footer" id="contact">
      <div>
        <h3>{dict.footer.brand}</h3>
        <p>{dict.footer.tagline}</p>
      </div>
      <p>{dict.footer.copyright}</p>
    </footer>
  );
}
