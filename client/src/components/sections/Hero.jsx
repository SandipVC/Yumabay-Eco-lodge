import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';

export default function Hero() {
  const { t } = useLang();
  const h = t.hero;

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="hero">
      <div className="hero-bg" />
      <video
        className="hero-video"
        src="/video/hero.mp4"
        autoPlay muted loop playsInline
        poster="/images/RENDER ANLAGE YUMA BAY ECO LODGE (1).png"
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="hero-eyebrow">{h.eyebrow}</p>
        <h1 className="hero-title">
          {h.title}<br /><em>{h.titleEm}</em>
        </h1>
        <p className="hero-tagline">{h.tagline}</p>
        <div className="hero-actions">
          <button onClick={() => scrollTo('properties')} className="btn-primary">
            {h.exploreBtn}
          </button>
          <button onClick={() => scrollTo('about')} className="btn-ghost">
            {h.discoverBtn}
          </button>
        </div>
      </div>
      <div className="hero-scroll">
        <div className="scroll-line" />
        <span className="scroll-lbl">Scroll</span>
      </div>
    </section>
  );
}
