import { useLang } from '../../context/LanguageContext.jsx';

export default function GoldStrip() {
  const { t } = useLang();
  return (
    <div className="gold-strip">
      {t.strip.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span className="strip-item">{item}</span>
          {i < t.strip.length - 1 && <span className="strip-div" />}
        </span>
      ))}
    </div>
  );
}
