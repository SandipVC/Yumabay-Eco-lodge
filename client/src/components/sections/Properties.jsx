import { useNavigate } from 'react-router-dom';
import { useLang }    from '../../context/LanguageContext.jsx';
import { useAssets }  from '../../hooks/useAssets.js';
import SplitText from '../ui/SplitText.jsx';

const PROPERTY_DEFAULTS = [
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
];

export default function Properties() {
  const { t }      = useLang();
  const p          = t.properties;
  const navigate   = useNavigate();
  const { assets } = useAssets();

  const images = (assets?.properties?.length ? assets.properties : PROPERTY_DEFAULTS)
    .map((src, i) => src || PROPERTY_DEFAULTS[i] || PROPERTY_DEFAULTS[0]);

  const getDynamicPrice = (i, fallback) => {
    if (!assets?.inventory) return fallback;
    const inv = assets.inventory;
    let units = [];
    if (i === 0) {
      units = inv.villas || [];
    } else if (i === 1) {
      const b = inv.buildings?.find(b => b.id === 'edificio-ab');
      units = b?.units || [];
    } else if (i === 2) {
      const b = inv.buildings?.find(b => b.id === 'edificio-c');
      units = b?.units || [];
    } else if (i === 3) {
      const bD = inv.buildings?.find(b => b.id === 'edificio-d');
      const bE = inv.buildings?.find(b => b.id === 'edificio-e');
      units = [...(bD?.units || []), ...(bE?.units || [])];
    } else {
      return fallback;
    }

    if (!units.length) return fallback;
    const availableUnits = units.filter(u => u.status === 'available' && typeof u.price === 'number');
    if (!availableUnits.length) {
      return t.sitemap?.soldOut || 'Sold Out';
    }
    const min = Math.min(...availableUnits.map(u => u.price));
    return `${p.priceFrom} $${min.toLocaleString()}`;
  };

  // Figma renders the heading as one flowing line.
  const title = `${p.title.replace(/\n/g, ' ')} ${p.titleEm}`;

  const enquire = (name) => navigate('/contact', { state: { interest: name } });

  return (
    <section id="properties">
      <div className="props-head wrap reveal">
        <div>
          <p className="section-label">{p.label}</p>
          <SplitText
            text={title}
            className="section-title"
            delay={10}
            duration={0.25}
            ease="power3.out"
            splitType="chars"
            tag="h2"
            textAlign="left"
          />
        </div>
        <p className="props-sub">{p.subtitle}</p>
      </div>

      <div className="props-list">
        {p.items.map((item, i) => (
          <article key={i} className={`prop-row reveal${i % 2 === 1 ? ' flip' : ''}`}>
            <div className="prop-media" onClick={() => enquire(item.name)}>
              <img src={images[i]} alt={item.name} loading="lazy" />
              <span className="prop-view" aria-hidden />
            </div>
            <div className="prop-info">
              <div className="prop-header">
                <span className="prop-tag">{item.tag}</span>
                <h3 className="prop-name">{item.name}</h3>
                <p className="prop-area">{item.area}</p>
              </div>
              <p className="prop-price">{getDynamicPrice(i, item.price)}</p>
              <div className="prop-feats">
                {item.feats.map((f, j) => (
                  <span key={j} className="prop-feat">{f}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
