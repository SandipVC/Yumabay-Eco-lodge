import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import badgeUrl from '../../assets/figma/badge-shape.svg';
import iconPools    from '../../assets/figma/icon-pools.png';
import iconGym      from '../../assets/figma/icon-gym.png';
import iconBeach    from '../../assets/figma/icon-beach.png';
import iconMarket   from '../../assets/figma/icon-market.png';
import iconKids     from '../../assets/figma/icon-kids.png';
import iconSecurity from '../../assets/figma/icon-security.png';
import iconParking  from '../../assets/figma/icon-parking.png';
import iconGreen    from '../../assets/figma/icon-green.png';

// Figma icon per amenity, ordered to match the translation items
// (pools, gym, beach club, market, kids, security, parking, green).
const ICONS = [iconPools, iconGym, iconBeach, iconMarket, iconKids, iconSecurity, iconParking, iconGreen];

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
