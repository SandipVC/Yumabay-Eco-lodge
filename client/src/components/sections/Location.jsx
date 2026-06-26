import { useLang } from '../../context/LanguageContext.jsx';

const MAPS_LINK = 'https://www.google.com/maps/search/?api=1&query=18.3745744%2C-68.6097549';

export default function Location() {
  const { t } = useLang();
  const l = t.location;

  return (
    <section id="location">
      <div className="location-watermark" aria-hidden>
        <div className="marquee-track">
          <span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span>
          <span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span>
        </div>
        <div className="marquee-track">
          <span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span>
          <span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span><span>YUMA BAY</span>
        </div>
      </div>

      <div className="location-card reveal">
        <iframe
          title="Yuma Bay Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3764.6!2d-68.6097549!3d18.3745744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8ea8a10049d356b9%3A0xad15c82f628818b4!2sYuma+Bay+Club+Lounge!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
