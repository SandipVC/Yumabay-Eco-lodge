import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';

const DEFAULTS = {
  // Static fallback shipped with the repo; override via CMS → Hero → Hero Image.
  image: '/images/hero.jpg',
  // Last-resort fallback to an asset that always exists on disk.
  fallback: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (9).png',
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
