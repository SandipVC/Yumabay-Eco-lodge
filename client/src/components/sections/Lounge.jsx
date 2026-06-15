import { useLang } from '../../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
import patternUrl from '../../assets/figma/palm-band-lounge.png';

export default function Lounge() {
  const { t }    = useLang();
  const l        = t.lounge;
  const navigate = useNavigate();

  // Figma renders the heading as one flowing block (wraps naturally).
  const title = `${l.title.replace(/\n/g, ' ')} ${l.titleEm}`;

  return (
    <section id="lounge">
      <div className="lounge-pattern" style={{ '--pattern': `url(${patternUrl})` }} />
      <div className="lounge-inner wrap">
        <div className="lounge-head reveal">
          <p className="section-label">{l.label}</p>
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="lounge-side reveal rd1">
          <p className="section-body">{l.body}</p>
          <button className="btn-dark" onClick={() => navigate('/contact')}>
            {l.bookBtn}
          </button>
        </div>
      </div>
    </section>
  );
}
