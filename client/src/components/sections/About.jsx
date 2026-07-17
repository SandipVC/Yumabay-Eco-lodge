import { useRef } from 'react';
import { useInView } from 'motion/react';
import { useLang }   from '../../context/LanguageContext.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import EditMark from '../cms/EditMark.jsx';
import CountUp from '../ui/CountUp.jsx';

const DEFAULTS = {
  main: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
};

export default function About() {
  const { t }      = useLang();
  const a          = t.about;
  const { assets } = useAssets();

  const mainImg  = assets?.about?.main || DEFAULTS.main;

  const title = `${a.title.replace(/\n/g, ' ')} ${a.titleEm}`;

  // Split body into paragraphs
  const paragraphs = a.body.split('\n\n').filter(Boolean);

  const statsRef   = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });

  const stats = [
    { num: a.stat1Num, lbl: a.stat1Lbl },
    { num: a.stat2Num, lbl: a.stat2Lbl },
    { num: a.stat3Num, lbl: a.stat3Lbl },
  ];

  return (
    <>
      <section id="about" style={{ backgroundImage: `url(${mainImg})` }}>
        
        <div className="about-centered-content wrap">
          <p className="about-label section-label reveal">
            <EditMark path="about.label" label="About label">{a.label}</EditMark>
          </p>

          <EditMark as="div" path={['about.title', 'about.titleEm']} label="About heading">
            <h2 className="about-heading section-title reveal" style={{ textAlign: 'center' }}>
              {title}
            </h2>
          </EditMark>

          <div className="about-body-wrap reveal">
            <EditMark as="div" path="about.body" label="About body">
              {paragraphs.map((para, i) => (
                <p key={i} className="about-body section-body">{para}</p>
              ))}
            </EditMark>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="about-stats-band reveal" ref={statsRef}>
        <div className="about-stats-inner wrap">
          {stats.map((s, i) => {
            const numMatch = s.num.match(/[\d.]+/);
            const val = numMatch ? parseFloat(numMatch[0]) : 0;
            const suffix = numMatch ? s.num.replace(numMatch[0], '') : s.num;
            return (
              <div className="stat-block" key={i}>
                <div className="stat-num">
                  <EditMark path={`about.stat${i + 1}Num`} label={`Stat ${i + 1} number`}>
                    <CountUp from={0} to={val} duration={2} separator="," startWhen={statsInView} />
                    {suffix}
                  </EditMark>
                </div>
                <div className="stat-lbl">
                  <EditMark path={`about.stat${i + 1}Lbl`} label={`Stat ${i + 1} label`}>{s.lbl}</EditMark>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
