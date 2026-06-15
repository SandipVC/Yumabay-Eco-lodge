import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import palmsUrl from '../../assets/figma/palms-about.png';

const DEFAULTS = {
  main:   'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  accent: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
};

export default function About() {
  const { t }      = useLang();
  const a          = t.about;
  const { assets } = useAssets();

  const mainImg   = assets?.about?.main   || DEFAULTS.main;
  const accentImg = assets?.about?.accent || DEFAULTS.accent;

  // Figma sets the heading as one flowing line over the image card.
  const title = `${a.title.replace(/\n/g, ' ')} ${a.titleEm}`;

  const stats = [
    { num: a.stat1Num, lbl: a.stat1Lbl },
    { num: a.stat2Num, lbl: a.stat2Lbl },
    { num: a.stat3Num, lbl: a.stat3Lbl },
  ];

  return (
    <section id="about">
      <img className="about-palms" src={palmsUrl} alt="" aria-hidden loading="lazy" />

      <div className="about-inner">
        <div className="about-head">
          <p className="section-label reveal">{a.label}</p>
          <h2 className="section-title reveal rd1">{title}</h2>
        </div>

        {/* Figma stacks the base render under the coastline aerial */}
        <div className="about-card reveal rd1">
          <img src={mainImg} alt="Yuma Bay aerial view" loading="lazy" />
          <img src={accentImg} alt="Boca de Yuma coastline" loading="lazy" />
        </div>

        <div className="about-side">
          <p className="section-body reveal rd2">{a.body}</p>
          <button
            className="btn-ghost reveal rd3"
            onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {a.viewAll}
          </button>
        </div>
      </div>

      <div className="about-stats reveal">
        {stats.map((s, i) => (
          <div className="stat" key={i}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
