import { useRef } from 'react';
import { useInView } from 'motion/react';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import assetsUrls from '../../assetsUrls.json';
import TiltedCard from '../ui/TiltedCard.jsx';
import CountUp from '../ui/CountUp.jsx';
import SplitText from '../ui/SplitText.jsx';

const palmsUrl = assetsUrls['palms-about.png'];

const DEFAULTS = {
  main:   'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  accent: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
};

export default function About() {
  const { t }      = useLang();
  const a          = t.about;
  const { assets } = useAssets();

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });

  const mainImg   = assets?.about?.main   || DEFAULTS.main;
  const accentImg = assets?.about?.accent || DEFAULTS.accent;

  // Figma sets the heading as one flowing line over the image card.
  const title = `${a.title.replace(/\n/g, ' ')} ${a.titleEm}`;

  const stats = [
    { num: a.stat1Num, lbl: a.stat1Lbl },
    { num: a.stat2Num, lbl: a.stat2Lbl },
    { num: a.stat3Num, lbl: a.stat3Lbl },
  ];

  return (
    <section id="about">
      <img className="about-palms" src={palmsUrl} alt="" aria-hidden loading="lazy" />

      <div className="about-inner">
        <div className="about-head">
          <p className="section-label reveal">{a.label}</p>
          <SplitText
            text={title}
            className="section-title"
            delay={10}
            duration={0.25}
            ease="power3.out"
            splitType="chars"
            tag="h2"
            textAlign="left"
          />
        </div>

        {/* Figma stacks the base render under the coastline aerial */}
        <div className="about-card reveal rd1" style={{ overflow: 'visible', background: 'none' }}>
          <TiltedCard
            imageSrc={mainImg}
            altText="Yuma Bay aerial view"
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="100%"
            imageWidth="100%"
            scaleOnHover={1.05}
            rotateAmplitude={10}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={true}
            overlayContent={
              <>
                <img
                  src={accentImg}
                  alt="Boca de Yuma coastline"
                  className="tilted-card-img-accent"
                  loading="lazy"
                />
                <div className="tilted-card-gradient-overlay" />
              </>
            }
          />
        </div>

        <div className="about-side">
          <p className="section-body reveal rd2">{a.body}</p>
        </div>
      </div>

      <div className="about-stats reveal" ref={statsRef}>
        {stats.map((s, i) => {
          const numMatch = s.num.match(/[\d.]+/);
          const val = numMatch ? parseFloat(numMatch[0]) : 0;
          const suffix = numMatch ? s.num.replace(numMatch[0], '') : s.num;
          return (
            <div className="stat" key={i}>
              <div className="stat-num">
                <CountUp
                  from={0}
                  to={val}
                  duration={2}
                  separator=","
                  startWhen={statsInView}
                />
                {suffix}
              </div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
