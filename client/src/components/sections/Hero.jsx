/**
 * Hero — auto-advancing "expanding card" slider.
 *
 * A row of upcoming-slide cards sits bottom-right. Every AUTOPLAY_MS (or on
 * arrow/card click) the target card's image expands from its card rect to
 * fill the viewport (manual FLIP via a single absolutely-positioned
 * .hs-expander layer) and becomes the new background, while the slide copy
 * staggers out/in and the card row shifts left.
 *
 * Slides come from the CMS (assets.heroSlider — image + bilingual copy per
 * slide, managed in Dashboard → Media Manager → Hero). DEFAULT_SLIDES below
 * keep the section alive when the API is down or the CMS list is empty.
 */
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';

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
const EXPAND_S    = 1.05;  // card → fullscreen duration
const MAX_CARDS   = 4;     // upcoming cards visible at once
const CARD_RADIUS = 12;    // must match .hs-card border-radius

// Bilingual field with EN fallback (CMS may only have EN filled in).
const pick = (slide, lang, key) =>
  (lang === 'es' ? slide[`${key}Es`] : slide[`${key}En`]) || slide[`${key}En`] || '';

// Rotate so order[pos] becomes current while preserving cyclic order.
const rot = (o, pos) => [...o.slice(pos), ...o.slice(0, pos)];

export default function Hero() {
  const { t, lang } = useLang();
  const { assets }  = useAssets();

  const cmsSlides = Array.isArray(assets?.heroSlider)
    ? assets.heroSlider.filter(s => s && s.src)
    : [];
  const slides = cmsSlides.length ? cmsSlides : DEFAULT_SLIDES;

  const [order, setOrder] = useState(() => slides.map((_, i) => i));

  const sectionRef   = useRef(null);
  const expanderRef  = useRef(null);
  const contentRef   = useRef(null);
  const cardsRowRef  = useRef(null);
  const orderRef     = useRef(order);
  const animatingRef = useRef(false);
  const pendingRef   = useRef(null); // 'fwd' | 'back' — set right before order rotates

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Re-sync ordering when the CMS slide list itself changes.
  const slidesKey = slides.map(s => s.src).join('|');
  useEffect(() => {
    animatingRef.current = false;
    pendingRef.current   = null;
    setOrder(slides.map((_, i) => i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesKey]);

  // The old scrub hero gated the navbar reveal on scroll progress; the slider
  // has no scrub, so release the header immediately (Navbar listens for this).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('yb-hero-progress', { detail: 1 }));
  }, []);

  const current = slides[order[0]] || slides[0];
  const cardEls = () => Array.from(cardsRowRef.current?.children || []);

  /** Advance to the card at position `pos` (1 = first upcoming card). */
  function goTo(pos) {
    const o = orderRef.current;
    if (animatingRef.current || slides.length < 2 || pos < 1 || pos >= o.length) return;
    if (reduced) { setOrder(rot(o, pos)); return; }

    const section = sectionRef.current;
    const exp     = expanderRef.current;
    const cardEl  = cardEls()[pos - 1];
    if (!section || !exp || !cardEl) return;

    animatingRef.current = true;
    const slide = slides[o[pos]];
    const s = section.getBoundingClientRect();
    const c = cardEl.getBoundingClientRect();

    exp.style.backgroundImage = `url("${slide.src}")`;
    gsap.set(exp, {
      x: c.left - s.left, y: c.top - s.top,
      width: c.width, height: c.height,
      borderRadius: CARD_RADIUS, opacity: 1,
    });

    const tl = gsap.timeline({
      // Rotate AFTER the expand completes: the expander now covers the screen
      // with the promoted image, so the underlying <img> swap is invisible.
      onComplete: () => { pendingRef.current = 'fwd'; setOrder(rot(o, pos)); },
    });
    tl.to(cardEl, { opacity: 0, duration: 0.25, ease: 'power1.out' }, 0);
    tl.to(exp, {
      x: 0, y: 0, width: s.width, height: s.height,
      borderRadius: 0, duration: EXPAND_S, ease: 'power3.inOut',
    }, 0.1);
  }

  /** Reverse: the current background shrinks back into the first card slot. */
  function goPrev() {
    const o = orderRef.current;
    if (animatingRef.current || slides.length < 2) return;
    const back = [o[o.length - 1], ...o.slice(0, -1)];
    if (reduced) { setOrder(back); return; }

    const section = sectionRef.current;
    const exp     = expanderRef.current;
    if (!section || !exp) return;

    animatingRef.current = true;
    const s = section.getBoundingClientRect();
    // Freeze the outgoing image fullscreen on the expander, then rotate — the
    // new (previous) slide renders underneath and the layout effect shrinks
    // the expander down into the first card slot.
    exp.style.backgroundImage = `url("${slides[o[0]].src}")`;
    gsap.set(exp, { x: 0, y: 0, width: s.width, height: s.height, borderRadius: 0, opacity: 1 });
    pendingRef.current = 'back';
    setOrder(back);
  }

  // Post-rotation choreography: copy + cards stagger in; expander hides (fwd)
  // or shrinks into the first card (back).
  useLayoutEffect(() => {
    orderRef.current = order;
    const mode = pendingRef.current;
    if (!mode) return;
    pendingRef.current = null;

    const exp     = expanderRef.current;
    const section = sectionRef.current;
    const cards   = cardEls();

    // The brand block is static — only the cards animate on rotation.
    // In 'back' mode the first card is the landing pad for the shrinking
    // background — keep it hidden until the expander settles on it.
    const entering = mode === 'back' ? cards.slice(1) : cards;
    if (entering.length) {
      gsap.fromTo(entering,
        { x: 44, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out' });
    }

    if (mode === 'fwd') {
      if (exp) gsap.set(exp, { opacity: 0 });
      animatingRef.current = false;
      return;
    }

    const first = cards[0];
    if (exp && section && first) {
      gsap.set(first, { x: 0, opacity: 0 });
      const s = section.getBoundingClientRect();
      const c = first.getBoundingClientRect();
      gsap.to(exp, {
        x: c.left - s.left, y: c.top - s.top,
        width: c.width, height: c.height,
        borderRadius: CARD_RADIUS, duration: 0.9, ease: 'power3.inOut',
        onComplete: () => {
          gsap.set(exp, { opacity: 0 });
          gsap.to(first, { opacity: 1, duration: 0.2 });
          animatingRef.current = false;
        },
      });
    } else {
      if (exp) gsap.set(exp, { opacity: 0 });
      animatingRef.current = false;
    }
  }, [order]);

  // Autoplay — the [order] dep restarts the countdown after every transition
  // (auto or manual), so a click never causes a double-advance.
  useEffect(() => {
    if (slides.length < 2 || reduced) return;
    const id = setInterval(() => {
      // Don't expand a card whose image hasn't decoded yet (slow networks) —
      // the background would go black. Wait for the next tick instead.
      const img = cardEls()[0]?.querySelector('img');
      if (img && !(img.complete && img.naturalWidth > 0)) return;
      goTo(1);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, slidesKey]);

  // Entrance animation on first mount.
  useEffect(() => {
    const content = contentRef.current;
    if (content && !reduced) {
      gsap.fromTo(content.children,
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 0.2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="hero" ref={sectionRef}>
      <div className="hs-bg">
        {/* key restarts the Ken Burns zoom for each new slide */}
        <img
          key={current.src}
          className="hs-bg-img"
          src={current.src}
          alt={pick(current, lang, 'title')}
        />
      </div>
      <div className="hs-expander" ref={expanderRef} aria-hidden="true" />
      <div className="hero-overlay" />
      <div className="hero-fade" />

      {/* Static brand block — does NOT change with the slides */}
      <div className="hs-content" ref={contentRef}>
        <h1 className="hs-title">{t.hero.title} {t.hero.titleEm}</h1>
        <p className="hs-tagline">{t.hero.tagline}</p>
      </div>

      {slides.length > 1 && (
        <>
          <div className="hs-cards" ref={cardsRowRef}>
            {order.slice(1, MAX_CARDS + 1).map((slideIdx, i) => {
              const sl = slides[slideIdx];
              return (
                <button
                  key={slideIdx}
                  type="button"
                  className="hs-card"
                  onClick={() => goTo(i + 1)}
                  aria-label={pick(sl, lang, 'title')}
                >
                  {/* eager — these become the next fullscreen backgrounds */}
                  <img src={sl.src} alt="" />
                </button>
              );
            })}
          </div>

          <div className="hs-ui">
            <button type="button" className="hs-arrow" onClick={goPrev} aria-label="Previous slide">←</button>
            <button type="button" className="hs-arrow" onClick={() => goTo(1)} aria-label="Next slide">→</button>
            <div className="hs-progress" aria-hidden="true">
              <span style={{ width: `${((order[0] + 1) / slides.length) * 100}%` }} />
            </div>
            <span className="hs-count">{String(order[0] + 1).padStart(2, '0')}</span>
          </div>
        </>
      )}
    </section>
  );
}
