import { useLang } from '../../context/LanguageContext.jsx';
import assetsUrls from '../../assetsUrls.json';

const igIcon  = assetsUrls['social-instagram.png'];
const fbIcon  = assetsUrls['social-facebook.png'];
const twIcon  = assetsUrls['social-twitter.png'];
const logoUrl = assetsUrls['logo.png'];

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;

  return (
    <footer>
      <div className="footer-main wrap">
        <img className="footer-brand" src={logoUrl} alt="Yuma Bay Logo" />
        <div className="footer-contact">
          <a href={`mailto:${f.email}`}>{f.email}</a>
          <a href={`tel:${f.phone.replace(/\s/g, '')}`}>{f.phone}</a>
        </div>
        <p className="footer-address">{f.address.replace(/\n/g, ' ')}</p>
      </div>
      <div className="footer-bottom wrap">
        <p className="footer-copy">{f.copyright}</p>
        <div className="footer-social">
          <a href="#" aria-label={f.instagram}><img src={igIcon} alt={f.instagram} /></a>
          <a href="#" aria-label={f.facebook}><img src={fbIcon} alt={f.facebook} /></a>
          <a href="https://wa.me/18090000000" aria-label={f.whatsapp}><img src={twIcon} alt={f.whatsapp} /></a>
        </div>
      </div>
    </footer>
  );
}
