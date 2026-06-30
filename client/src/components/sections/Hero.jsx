import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';

// Scrub progress past which the header is allowed to drop in from above.
export const NAV_REVEAL_AT = 0.98;

gsap.registerPlugin(ScrollTrigger);

// All-keyframe re-encode (every frame is an I-frame) → instant seek on scrub.
// Used as the fallback when no CMS video is set (assets.hero.video).
const VIDEO_SRC = '/video/intro-scrub.mp4';
const POSTER_FALLBACK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// Scroll runway per second of video. Higher = slower scrub, more scroll required.
const PX_PER_SECOND = 150;

export default function Hero() {
  const { t }      = useLang();
  const h          = t.hero;
  const { assets } = useAssets();
  const sectionRef = useRef(null);
  const videoRef   = useRef(null);
  const logoRef    = useRef(null);

  // CMS poster acts as a still while the video buffers / on reduced-data clients.
  const poster = assets?.hero?.poster || POSTER_FALLBACK;
  // CMS-uploaded video wins; falls back to the bundled scroll-scrub encode.
  const videoSrc = assets?.hero?.video || VIDEO_SRC;

  // useLayoutEffect (not useEffect): its cleanup runs during React's mutation
  // phase, BEFORE React removes #hero on unmount. That lets trigger.kill(true)
  // revert the ScrollTrigger pin (un-reparent #hero from the pin-spacer) in time,
  // so React's removeChild(#hero) doesn't throw NotFoundError.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const video   = videoRef.current;
    if (!section || !video) return;

    let trigger;

    // Pin the hero to the EXACT pin viewport. ScrollTrigger pins using
    // window.innerHeight, but CSS `height:100vh` resolves to a different value on
    // mobile (the URL-bar dance). The mismatch left a white strip below the video
    // while pinned. Locking the section height to innerHeight (re-synced on every
    // refresh) keeps the video filling the pinned viewport — no gap, scrub from the
    // first pixel of scroll.
    const sizeHero = () => { section.style.height = `${window.innerHeight}px`; };
    sizeHero();
    ScrollTrigger.addEventListener('refreshInit', sizeHero);

    const setup = () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) return;

      // We drive frames from scroll — stop autoplay.
      video.pause();
      video.currentTime = 0;

      const runway = Math.max(window.innerHeight, duration * PX_PER_SECOND);

      // rAF-throttled seek — coalesces many ScrollTrigger updates per frame
      // into one currentTime write per repaint, which is what the decoder can
      // actually keep up with on H.264.
      let targetTime = 0;
      let pendingFrame = 0;
      const flush = () => {
        pendingFrame = 0;
        if (Math.abs(video.currentTime - targetTime) > 0.02) {
          try { video.currentTime = targetTime; } catch { /* noop */ }
        }
      };

      // Logo: fades + drifts up over the first half of the scrub.
      // Header: stays hidden until the scrub is (almost) complete, then the
      // Navbar drops in from above (it listens for the broadcast progress).
      const applyProgress = (p) => {
        const logo = logoRef.current;
        if (logo) {
          const fade = Math.min(p / 0.5, 1);   // gone by 50% progress
          logo.style.opacity = String(1 - fade);
          logo.style.transform = `translate(-50%, ${-fade * 120}px)`;
        }
        window.dispatchEvent(new CustomEvent('yb-hero-progress', { detail: p }));
      };
      applyProgress(0);

      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end:   () => `+=${runway}`,
        pin:   true,
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyProgress(self.progress);
          if (video.readyState < 1) return;
          targetTime = self.progress * duration;
          if (!pendingFrame) {
            pendingFrame = requestAnimationFrame(flush);
          }
        },
      });
      ScrollTrigger.refresh();
    };

    if (video.readyState >= 1) {
      setup();
    } else {
      video.addEventListener('loadedmetadata', setup, { once: true });
    }

    // Respect reduced-motion: skip scrub, leave normal autoplay loop.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      trigger?.kill();
      video.play().catch(() => {});
      // No scrub → reveal the header immediately and clear the logo offset.
      if (logoRef.current) logoRef.current.style.opacity = '0';
      window.dispatchEvent(new CustomEvent('yb-hero-progress', { detail: 1 }));
    }

    return () => {
      // kill(true) reverts the pin: removes the generated pin-spacer and moves
      // #hero back into its original React parent BEFORE React unmounts the tree.
      // Without revert, React's removeChild(#hero) fails (node lives in pin-spacer).
      trigger?.kill(true);
      ScrollTrigger.removeEventListener('refreshInit', sizeHero);
      video.removeEventListener('loadedmetadata', setup);
    };
  }, [videoSrc]);

  return (
    <section id="hero" ref={sectionRef}>
      <div className="hero-bg" />
      <video
        ref={videoRef}
        className="hero-video"
        src={videoSrc}
        poster={poster}
        muted
        playsInline
        preload="auto"
        aria-label="Yuma Bay Eco Lodge intro"
      />
      <div className="hero-overlay" />
      <div className="hero-logo-center" ref={logoRef}>
        <h1 className="hero-title grad-text">{h.title} {h.titleEm}</h1>
        <p className="hero-tagline">{h.tagline}</p>
      </div>
    </section>
  );
}
