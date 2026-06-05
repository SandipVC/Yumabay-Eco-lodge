import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';

const PROPERTY_IMAGES = [
  '/images/01_1 - Photo.jpg',
  '/images/01_2 - Photo.jpg',
  '/images/01_3 - Photo.jpg',
  '/images/01_4 - Photo.jpg',
  '/images/LOCATION - GRUND 3.jpg',
];

export default function Properties() {
  const { t } = useLang();
  const p = t.properties;
  const navigate = useNavigate();

  return (
    <section id="properties">
      <div className="sec-header reveal">
        <div>
          <p className="section-label">{p.label}</p>
          <h2 className="section-title">
            {p.title.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
            <em>{p.titleEm}</em>
          </h2>
        </div>
        <p className="sec-header-body">{p.subtitle}</p>
      </div>

      <div className="props-grid">
        {p.items.map((item, i) => (
          <div
            key={i}
            className={`prop-card reveal${i === 0 ? ' wide rd0' : i % 2 === 0 ? ' rd2' : ' rd1'}`}
          >
            <img src={PROPERTY_IMAGES[i]} alt={item.name} loading="lazy" />
            <div className="prop-overlay" />
            <div className="prop-content">
              <p className="prop-tag">{item.tag}</p>
              <h3 className="prop-name">{item.name}</h3>
              <p className="prop-area">{item.area}</p>
              <p className="prop-price">{item.price}</p>
              <div className="prop-feats">
                {item.feats.map((f, j) => (
                  <span key={j} className="prop-feat">{f}</span>
                ))}
              </div>
              <button
                className="prop-enquire"
                onClick={() => navigate('/contact', { state: { interest: item.name } })}
              >
                {p.enquire}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
