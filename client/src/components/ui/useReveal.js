import { useEffect, useRef } from 'react';

export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const els = el.querySelectorAll ? [el, ...el.querySelectorAll('.reveal')] : [el];
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach(e => e.classList.contains('reveal') && observer.observe(e));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/**
 * Observes every `.reveal` element currently in the DOM and adds `.visible`
 * when it scrolls into view. Pass a deps array (e.g. [pathname]) so it
 * re-scans after client-side route changes mount new page content.
 * This is the single source of truth for scroll-reveal across all pages.
 */
export function useRevealAll(deps = []) {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
