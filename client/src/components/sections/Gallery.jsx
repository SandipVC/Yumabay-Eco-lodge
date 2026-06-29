import { useState, useMemo, useEffect } from 'react';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import Lightbox from '../ui/Lightbox.jsx';
import SplitText from '../ui/SplitText.jsx';

// No bundled media — gallery items are served from Firebase Storage via CMS.
const GALLERY_DEFAULTS = [];

const FILTER_MAP = {
  'All': 'All', 'Villas': 'Villas', 'Apartments': 'Apartments',
  'Beach Club & Amenities': 'Amenities', 'Boca de Yuma': 'Boca de Yuma',
  'Todo': 'All', 'Apartamentos': 'Apartments',
  'Club de Playa y Comodidades': 'Amenities',
  // legacy cats still in data — shown under All only
  'Exterior': 'Exterior', 'Interior': 'Interior', 'Comodidades': 'Amenities',
};

// One full pass of the 18-tile mosaic pattern fills exactly 3 rows by item 10.
// Each "Load More" reveals the next chunk.
const PAGE_SIZE = 10;

export default function Gallery() {
  const { t, lang } = useLang();
  const g           = t.gallery;
  const { assets } = useAssets();

  const [active, setActive]     = useState(g.filters[0]);
  const [lightbox, setLightbox] = useState(null);
  const [visible, setVisible]   = useState(PAGE_SIZE);

  const ALL_IMAGES    = assets?.gallery?.length ? assets.gallery : GALLERY_DEFAULTS;
  const labelsEnabled = assets?.galleryShowLabels !== false;

  const filtered = useMemo(() => {
    const key = FILTER_MAP[active] || active;
    return key === 'All' ? ALL_IMAGES : ALL_IMAGES.filter(img => img.cat === key);
  }, [active, ALL_IMAGES]);

  // Collapse back to the first 3 rows whenever the filter changes.
  useEffect(() => { setVisible(PAGE_SIZE); }, [active]);

  const shown      = filtered.slice(0, visible);
  const hasMore    = filtered.length > visible;
  const loadMore   = () => setVisible(v => v + PAGE_SIZE);

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
        {shown.map((img, i) => (
          <div
            key={img.src}
            className="mosaic-item"
            onClick={() => open(i)}
          >
            {(() => {
              // If labelEn key exists (new record), never fall back to legacy label.
              const hasNew = 'labelEn' in img;
              const label = lang === 'es'
                ? (hasNew ? (img.labelEs || '') : (img.label || ''))
                : (hasNew ? (img.labelEn || '') : (img.label || ''));
              return (
                <>
                  <img src={img.src} alt={label} loading="lazy" />
                  {labelsEnabled && label && (
                    <div className="mosaic-overlay">
                      <span className="mosaic-label">{label}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="gallery-more">
          <button className="btn-outline" onClick={loadMore}>
            {g.loadMore}
          </button>
        </div>
      )}

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
