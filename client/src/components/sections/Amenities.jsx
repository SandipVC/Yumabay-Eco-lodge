import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import SplitText from '../ui/SplitText.jsx';
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

const BG_DEFAULT = '/images/YUMA BAY CLUB LOUNGE  (8).jpg';

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
        <div className="amenities-header">
          <div className="amenities-header-left">
            <p className="section-label reveal">{a.label}</p>
            <SplitText
              text={a.title.replace(/\n/g, ' ')}
              className="section-title"
              delay={10}
              duration={0.25}
              ease="power3.out"
              splitType="chars"
              tag="h2"
              textAlign="left"
            />
          </div>
          <div className="amenities-header-right reveal rd2">
            <p className="section-body">{a.body}</p>
          </div>
        </div>
      </div>
      <div className="amenities-list reveal">
        {a.items.map((item, i) => (
          <div className="amenity-row" key={i}>
            <div className="wrap amenity-row-inner">
              <div className="amenity-left">
                <span className={`amenity-icon${(i >= 1 && i <= 4) ? ' icon-sm' : ''}`}>
                  <img src={ICONS[i] || ICONS[0]} alt="" loading="lazy" />
                </span>
                <h3 className="amenity-name">{item.name}</h3>
              </div>
              <div className="amenity-right">
                <p className="amenity-desc">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
