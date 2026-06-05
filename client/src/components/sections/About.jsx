import { useLang } from '../../context/LanguageContext.jsx';

export default function About() {
  const { t } = useLang();
  const a = t.about;

  return (
    <section id="about">
      <div className="about-images reveal">
        <div className="about-badge">
          <span className="badge-num">2</span>
          <span className="badge-lbl">{a.badge}</span>
        </div>
        <img
          className="about-main-img"
          src="/images/WhatsApp Image 2026-04-30 at 14.12.35.jpeg"
          alt="Yuma Bay aerial view"
          loading="lazy"
        />
        <img
          className="about-accent-img"
          src="/images/LOCATION - GRUND.jpg"
          alt="Boca de Yuma coastline"
          loading="lazy"
        />
      </div>

      <div>
        <p className="section-label reveal">{a.label}</p>
        <h2 className="section-title reveal rd1">
          {a.title.split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
          <br /><em>{a.titleEm}</em>
        </h2>
        <p className="section-body reveal rd2">{a.body}</p>
        <div className="stats-row reveal rd2">
          <div className="stat">
            <div className="stat-num">{a.stat1Num}</div>
            <div className="stat-lbl">{a.stat1Lbl}</div>
          </div>
          <div className="stat">
            <div className="stat-num">{a.stat2Num}</div>
            <div className="stat-lbl">{a.stat2Lbl}</div>
          </div>
          <div className="stat">
            <div className="stat-num">{a.stat3Num}</div>
            <div className="stat-lbl">{a.stat3Lbl}</div>
          </div>
        </div>
        <button
          className="btn-primary reveal rd3"
          onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
        >
          {a.viewAll}
        </button>
      </div>
    </section>
  );
}
