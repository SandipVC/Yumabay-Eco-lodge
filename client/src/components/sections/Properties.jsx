import { useState }    from 'react';
import { useNavigate } from 'react-router-dom';
import { motion }      from 'motion/react';
import { useLang }    from '../../context/LanguageContext.jsx';
import { useAssets }  from '../../hooks/useAssets.js';
import SplitText  from '../ui/SplitText.jsx';
import Lightbox   from '../ui/Lightbox.jsx';
import EditMark   from '../cms/EditMark.jsx';

// 1×1 transparent GIF — shown while CMS images haven't loaded yet
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function Properties() {
  const { t }      = useLang();
  const p          = t.properties;
  const navigate   = useNavigate();
  const { assets } = useAssets();

  // Returns the ordered list of CMS-managed URLs for property i.
  // Falls back to a single blank placeholder so the card still renders.
  const getPropertyImageList = (i) => {
    const list = assets?.propertyImages?.[i];
    if (Array.isArray(list)) {
      const valid = list.filter(Boolean);
      if (valid.length > 0) return valid;
    }
    return [BLANK];
  };

  // Hero thumbnail shown on the card = first image in the list
  const heroSrc = (i) => getPropertyImageList(i)[0];

  // Images passed to the Lightbox
  const getLightboxImages = (i) => {
    const name = p.items[i].name;
    return getPropertyImageList(i).map(src => ({ src, label: name }));
  };

  const getDynamicPrice = (i, fallback) => {
    // CMS manual override takes highest priority
    const override = assets?.propertyPrices?.[i];
    if (override && override.trim()) return override.trim();

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

  const title = `${p.title.replace(/\n/g, ' ')} ${p.titleEm}`;
  const enquire = (name) => navigate('/contact', { state: { interest: name } });

  const saleItems   = p.items.map((item, i) => ({ item, i })).filter(({ item }) => item.saleType !== 'rental');
  const rentalItems = p.items.map((item, i) => ({ item, i })).filter(({ item }) => item.saleType === 'rental');

  const renderRow = ({ item, i }) => (
    <article key={i} className={`prop-row reveal${i % 2 === 1 ? ' flip' : ''}`}>
      <div className="prop-media">
        <img src={heroSrc(i)} alt={item.name} loading="lazy" />
        <span
          className="prop-view"
          role="button"
          aria-label={`View ${item.name}`}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={() => openLb(getLightboxImages(i), 0)}
        />
      </div>
      <motion.div
        className="prop-info"
        initial={{ x: i % 2 === 1 ? -80 : 80, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        <div className="prop-header">
          <span className="prop-tag">
            <EditMark path={`properties.items.${i}.tag`} label={`Card ${i + 1} · tag`}>{item.tag}</EditMark>
          </span>
          <h3 className="prop-name">
            <EditMark path={`properties.items.${i}.name`} label={`Card ${i + 1} · name`}>{item.name}</EditMark>
          </h3>
          <p className="prop-area">
            <EditMark path={`properties.items.${i}.area`} label={`Card ${i + 1} · area`}>{item.area}</EditMark>
          </p>
        </div>
        <div className="prop-feats">
          {item.feats.map((f, j) => (
            <span key={j} className="prop-feat">
              <EditMark path={`properties.items.${i}.feats.${j}`} label={`Card ${i + 1} · feature ${j + 1}`}>{f}</EditMark>
            </span>
          ))}
        </div>
        <button className="prop-enquire" onClick={() => enquire(item.name)}>
          <EditMark path="properties.enquire" label="Enquire button">{p.enquire}</EditMark>
        </button>
      </motion.div>
    </article>
  );

  const [lb, setLb] = useState({ open: false, images: [], index: 0 });
  const openLb  = (imgs, i) => setLb({ open: true, images: imgs, index: i });
  const closeLb = ()        => setLb(s => ({ ...s, open: false }));
  const prevLb  = ()        => setLb(s => ({ ...s, index: (s.index - 1 + s.images.length) % s.images.length }));
  const nextLb  = ()        => setLb(s => ({ ...s, index: (s.index + 1) % s.images.length }));

  return (
    <section id="properties">
      <div className="props-head wrap reveal">
        <div>
          <p className="section-label">
            <EditMark path="properties.label" label="Properties label">{p.label}</EditMark>
          </p>
          <EditMark as="div" path={['properties.title', 'properties.titleEm']} label="Properties heading">
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
          </EditMark>
        </div>
        <p className="props-sub">
          <EditMark path="properties.subtitle" label="Properties subtitle">{p.subtitle}</EditMark>
        </p>
      </div>

      <div className="props-list">
        {saleItems.map(renderRow)}
      </div>

      {rentalItems.length > 0 && (
        <>
          <div className="props-divider reveal">
            <div className="props-divider-line" />
            <div className="props-divider-center">
              <span className="props-divider-label">
                <EditMark path="properties.rentalSectionLabel" label="Rental section label">{p.rentalSectionLabel}</EditMark>
              </span>
              {p.rentalSectionNote && (
                <p className="props-divider-note">
                  <EditMark path="properties.rentalSectionNote" label="Rental section note">{p.rentalSectionNote}</EditMark>
                </p>
              )}
            </div>
            <div className="props-divider-line" />
          </div>
          <div className="props-list">
            {rentalItems.map(renderRow)}
          </div>
        </>
      )}
      {lb.open && (
        <Lightbox
          images={lb.images}
          index={lb.index}
          onClose={closeLb}
          onPrev={prevLb}
          onNext={nextLb}
        />
      )}
    </section>
  );
}
