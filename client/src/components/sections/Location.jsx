import { useLang } from '../../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Location() {
  const { t } = useLang();
  const l = t.location;
  const navigate = useNavigate();

  return (
    <section id="location">
      <div>
        <p className="section-label reveal">{l.label}</p>
        <h2 className="section-title reveal rd1">
          {l.title}<br /><em>{l.titleEm}</em>
        </h2>
        <p className="section-body reveal rd2">{l.body}</p>
        <div className="dist-grid reveal rd2">
          {l.distances.map((d, i) => (
            <div className="dist-cell" key={i}>
              <div className="dist-name">{d.name}</div>
              <div className="dist-val">
                {d.val}{d.unit && <span className="dist-unit"> {d.unit}</span>}
              </div>
            </div>
          ))}
        </div>
        <button className="btn-primary reveal rd3" onClick={() => navigate('/contact')}>
          {l.enquireBtn}
        </button>
      </div>

      <div className="location-map reveal rd1">
        <iframe
          title="Yuma Bay Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3764.6!2d-68.6167!3d18.2833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8ea14f0000000001%3A0x0!2sBoca+de+Yuma%2C+Dominican+Republic!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
