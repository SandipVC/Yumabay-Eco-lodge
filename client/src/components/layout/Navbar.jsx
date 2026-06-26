import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';
import assetsUrls from '../../assetsUrls.json';

const menuIcon = assetsUrls['menu-lines.svg'];
const logoUrl  = assetsUrls['logo.png'];

export default function Navbar() {
  const { t, lang, toggle } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock page scroll while the overlay menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollTo = (id) => {
    setMenuOpen(false);
    if (!isHome) { window.location.href = `/#${id}`; return; }
    // Release the overlay scroll-lock before scrolling (the effect runs post-paint).
    document.body.style.overflow = '';
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  return (
    <>
      <nav id="nav" className={scrolled || menuOpen ? 'scrolled' : ''}>
        <Link to="/" className="nav-logo">
          <img src={logoUrl} alt="Yuma Bay Logo" />
        </Link>

        <div className="nav-right">
          <button
            className="nav-menu-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen
              ? <span className="nav-close">✕</span>
              : <img src={menuIcon} alt="" />}
          </button>
          <button onClick={toggle} className="lang-box" aria-label="Toggle language">
            {lang === 'en' ? 'EN' : 'ES'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="nav-overlay">
          <button className="nav-overlay-link" onClick={() => scrollTo('about')}>{t.nav.about}</button>
          <button className="nav-overlay-link" onClick={() => scrollTo('properties')}>{t.nav.properties}</button>
          <button className="nav-overlay-link" onClick={() => scrollTo('gallery')}>{t.nav.gallery}</button>
          <button className="nav-overlay-link" onClick={() => scrollTo('amenities')}>{t.nav.amenities}</button>
          <button className="nav-overlay-link" onClick={() => scrollTo('location')}>{t.nav.location}</button>
          <Link className="nav-overlay-link" to="/sitemap" onClick={() => setMenuOpen(false)}>{t.nav.siteMap}</Link>
          <Link className="nav-overlay-link" to="/contact" onClick={() => setMenuOpen(false)}>{t.nav.reserveNow}</Link>
        </div>
      )}
    </>
  );
}
