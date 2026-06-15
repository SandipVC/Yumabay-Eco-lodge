import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';

const DEFAULTS = {
  // No bundled media — the real hero image is served from Firebase Storage via CMS → Hero → Hero Image.
  image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  // Last-resort transparent-pixel fallback.
  fallback: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
};

export default function Hero() {
  const { t }      = useLang();
  const h          = t.hero;
  const { assets } = useAssets();

  // Prefer a CMS-managed hero image (poster slot), then the shipped default.
  const image = assets?.hero?.image || assets?.hero?.poster || DEFAULTS.image;

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  // If the configured image 404s, fall back to a render that ships in the repo.
  const onImgError = (e) => {
    if (e.currentTarget.src.endsWith(DEFAULTS.fallback)) return;
    e.currentTarget.src = DEFAULTS.fallback;
  };

  return (
    <section id="hero">
      <div className="hero-bg" />
      <img
        className="hero-img"
        src={image}
        alt="Yuma Bay Eco Lodge at dusk"
        onError={onImgError}
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-heading">
          <h1 className="hero-title grad-text">{h.title} {h.titleEm}</h1>
          <p className="hero-tagline">{h.tagline}</p>
        </div>
        <div className="hero-actions">
          <button onClick={() => scrollTo('properties')} className="btn-primary">
            {h.exploreBtn}
          </button>
          <button onClick={() => scrollTo('about')} className="btn-ghost">
            {h.discoverBtn}
          </button>
        </div>
      </div>
    </section>
  );
}
