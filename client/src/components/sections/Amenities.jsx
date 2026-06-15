import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import assetsUrls from '../../assetsUrls.json';

const badgeUrl = assetsUrls['badge-shape.svg'];
const ICONS = [
  assetsUrls['icon-pools.png'],
  assetsUrls['icon-gym.png'],
  assetsUrls['icon-beach.png'],
  assetsUrls['icon-market.png'],
  assetsUrls['icon-kids.png'],
  assetsUrls['icon-security.png'],
  assetsUrls['icon-parking.png'],
  assetsUrls['icon-green.png'],
];

const BG_DEFAULT = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function Amenities() {
  const { t } = useLang();
  const a = t.amenities;
  const { assets } = useAssets();

  // Faint backdrop reuses the CMS lounge imagery (Figma uses the club render).
  const bgImg = assets?.lounge?.filter(Boolean)?.[1] || BG_DEFAULT;

  return (
    <section id="amenities">
      <div className="amenities-bg" style={{ backgroundImage: `url("${bgImg}")` }} />
      <div className="wrap">
        <div className="amenities-intro">
          <p className="section-label reveal">{a.label}</p>
          <h2 className="section-title reveal rd1">{a.title.replace(/\n/g, ' ')}</h2>
        </div>
        <div className="amenities-grid reveal">
          {a.items.map((item, i) => (
            <div className="amenity" key={i}>
              <img className="amenity-shape" src={badgeUrl} alt="" aria-hidden />
              <span className="amenity-icon">
                <img src={ICONS[i] || ICONS[0]} alt="" loading="lazy" />
              </span>
              <div className="amenity-body">
                <h3 className="amenity-name">{item.name}</h3>
                <p className="amenity-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
