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

  useEffect(() => {
    // Check session storage first
    if (sessionStorage.getItem('yb_preloader_shown')) {
      setIsDestroyed(true);
      return;
    }

    if (loading || !assets) return;

    // Identify critical images to preload
    const criticalImages = [];
    if (assets.hero?.poster) criticalImages.push(assets.hero.poster);
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
  }, [assets, loading]);

  if (isDestroyed) return null;

  return (
    <div className={`preloader-overlay${isFading ? ' fade-out' : ''}`}>
      <div className="preloader-content">
        <div className="preloader-logo-wrap">
          {logoUrl && <img src={logoUrl} alt="Yuma Bay" className="preloader-logo" />}
        </div>
        <h2 className="preloader-title">YUMA BAY</h2>
        <p className="preloader-subtitle">Eco Lodge & Residences</p>
        
        <div className="preloader-progress-container">
          <div className="preloader-progress-bar" style={{ width: `${percent}%` }} />
        </div>
        <div className="preloader-percentage">{percent}%</div>
      </div>
    </div>
  );
}
