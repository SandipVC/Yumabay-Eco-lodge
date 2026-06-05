import { useLang } from '../../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

const LOUNGE_IMGS = [
  '/images/YUMA BAY CLUB LOUNGE  (7).jpg',
  '/images/YUMA BAY CLUB LOUNGE  (8).jpg',
  '/images/YUMA BAY CLUB LOUNGE  (9).jpg',
  '/images/YUMA BAY CLUB LOUNGE  (10).jpg',
];

export default function Lounge() {
  const { t } = useLang();
  const l = t.lounge;
  const navigate = useNavigate();

  return (
    <section id="lounge">
      <div className="lounge-grid">
        <div className="lounge-info reveal">
          <p className="section-label">{l.label}</p>
          <h2 className="section-title">
            {l.title.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
            <em>{l.titleEm}</em>
          </h2>
          <p className="section-body">{l.body}</p>
          <button className="btn-primary" onClick={() => navigate('/contact')}>
            {l.bookBtn}
          </button>
        </div>
        <div className="lounge-imgs">
          {LOUNGE_IMGS.map((src, i) => (
            <img key={i} src={src} alt={`Club Lounge ${i + 1}`} loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}
