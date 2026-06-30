import { motion }    from 'motion/react';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import SplitText from '../ui/SplitText.jsx';
import EditMark from '../cms/EditMark.jsx';
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
            <p className="section-label reveal">
              <EditMark path="amenities.label" label="Amenities label">{a.label}</EditMark>
            </p>
            <EditMark as="div" path="amenities.title" label="Amenities heading">
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
            </EditMark>
          </div>
          <div className="amenities-header-right reveal rd2">
            <p className="section-body">
              <EditMark path="amenities.body" label="Amenities body">{a.body}</EditMark>
            </p>
          </div>
        </div>
      </div>
      <motion.div
        className="amenities-list"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {a.items.map((item, i) => (
          <motion.div
            className="amenity-row"
            key={i}
            variants={{
              hidden:  { opacity: 0, y: 28 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
            }}
          >
            <div className="wrap amenity-row-inner">
              <div className="amenity-left">
                <span className={`amenity-icon${(i >= 1 && i <= 4) ? ' icon-sm' : ''}`}>
                  <img src={ICONS[i] || ICONS[0]} alt="" loading="lazy" />
                </span>
              </div>
              <div className="amenity-right">
                <h3 className="amenity-name">
                  <EditMark path={`amenities.items.${i}.name`} label={`Amenity ${i + 1} · name`}>{item.name}</EditMark>
                </h3>
                <p className="amenity-desc">
                  <EditMark path={`amenities.items.${i}.desc`} label={`Amenity ${i + 1} · description`}>{item.desc}</EditMark>
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
