import { useState, useMemo } from 'react';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import Lightbox from '../ui/Lightbox.jsx';

const GALLERY_DEFAULTS = [
  { src: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (1).png',  label: 'Yuma Bay Overview',  cat: 'Exterior' },
  { src: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (3).png',  label: 'Aerial View',        cat: 'Exterior' },
  { src: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (7).png',  label: 'Villa Exterior',     cat: 'Exterior' },
  { src: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (9).png',  label: 'Beach Club',         cat: 'Exterior' },
  { src: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (11).png', label: 'Pool Area',          cat: 'Exterior' },
  { src: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (13).png', label: 'Garden Terrace',     cat: 'Exterior' },
  { src: '/images/LOCATION - GRUND.jpg',                      label: 'Boca de Yuma Coast', cat: 'Exterior' },
  { src: '/images/LOCATION - GRUND 3.jpg',                    label: 'Location View',      cat: 'Exterior' },
  { src: '/images/LOCATION - GRUND - 2.jpg',                  label: 'Bahia de Yuma',      cat: 'Exterior' },
  { src: '/images/LOCATION - GRUND 4.jpg',                    label: 'Eastern Coast',      cat: 'Exterior' },
  { src: '/images/R-01.png', label: 'Living Room',    cat: 'Interior' },
  { src: '/images/R-02.png', label: 'Master Bedroom', cat: 'Interior' },
  { src: '/images/R-03.png', label: 'Kitchen',        cat: 'Interior' },
  { src: '/images/R-04.png', label: 'Bathroom',       cat: 'Interior' },
  { src: '/images/R-05.png', label: 'Terrace View',   cat: 'Interior' },
  { src: '/images/R-06.png', label: 'Dining Area',    cat: 'Interior' },
  { src: '/images/R-07.png', label: 'Second Bedroom', cat: 'Interior' },
  { src: '/images/R-08.png', label: 'Study',          cat: 'Interior' },
  { src: '/images/R-09.png', label: 'Jacuzzi',        cat: 'Interior' },
  { src: '/images/R-10.png', label: 'Corridor',       cat: 'Interior' },
  { src: '/images/YUMA BAY CLUB LOUNGE  (1).jpg', label: 'Club Lounge',    cat: 'Amenities' },
  { src: '/images/YUMA BAY CLUB LOUNGE  (2).jpg', label: 'Lounge Bar',     cat: 'Amenities' },
  { src: '/images/YUMA BAY CLUB LOUNGE  (3).jpg', label: 'Lounge Terrace', cat: 'Amenities' },
  { src: '/images/YUMA BAY CLUB LOUNGE  (4).jpg', label: 'Pool Deck',      cat: 'Amenities' },
  { src: '/images/YUMA BAY CLUB LOUNGE  (5).jpg', label: 'Beach Club View','cat': 'Amenities' },
  { src: '/images/YUMA BAY CLUB LOUNGE  (6).jpg', label: 'Club Interior',  cat: 'Amenities' },
  { src: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (15).png', label: 'Swimming Pool', cat: 'Amenities' },
  { src: '/images/RENDER ANLAGE YUMA BAY ECO LODGE (17).png', label: 'Gym',           cat: 'Amenities' },
];

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

  return (
    <section id="gallery">
      <div className="gallery-head">
        <p className="section-label reveal">{g.label}</p>
        <h2 className="section-title reveal rd1">
          {g.title} <em>{g.titleEm}</em>
          {g.titleEnd}
        </h2>
      </div>

      <div className="gallery-filters">
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

      <div className="masonry">
        {filtered.map((img, i) => (
          <div
            key={img.src}
            className="masonry-item"
            onClick={() => open(i)}
          >
            <img src={img.src} alt={img.label} loading="lazy" />
            <div className="masonry-overlay">
              <span className="masonry-label">{img.label}</span>
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
