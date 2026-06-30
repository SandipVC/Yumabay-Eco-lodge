import { useLang } from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import EditMark from '../cms/EditMark.jsx';
import assetsUrls from '../../assetsUrls.json';

const igIcon  = assetsUrls['social-instagram.png'];
const fbIcon  = assetsUrls['social-facebook.png'];

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
          <a href={`mailto:${f.email}`}><EditMark path="footer.email" label="Footer email">{f.email}</EditMark></a>
          <a href={`tel:${f.phone.replace(/\s/g, '')}`}><EditMark path="footer.phone" label="Footer phone">{f.phone}</EditMark></a>
        </div>
        <p className="footer-address">
          <EditMark path="footer.address" label="Footer address">{f.address.replace(/\n/g, ' ')}</EditMark>
        </p>
      </div>
      <div className="footer-bottom wrap">
        <p className="footer-copy">
          <EditMark path="footer.copyright" label="Copyright line">{f.copyright}</EditMark>
        </p>
        <div className="footer-social">
          <a href={f.instagramUrl || '#'} aria-label={f.instagram} target="_blank" rel="noopener noreferrer"><img src={igIcon} alt={f.instagram} loading="lazy" /></a>
          <a href={f.facebookUrl || '#'} aria-label={f.facebook} target="_blank" rel="noopener noreferrer"><img src={fbIcon} alt={f.facebook} loading="lazy" /></a>
          <a href={f.xUrl || '#'} aria-label={f.xLabel} target="_blank" rel="noopener noreferrer">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', padding: '4px' }}>
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
