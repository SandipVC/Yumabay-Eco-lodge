import { useEffect, useState } from 'react';
import { useAssets } from '../../hooks/useAssets.js';
import './Preloader.css';

// Local bundled logo — CMS can override via assets.branding.logo
const DEFAULT_LOGO = 'https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/assets%2Fbrand%2Flogo-yb.svg?alt=media';

export default function Preloader() {
  const { assets, loading } = useAssets();
  const logoUrl = assets?.branding?.logo || DEFAULT_LOGO;
  const [percent, setPercent] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [fontReady, setFontReady] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const isDebug = params.has('debug-preloader') || window.location.hash === '#debug-preloader';
  const isSecondLoad = sessionStorage.getItem('yb_preloader_shown') && !isDebug;

  useEffect(() => {
    if (loading) return;

    // Check session storage first
    if (isSecondLoad) {
      setFontReady(true);
      setIsFading(true);
      const timer = setTimeout(() => {
        setIsDestroyed(true);
      }, 800); // match CSS transition duration
      return () => clearTimeout(timer);
    }

    if (!assets) {
      // If assets failed to load, fade out immediately to avoid getting stuck
      setFontReady(true);
      setPercent(100);
      triggerFadeOut();
      return;
    }

    // --- Load custom CMS fonts FIRST, keeping text hidden until ready ---
    // Uses the browser's FontFace API to download the font file and register
    // it before making the text visible. This prevents ALL font-swap flicker.
    (async () => {
      try {
        const headingFile = assets.fonts?.headingFontFile;
        const bodyFile    = assets.fonts?.bodyFontFile;
        const fontPromises = [];

        if (headingFile) {
          const face = new FontFace('CMSHeadingFont', `url('${headingFile}')`, { display: 'swap' });
          document.fonts.add(face);
          fontPromises.push(face.load());
        }
        if (bodyFile) {
          const face = new FontFace('CMSBodyFont', `url('${bodyFile}')`, { display: 'swap' });
          document.fonts.add(face);
          fontPromises.push(face.load());
        }

        // Apply the CSS variables so elements reference the right font-family
        if (assets.fonts?.headingFont) {
          document.documentElement.style.setProperty('--font-heading', assets.fonts.headingFont);
        }
        if (assets.fonts?.bodyFont) {
          document.documentElement.style.setProperty('--font-body', assets.fonts.bodyFont);
        }

        if (fontPromises.length > 0) {
          await Promise.all(fontPromises);
        }
      } catch (e) {
        // Font loading failed — proceed anyway so we don't get stuck
      }

      // Font is now fully loaded and CSS variables are set — safe to show text
      setFontReady(true);

      // --- Now preload critical images ---
      const criticalImages = [];
      if (assets.hero?.poster) criticalImages.push(assets.hero.poster);
      // First hero-slider slide is the initial background; next two are the
      // first visible cards.
      (assets.heroSlider || []).slice(0, 3).forEach(s => {
        if (s?.src) criticalImages.push(s.src);
      });
      if (assets.about?.main) criticalImages.push(assets.about.main);
      if (assets.about?.accent) criticalImages.push(assets.about.accent);
      if (assets.properties) {
        assets.properties.forEach(src => {
          if (src) criticalImages.push(src);
        });
      }
      // Static logo
      if (logoUrl) criticalImages.push(logoUrl);

      // Filter unique and non-data URLs
      const uniqueImages = [...new Set(criticalImages)].filter(
        src => src && !src.startsWith('data:')
      );

      if (uniqueImages.length === 0) {
        setPercent(100);
        triggerFadeOut();
        return;
      }

      let loadedCount = 0;
      const total = uniqueImages.length;

      const onImageLoaded = () => {
        loadedCount++;
        const currentPercent = Math.min(Math.round((loadedCount / total) * 100), 100);
        setPercent(currentPercent);

        if (loadedCount >= total) {
          triggerFadeOut();
        }
      };

      uniqueImages.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = onImageLoaded;
        img.onerror = onImageLoaded; // count errors too so we don't get stuck
      });
    })();

    function triggerFadeOut() {
      // Small delay for smooth visual transition at 100%
      setTimeout(() => {
        setIsFading(true);
        sessionStorage.setItem('yb_preloader_shown', 'true');
        setTimeout(() => {
          setIsDestroyed(true);
        }, 800); // match CSS transition duration
      }, 300);
    }
  }, [assets, loading, isSecondLoad, logoUrl]);

  if (isDestroyed) return null;

  return (
    <div className={`preloader-overlay${isFading ? ' fade-out' : ''}`}>
      <div className="preloader-content">
        <div className="preloader-logo-wrap">
          {logoUrl && <img src={logoUrl} alt="Yuma Bay" className="preloader-logo" />}
        </div>
        <h2 className={`preloader-title${fontReady ? ' font-ready' : ''}`}>YUMA BAY</h2>
        <p className={`preloader-subtitle${fontReady ? ' font-ready' : ''}`}>Eco Lodge &amp; Residences</p>
        
        {!isSecondLoad && (
          <div className="preloader-progress-container">
            <div className="preloader-progress-bar" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
