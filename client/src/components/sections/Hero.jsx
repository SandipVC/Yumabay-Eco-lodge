import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import EditMark from '../cms/EditMark.jsx';

// Scrub progress past which the header is allowed to drop in from above.
export const NAV_REVEAL_AT = 0.98;

gsap.registerPlugin(ScrollTrigger);

// Mobile browsers fire a resize when the URL bar shows/hides during scroll.
// Without this, ScrollTrigger re-pins mid-scroll — the hero scrolls a little,
// then snaps into the scrub (with a white strip below). Ignoring those bar-only
// resizes keeps the pin locked from the first pixel of scroll.
ScrollTrigger.config({ ignoreMobileResize: true });

// The scrub video is supplied entirely via the CMS (assets.hero.video) — upload
// an all-keyframe (every frame an I-frame) re-encode for instant seeking. No
// video is bundled with the app (kept the 100+MB of media out of the deploy).
// When no CMS video is set the hero falls back to a static poster (no scrub).
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
  // Scrub video comes only from the CMS. Empty string → static poster hero.
  const videoSrc = assets?.hero?.video || '';
  const hasVideo = Boolean(videoSrc);

  // useLayoutEffect (not useEffect): its cleanup runs during React's mutation
  // phase, BEFORE React removes #hero on unmount. That lets trigger.kill(true)
  // revert the ScrollTrigger pin (un-reparent #hero from the pin-spacer) in time,
  // so React's removeChild(#hero) doesn't throw NotFoundError.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // No CMS video → static poster hero: no pin, no scrub. Keep the centre logo
    // visible and reveal the header immediately so the page behaves normally.
    if (!hasVideo) {
      if (logoRef.current) { logoRef.current.style.opacity = ''; logoRef.current.style.transform = ''; }
      window.dispatchEvent(new CustomEvent('yb-hero-progress', { detail: 1 }));
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Duration is 0 until the video reports metadata. Until then the runway is
    // just one viewport so the pin can be created IMMEDIATELY — otherwise the
    // hero free-scrolls (video visibly slides up) until metadata loads on slower
    // mobile networks, then snaps into the scrub. Pinning at mount kills that.
    const getDuration = () =>
      (video.duration && isFinite(video.duration)) ? video.duration : 0;
    const getRunway = () => {
      const d = getDuration();
      return d > 0 ? Math.max(window.innerHeight, d * PX_PER_SECOND) : window.innerHeight;
    };

    // Directly set currentTime on GSAP's tick. ScrollTrigger's onUpdate is already
    // synchronized with requestAnimationFrame, so a secondary rAF here causes 
    // frame drops and stuttering on Android.
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

    let trigger;

    if (reducedMotion) {
      // Skip scrub, leave a normal autoplay loop, reveal the header immediately.
      video.play().catch(() => {});
      if (logoRef.current) logoRef.current.style.opacity = '0';
      window.dispatchEvent(new CustomEvent('yb-hero-progress', { detail: 1 }));
    } else {
      // Created at mount, before metadata — anticipatePin avoids the 1-frame
      // engage jump on fast flicks. invalidateOnRefresh re-reads getRunway() once
      // duration is known.
      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end:   () => `+=${getRunway()}`,
        pin:   true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyProgress(self.progress);
          const d = getDuration();
          if (d <= 0 || video.readyState < 1) return;
          const targetTime = self.progress * d;
          if (Math.abs(video.currentTime - targetTime) > 0.02) {
            try { video.currentTime = targetTime; } catch { /* noop */ }
          }
        },
      });
    }

    // Metadata arrived → stop autoplay, reset to frame 0, recompute the runway.
    const onMeta = () => {
      if (reducedMotion) return;
      video.pause();
      try { video.currentTime = 0; } catch { /* noop */ }
      ScrollTrigger.refresh();
    };
    if (video.readyState >= 1) onMeta();
    else video.addEventListener('loadedmetadata', onMeta, { once: true });

    // Android/iOS sometimes refuse to seek via JS unless the video has been explicitly 
    // played via a user interaction. This unlocks the media engine on the first touch.
    const unlockVideo = () => {
      video.play().then(() => {
        video.pause();
      }).catch(() => {});
      window.removeEventListener('touchstart', unlockVideo);
    };
    window.addEventListener('touchstart', unlockVideo);

    return () => {
      // kill(true) reverts the pin: removes the generated pin-spacer and moves
      // #hero back into its original React parent BEFORE React unmounts the tree.
      // Without revert, React's removeChild(#hero) fails (node lives in pin-spacer).
      trigger?.kill(true);
      video.removeEventListener('loadedmetadata', onMeta);
      window.removeEventListener('touchstart', unlockVideo);
    };
  }, [videoSrc]);

  return (
    <section id="hero" ref={sectionRef}>
      <div className="hero-bg" />
      {hasVideo ? (
        <video
          ref={videoRef}
          className="hero-video"
          src={videoSrc}
          poster={poster}
          muted
          playsInline
          autoPlay
          preload="auto"
          aria-label="Yuma Bay Eco Lodge intro"
        />
      ) : (
        <img className="hero-img" src={poster} alt="Yuma Bay Eco Lodge" />
      )}
      <div className="hero-overlay" />
      <div className="hero-logo-center" ref={logoRef}>
        <h1 className="hero-title grad-text">
          <EditMark path={['hero.title', 'hero.titleEm']} label="Hero title">{h.title} {h.titleEm}</EditMark>
        </h1>
        <p className="hero-tagline">
          <EditMark path="hero.tagline" label="Hero tagline">{h.tagline}</EditMark>
        </p>
      </div>
    </section>
  );
}
