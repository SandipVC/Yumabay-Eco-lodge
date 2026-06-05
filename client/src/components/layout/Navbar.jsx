import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';

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

  const scrollTo = (id) => {
    setMenuOpen(false);
    if (!isHome) { window.location.href = `/#${id}`; return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <Link to="/" className="nav-logo">
          YUMA BAY
          <span>Eco Lodge · Dominican Republic</span>
        </Link>

        <ul className="nav-links">
          <li><button className="nav-link-btn" onClick={() => scrollTo('about')}>{t.nav.about}</button></li>
          <li><button className="nav-link-btn" onClick={() => scrollTo('properties')}>{t.nav.properties}</button></li>
          <li><button className="nav-link-btn" onClick={() => scrollTo('gallery')}>{t.nav.gallery}</button></li>
          <li><button className="nav-link-btn" onClick={() => scrollTo('amenities')}>{t.nav.amenities}</button></li>
          <li><button className="nav-link-btn" onClick={() => scrollTo('location')}>{t.nav.location}</button></li>
          <li><Link to="/sitemap" className="nav-link-a">{t.nav.siteMap}</Link></li>
        </ul>

        <div className="nav-right">
          <button onClick={toggle} className="lang-toggle" aria-label="Toggle language">
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <Link to="/contact" className="nav-cta">{t.nav.reserveNow}</Link>
          <button
            className={`nav-mobile-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <button className="mobile-menu-item" onClick={() => scrollTo('about')}>{t.nav.about}</button>
          <button className="mobile-menu-item" onClick={() => scrollTo('properties')}>{t.nav.properties}</button>
          <button className="mobile-menu-item" onClick={() => scrollTo('gallery')}>{t.nav.gallery}</button>
          <button className="mobile-menu-item" onClick={() => scrollTo('amenities')}>{t.nav.amenities}</button>
          <button className="mobile-menu-item" onClick={() => scrollTo('location')}>{t.nav.location}</button>
          <Link className="mobile-menu-item" to="/contact" onClick={() => setMenuOpen(false)}>{t.nav.contact}</Link>
          <Link className="mobile-menu-item" to="/sitemap" onClick={() => setMenuOpen(false)}>{t.nav.siteMap}</Link>
          <button className="mobile-menu-item" onClick={() => { toggle(); setMenuOpen(false); }}>
            {lang === 'en' ? 'Español' : 'English'}
          </button>
        </div>
      )}

      <style>{`
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .nav-link-btn {
          font-size: 11px; letter-spacing: .25em; text-transform: uppercase;
          color: rgba(255,255,255,.75); background: none; border: none;
          cursor: pointer; font-family: 'Jost', sans-serif; font-weight: 300;
          transition: color .3s; position: relative; padding: 0; white-space: nowrap;
        }
        .nav-link-btn::after {
          content: ''; position: absolute; bottom: -4px; left: 0;
          width: 0; height: 1px; background: var(--gold); transition: width .3s;
        }
        .nav-link-btn:hover { color: var(--gold); }
        .nav-link-btn:hover::after { width: 100%; }
        .nav-link-a {
          font-size: 11px; letter-spacing: .25em; text-transform: uppercase;
          color: rgba(255,255,255,.75); text-decoration: none; font-weight: 300;
          transition: color .3s; white-space: nowrap;
        }
        .nav-link-a:hover { color: var(--gold); }
        /* Mobile overlay menu */
        .mobile-menu {
          position: fixed; top: 68px; left: 0; right: 0; bottom: 0;
          background: rgba(10,26,34,.97); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 99; display: flex; flex-direction: column; padding: 24px;
          overflow-y: auto;
        }
        .mobile-menu-item {
          display: block; width: 100%; text-align: left;
          font-size: 14px; letter-spacing: .2em; text-transform: uppercase;
          color: rgba(255,255,255,.75); background: none; border: none;
          cursor: pointer; font-family: 'Jost', sans-serif; font-weight: 300;
          padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,.06);
          text-decoration: none; transition: color .3s;
        }
        .mobile-menu-item:hover { color: var(--gold); }
      `}</style>
    </>
  );
}
