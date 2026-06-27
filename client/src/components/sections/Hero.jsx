import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';

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

  // CMS poster acts as a still while the video buffers / on reduced-data clients.
  const poster = assets?.hero?.poster || POSTER_FALLBACK;
  // CMS-uploaded video wins; falls back to the bundled scroll-scrub encode.
  const videoSrc = assets?.hero?.video || VIDEO_SRC;

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  // useLayoutEffect (not useEffect): its cleanup runs during React's mutation
  // phase, BEFORE React removes #hero on unmount. That lets trigger.kill(true)
  // revert the ScrollTrigger pin (un-reparent #hero from the pin-spacer) in time,
  // so React's removeChild(#hero) doesn't throw NotFoundError.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const video   = videoRef.current;
    if (!section || !video) return;

    let trigger;

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

      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end:   () => `+=${runway}`,
        pin:   true,
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
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
    }

    return () => {
      // kill(true) reverts the pin: removes the generated pin-spacer and moves
      // #hero back into its original React parent BEFORE React unmounts the tree.
      // Without revert, React's removeChild(#hero) fails (node lives in pin-spacer).
      trigger?.kill(true);
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
      <div className="hero-fade" />
      <div className="hero-content">
        <div className="hero-heading">
          <h1 className="hero-title grad-text">{h.title} {h.titleEm}</h1>
          <p className="hero-tagline">{h.tagline}</p>
        </div>
        <div className="hero-actions">
          <div className="hero-action-btns">
            <button onClick={() => scrollTo('properties')} className="btn-primary">
              {h.exploreBtn}
            </button>
            <button onClick={() => scrollTo('about')} className="btn-ghost">
              {h.discoverBtn}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
