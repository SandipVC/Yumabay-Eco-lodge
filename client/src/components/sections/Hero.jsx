/**
 * Hero — auto-advancing traditional Right -> Left horizontal slider.
 *
 * Slides come from the CMS (assets.heroSlider — image + bilingual copy per
 * slide, managed in Dashboard → Media Manager → Hero). DEFAULT_SLIDES below
 * keep the section alive when the API is down or the CMS list is empty.
 */
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import EditMark from '../cms/EditMark.jsx';

gsap.registerPlugin(ScrollTrigger);

const FB = 'https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o';

// Development fallbacks — existing gallery renders already in Storage.
const DEFAULT_SLIDES = [
  {
    src: `${FB}/images%2Fcms%2Fgallery%2FRENDER_ANLAGE_YUMA_BAY_ECO_LODGE_1.png?alt=media`,
    kickerEn: 'Boca de Yuma · Dominican Republic',
    kickerEs: 'Boca de Yuma · República Dominicana',
    titleEn: 'Yuma Bay', titleEs: 'Yuma Bay',
    descEn: 'Eco Lodge & Residences on the untouched southeast coast — where the Yuma River meets the Caribbean Sea.',
    descEs: 'Eco Lodge & Residencias en la costa sureste virgen — donde el río Yuma se encuentra con el mar Caribe.',
  },
  {
    src: `${FB}/images%2Fcms%2Fgallery%2FRENDER_ANLAGE_YUMA_BAY_ECO_LODGE_7.png?alt=media`,
    kickerEn: 'Private Residences', kickerEs: 'Residencias privadas',
    titleEn: 'Eco Villas', titleEs: 'Eco Villas',
    descEn: 'Three-bedroom villas with private pools and gardens, a few steps from the shore.',
    descEs: 'Villas de tres habitaciones con piscinas privadas y jardines, a pocos pasos de la orilla.',
  },
  {
    src: `${FB}/images%2Fcms%2Fgallery%2FRENDER_ANLAGE_YUMA_BAY_ECO_LODGE_15.png?alt=media`,
    kickerEn: 'Oceanfront Living', kickerEs: 'Vida frente al mar',
    titleEn: 'Beach Club', titleEs: 'Club de Playa',
    descEn: 'A private beach club with infinity pool, bar and direct access to the Caribbean.',
    descEs: 'Un club de playa privado con piscina infinita, bar y acceso directo al Caribe.',
  },
  {
    src: `${FB}/images%2Fcms%2Fgallery%2FRENDER_ANLAGE_YUMA_BAY_ECO_LODGE_13.png?alt=media`,
    kickerEn: 'Resort Amenities', kickerEs: 'Amenidades del resort',
    titleEn: 'Pool & Gardens', titleEs: 'Piscina y Jardines',
    descEn: 'Tropical pools and lush gardens woven through the whole resort.',
    descEs: 'Piscinas tropicales y exuberantes jardines a lo largo de todo el resort.',
  },
  {
    src: `${FB}/images%2Fcms%2Fgallery%2FYUMA_BAY_CLUB_LOUNGE_1.jpg?alt=media`,
    kickerEn: 'Members & Guests', kickerEs: 'Socios e invitados',
    titleEn: 'Club Lounge', titleEs: 'Club Lounge',
    descEn: 'Restaurant, lounge and co-working with panoramic views over the bay.',
    descEs: 'Restaurante, lounge y co-working con vistas panorámicas a la bahía.',
  },
];

const AUTOPLAY_MS = 6000;

// Bilingual field with EN fallback (CMS may only have EN filled in).
const pick = (slide, lang, key) => {
  if (!slide) return '';
  return (lang === 'es' ? slide[`${key}Es`] : slide[`${key}En`]) || slide[`${key}En`] || '';
};

export default function Hero() {
  const { t, lang } = useLang();
  const { assets }  = useAssets();

  const cmsSlides = Array.isArray(assets?.heroSlider)
    ? assets.heroSlider.filter(s => s && s.src)
    : [];
  const slides = cmsSlides.length ? cmsSlides : DEFAULT_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);

  const sectionRef   = useRef(null);
  const bgRef        = useRef(null);
  const contentRef   = useRef(null);
  const slideRefs    = useRef([]);
  const uiRef        = useRef(null);
  const animatingRef = useRef(false);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Re-sync slide selection when the CMS slide list itself changes.
  const slidesKey = slides.map(s => s.src).join('|');
  useEffect(() => {
    animatingRef.current = false;
    setCurrentIndex(0);
    // Reset position and display styles of all slide refs
    slideRefs.current.forEach((slide, idx) => {
      if (slide) {
        gsap.set(slide, { display: idx === 0 ? 'block' : 'none', x: 0 });
      }
    });
  }, [slidesKey]);

  /** Transition to slide at targetIdx */
  function goToSlide(targetIdx, direction = 'next') {
    if (animatingRef.current || targetIdx === currentIndex || slides.length < 2) return;
    animatingRef.current = true;

    const currentSlide = slideRefs.current[currentIndex];
    const nextSlide = slideRefs.current[targetIdx];

    if (!currentSlide || !nextSlide) {
      setCurrentIndex(targetIdx);
      animatingRef.current = false;
      return;
    }

    const enterFrom = direction === 'next' ? '100%' : '-100%';
    const exitTo    = direction === 'next' ? '-100%' : '100%';

    // Set initial positions before animation
    gsap.set(nextSlide, { display: 'block', x: enterFrom, zIndex: 1 });
    gsap.set(currentSlide, { zIndex: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(currentSlide, { display: 'none', x: 0 });
        setCurrentIndex(targetIdx);
        animatingRef.current = false;
      }
    });

    tl.to(currentSlide, { x: exitTo, duration: 0.9, ease: 'power2.inOut' }, 0);
    tl.to(nextSlide, { x: '0%', duration: 0.9, ease: 'power2.inOut' }, 0);
  }

  function goNext() {
    const target = (currentIndex + 1) % slides.length;
    goToSlide(target, 'next');
  }

  function goPrev() {
    const target = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(target, 'prev');
  }

  function handleDotClick(targetIdx) {
    if (animatingRef.current || targetIdx === currentIndex) return;
    const direction = targetIdx > currentIndex ? 'next' : 'prev';
    goToSlide(targetIdx, direction);
  }

  // Autoplay
  useEffect(() => {
    if (slides.length < 2 || reduced) return;
    const id = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, slidesKey]);

  // Entrance animation for dots/navigation on mount
  useEffect(() => {
    if (reduced) return;
    const ui = uiRef.current;
    if (ui) {
      gsap.fromTo(ui,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.5 });
    }
  }, [reduced]);

  // Staggered text animation on mount
  useEffect(() => {
    if (reduced) return;
    const contentTop = contentRef.current;
    if (contentTop) {
      // Find all elements with hs-anim class within the parent section to stagger them
      const anims = sectionRef.current?.querySelectorAll('.hs-anim');
      if (anims) {
        gsap.fromTo(anims,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power2.out' });
      }
    }
  }, [reduced]);

  // Parallax ScrollTrigger
  useEffect(() => {
    if (reduced) return;
    const bgContainer = bgRef.current;
    if (!bgContainer) return;

    const trigger = gsap.to(bgContainer, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

    return () => {
      trigger.scrollTrigger?.kill();
    };
  }, [reduced]);

  const current = slides[currentIndex] || slides[0];

  return (
    <section id="hero" ref={sectionRef}>
      <div className="hs-bg" ref={bgRef}>
        {slides.map((slide, idx) => (
          <div
            key={slide.src}
            ref={el => slideRefs.current[idx] = el}
            className="hs-slide"
            style={{
              position: 'absolute',
              inset: 0,
              display: idx === currentIndex ? 'block' : 'none',
              overflow: 'hidden',
            }}
          >
            <img
              className="hs-bg-img"
              src={slide.src}
              alt={pick(slide, lang, 'title')}
            />
          </div>
        ))}
      </div>
      <div className="hero-overlay" />
      <div className="hero-fade" />

      {/* Top blur strip */}
      <div className="hs-blur-top" />
      {/* Bottom blur strip */}
      <div className="hs-blur-bottom" />

      {/* Static brand block — does NOT change with the slides */}
      <div className="hs-content-top" ref={contentRef}>
        <span className="hs-brand-name hs-anim">
          <EditMark path="hero.brandName" label="Hero Brand Name">{t.hero?.brandName}</EditMark>
        </span>
        <h1 className="hs-slide-title hs-anim">
          <EditMark path="hero.title" label="Hero Title">{t.hero?.title}</EditMark>
        </h1>
        <div className="hs-slide-kicker hs-anim">
          <span>
            <EditMark path="hero.kicker" label="Hero Kicker">{t.hero?.kicker}</EditMark>
          </span>
        </div>
      </div>
      
      <div className="hs-content-bottom">
        <p className="hs-slide-desc hs-anim">
          <EditMark path="hero.desc" label="Hero Description">{t.hero?.desc}</EditMark>
        </p>
      </div>

      {slides.length > 1 && (
        <div className="hs-dots" ref={uiRef}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`hs-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
