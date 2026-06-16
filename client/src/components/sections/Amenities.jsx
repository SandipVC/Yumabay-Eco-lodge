import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import SplitText from '../ui/SplitText.jsx';
import assetsUrls from '../../assetsUrls.json';

const badgeUrl = assetsUrls['badge-shape.svg'];

// Figma icon per amenity, ordered to match the translation items
// (pools, gym, beach club, market, kids, security, parking, green).
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
