import { useState, useEffect } from 'react';
import { useLang } from '../../context/LanguageContext.jsx';

export default function MediaLibraryPicker({ token, onPick, onCancel }) {
  const { t } = useLang();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cms/media-library', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load media library');
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const filtered = images.filter(img => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return (img.label && img.label.toLowerCase().includes(term)) || 
           (img.section && img.section.toLowerCase().includes(term));
  });

  return (
    <div className="cms-modal-backdrop" onClick={onCancel}>
      <div className="cms-modal cms-media-picker" onClick={e => e.stopPropagation()}>
        <div className="cms-modal-header">
          <h3>Choose from Library</h3>
          <button className="cms-modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="cms-media-picker-tools">
          <input 
            type="text" 
            placeholder="Search by label or section..." 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="cms-input"
          />
        </div>

        <div className="cms-media-picker-body">
          {loading && <div className="cms-loading-spinner" />}
          {error && <div className="cms-error">{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className="cms-empty-state">No images found.</div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="cms-media-grid">
              {filtered.map(img => {
                const isVideo = img.url && /\.(mp4|webm|mov)$/i.test(img.url);
                return (
                  <div 
                    key={img.url} 
                    className="cms-media-item"
                    onClick={() => onPick(img.url)}
                    title={img.label}
                  >
                    {isVideo ? (
                      <video src={img.url} className="cms-media-thumb" muted playsInline />
                    ) : (
                      <img src={img.url} alt={img.label} className="cms-media-thumb" loading="lazy" />
                    )}
                    <div className="cms-media-label">
                      <strong>{img.section}</strong>
                      <span>{img.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
