import { useState, useMemo } from 'react';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import Lightbox from '../ui/Lightbox.jsx';
import SplitText from '../ui/SplitText.jsx';

// No bundled media — gallery items are served from Firebase Storage via CMS.
const GALLERY_DEFAULTS = [];

const FILTER_MAP = {
  'All': 'All', 'Exterior': 'Exterior', 'Interior': 'Interior', 'Amenities': 'Amenities',
  'Todo': 'All', 'Comodidades': 'Amenities',
};

export default function Gallery() {
  const { t }      = useLang();
  const g          = t.gallery;
  const { assets } = useAssets();

  const [active, setActive]     = useState(g.filters[0]);
  const [lightbox, setLightbox] = useState(null);

  const ALL_IMAGES = assets?.gallery?.length ? assets.gallery : GALLERY_DEFAULTS;

  const filtered = useMemo(() => {
    const key = FILTER_MAP[active] || active;
    return key === 'All' ? ALL_IMAGES : ALL_IMAGES.filter(img => img.cat === key);
  }, [active, ALL_IMAGES]);

  const open  = (i) => setLightbox(i);
  const close = ()  => setLightbox(null);
  const prev  = ()  => setLightbox(i => (i - 1 + filtered.length) % filtered.length);
  const next  = ()  => setLightbox(i => (i + 1) % filtered.length);

  // Figma renders the heading as one flowing line.
  const title = `${g.title} ${g.titleEm} ${g.titleEnd.replace(/\n/g, ' ').trim()}`;

  return (
    <section id="gallery">
      <div className="gallery-head wrap">
        <div>
          <p className="section-label reveal">{g.label}</p>
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
        <div className="gallery-filters reveal rd1">
          {g.filters.map((f) => (
            <button
              key={f}
              className={`filter-btn${active === f ? ' active' : ''}`}
              onClick={() => setActive(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mosaic">
        {filtered.map((img, i) => (
          <div
            key={img.src}
            className="mosaic-item"
            onClick={() => open(i)}
          >
            <img src={img.src} alt={img.label} loading="lazy" />
            <div className="mosaic-overlay">
              <span className="mosaic-label">{img.label}</span>
            </div>
          </div>
        ))}
      </div>

      {lightbox !== null && (
        <Lightbox
          images={filtered}
          index={lightbox}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  );
}
