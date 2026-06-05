import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;

  return (
    <footer>
      <div className="footer-top">
        <div>
          <div className="footer-brand">YUMA BAY</div>
          <p className="footer-tagline">{f.tagline}</p>
        </div>
        <div className="footer-col">
          <h4>{f.propertiesCol}</h4>
          <ul>
            {f.propertiesLinks.map((l, i) => (
              <li key={i}><Link to="/contact">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>{f.devCol}</h4>
          <ul>
            {f.devLinks.map((l, i) => (
              <li key={i}><Link to="/sitemap">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>{f.contactCol}</h4>
          <ul>
            <li style={{ whiteSpace: 'pre-line' }}>{f.address}</li>
            <li><a href={`mailto:${f.email}`}>{f.email}</a></li>
            <li><a href={`tel:${f.phone.replace(/\s/g,'')}`}>{f.phone}</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">{f.copyright}</p>
        <div className="footer-social">
          <a href="#" aria-label="Instagram">{f.instagram}</a>
          <a href="#" aria-label="Facebook">{f.facebook}</a>
          <a href="https://wa.me/18090000000" aria-label="WhatsApp">{f.whatsapp}</a>
        </div>
      </div>
    </footer>
  );
}
