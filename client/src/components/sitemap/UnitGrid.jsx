import { useState } from 'react';
import { useLang } from '../../context/LanguageContext.jsx';

export default function UnitGrid({ building, onEnquire }) {
  const { t } = useLang();
  const [activeLevel, setActiveLevel] = useState(1);
  const [selectedUnitCode, setSelectedUnitCode] = useState(null);

  if (!building || !building.units) return null;

  const levels = Array.from({ length: building.levels || 4 }, (_, i) => i + 1);
  const currentUnits = building.units.filter((u) => u.level === activeLevel);

  const selectedUnit =
    building.units.find((u) => u.code === selectedUnitCode) ||
    currentUnits.find((u) => u.status === 'available') ||
    currentUnits[0];

  const getStatusClass = (status) => {
    if (status === 'available') return 'unit-cell--available';
    if (status === 'blocked') return 'unit-cell--blocked';
    return 'unit-cell--sold';
  };

  const getStatusLabel = (status) => {
    if (status === 'available') return t.sitemap?.available || 'Available';
    if (status === 'blocked') return 'Blocked';
    return t.sitemap?.soldOut || 'Sold';
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '—';
    return `$${price.toLocaleString()}`;
  };

  const formatUnitType = (type) => {
    if (type === 'suite') return 'Suite';
    if (type === '1br') return '1 BR';
    if (type === '2br') return '2 BR';
    return type;
  };

  return (
    <div className="building-unit-drilldown">
      {/* Level Selector Tabs */}
      {levels.length > 1 && (
        <div className="sitemap-level-tabs">
          {levels.map((lvl) => (
            <button
              key={lvl}
              className={`sitemap-level-tab${activeLevel === lvl ? ' active' : ''}`}
              onClick={() => {
                setActiveLevel(lvl);
                setSelectedUnitCode(null); // reset unit selection when level changes
              }}
            >
              {t.sitemap?.phase === 'Phase' ? `Level ${lvl}` : `Nivel ${lvl}`}
            </button>
          ))}
        </div>
      )}

      {/* Responsive Grid */}
      <div className="sitemap-unit-grid">
        {currentUnits.map((u) => {
          const isSelected = selectedUnit?.code === u.code;
          return (
            <button
              key={u.code}
              className={`unit-cell ${getStatusClass(u.status)}${isSelected ? ' selected' : ''}`}
              onClick={() => setSelectedUnitCode(u.code)}
            >
              <span className="unit-cell-code">{u.code}</span>
              <span className="unit-cell-type">{formatUnitType(u.type)}</span>
              <span className="unit-cell-price">
                {u.status !== 'available' ? getStatusLabel(u.status) : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Unit Details Card */}
      {selectedUnit && (
        <div className="selected-unit-card">
          <div className="selected-unit-header">
            <h4 className="selected-unit-title">
              {t.sitemap?.phase === 'Phase' ? 'Unit' : 'Unidad'} {selectedUnit.code}
            </h4>
            <span className={`status-badge ${getStatusClass(selectedUnit.status)}`}>
              {getStatusLabel(selectedUnit.status)}
            </span>
          </div>

          <div className="selected-unit-details">
            <div className="detail-row">
              <span className="detail-label">{t.sitemap?.phase === 'Phase' ? 'Type' : 'Tipo'}</span>
              <span className="detail-value">{formatUnitType(selectedUnit.type)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.sitemap?.phase === 'Phase' ? 'Level' : 'Nivel'}</span>
              <span className="detail-value">{selectedUnit.level}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.sitemap?.phase === 'Phase' ? 'Internal Area' : 'Área Interna'}</span>
              <span className="detail-value">{selectedUnit.areaInt} m²</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.sitemap?.phase === 'Phase' ? 'Balcony' : 'Balcón'}</span>
              <span className="detail-value">{selectedUnit.balcony} m²</span>
            </div>
            <div className="detail-row highlight">
              <span className="detail-label">{t.sitemap?.phase === 'Phase' ? 'Total Area' : 'Área Total'}</span>
              <span className="detail-value">{selectedUnit.total} m²</span>
            </div>
            {selectedUnit.note && (
              <p className="unit-note-text">*{selectedUnit.note}</p>
            )}
          </div>

          {selectedUnit.status === 'available' && (
            <button
              className="btn-primary enquire-unit-btn"
              onClick={() => onEnquire(selectedUnit.code, `${building.name} - ${selectedUnit.code}`)}
            >
              {t.properties?.enquire || 'Enquire Now'} {selectedUnit.code}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
