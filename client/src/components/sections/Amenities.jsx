import { useLang } from '../../context/LanguageContext.jsx';

export default function Amenities() {
  const { t } = useLang();
  const a = t.amenities;

  return (
    <section id="amenities">
      <div className="amenities-intro">
        <p className="section-label reveal">{a.label}</p>
        <h2 className="section-title reveal rd1">{a.title}</h2>
      </div>
      <div className="amenities-grid reveal">
        {a.items.map((item, i) => (
          <div className="amenity" key={i}>
            <span className="amenity-icon">{item.icon}</span>
            <h3 className="amenity-name">{item.name}</h3>
            <p className="amenity-desc">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
