import { useLang } from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import assetsUrls from '../../assetsUrls.json';

const igIcon  = assetsUrls['social-instagram.png'];
const fbIcon  = assetsUrls['social-facebook.png'];
const twIcon  = assetsUrls['social-twitter.png'];
// Local bundled logo — CMS can override via assets.branding.logo
const DEFAULT_LOGO = 'https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/assets%2Fbrand%2Flogo-yb.svg?alt=media';

export default function Footer() {
  const { t } = useLang();
  const { assets } = useAssets();
  const logoUrl = assets?.branding?.logo || DEFAULT_LOGO;
  const f = t.footer;
  const p = t.project;

  return (
    <footer>
      <div className="footer-main wrap">
        <img className="footer-brand" src={logoUrl} alt="Yuma Bay Logo" loading="lazy" />
        <div className="footer-contact">
          <a href={`mailto:${f.email}`}>{f.email}</a>
          <a href={`tel:${f.phone.replace(/\s/g, '')}`}>{f.phone}</a>
        </div>
        <p className="footer-address">{f.address.replace(/\n/g, ' ')}</p>
      </div>
      <div className="footer-bottom wrap">
        <p className="footer-copy">{f.copyright}</p>
        <div className="footer-social">
          <a href="#" aria-label={f.instagram}><img src={igIcon} alt={f.instagram} loading="lazy" /></a>
          <a href="#" aria-label={f.facebook}><img src={fbIcon} alt={f.facebook} loading="lazy" /></a>
          <a href="https://wa.me/18090000000" aria-label={f.whatsapp}><img src={twIcon} alt={f.whatsapp} loading="lazy" /></a>
        </div>
      </div>
    </footer>
  );
}
