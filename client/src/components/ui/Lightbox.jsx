import { useEffect, useCallback } from 'react';

export default function Lightbox({ images, index, onClose, onPrev, onNext }) {
  const img = images[index];

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft')  onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>✕</button>
        <button className="lightbox-nav lightbox-prev" onClick={onPrev}>‹</button>
        <img src={img.src} alt={img.label} />
        <button className="lightbox-nav lightbox-next" onClick={onNext}>›</button>
        <p className="lightbox-caption">{img.label} · {index + 1} / {images.length}</p>
      </div>
    </div>
  );
}
