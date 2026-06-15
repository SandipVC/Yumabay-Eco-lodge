import { useLang } from '../../context/LanguageContext.jsx';

const MAPS_LINK = 'https://www.google.com/maps/search/?api=1&query=Boca+de+Yuma%2C+Dominican+Republic';

export default function Location() {
  const { t } = useLang();
  const l = t.location;

  return (
    <section id="location">
      <p className="location-watermark" aria-hidden>
        <span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span>
      </p>

      <div className="location-card reveal">
        <iframe
          title="Yuma Bay Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3764.6!2d-68.6167!3d18.2833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8ea14f0000000001%3A0x0!2sBoca+de+Yuma%2C+Dominican+Republic!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          className="location-chip"
          href={MAPS_LINK}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in Google Maps"
        >
          <div className="location-chip-title">{l.titleEm}</div>
          <div className="location-chip-sub">{l.title.replace(/,\s*$/, '')} · Dominican Republic</div>
        </a>
      </div>
    </section>
  );
}
