import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';
import assetsUrls from '../../assetsUrls.json';
import SplitText from '../ui/SplitText.jsx';

const patternUrl = assetsUrls['palm-band-cta.png'];
const arrowUrl   = assetsUrls['arrow.svg'];

export default function CTASection() {
  const { t } = useLang();
  const c = t.cta;
  const navigate = useNavigate();

  // Figma renders the heading as one flowing block.
  const title = `${c.title.replace(/\n/g, ' ')} ${c.titleEm}`;

  return (
    <section id="cta">
      <div className="cta-pattern" style={{ '--pattern': `url(${patternUrl})` }} />
      <div className="cta-inner wrap">
        <div>
          <p className="cta-eyebrow reveal">{c.eyebrow}</p>
          <SplitText
            text={title}
            className="cta-title"
            delay={10}
            duration={0.25}
            ease="power3.out"
            splitType="chars"
            tag="h2"
            textAlign="left"
          />
        </div>
        <button
          className="cta-circle reveal rd2"
          onClick={() => navigate('/contact')}
          aria-label={c.visitBtn}
        >
          <div className="cta-circle-canvas">
            <svg className="cta-svg" viewBox="0 0 200 200" width="100%" height="100%">
              {/* Background Shapes */}
              <circle cx="100" cy="100" r="100" fill="#000" className="cta-bg-circle" />
              
              {/* Spinning Text */}
              <path
                id="circlePath"
                d="M 100, 100 m -72, 0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0"
                fill="none"
              />
              <text fill="white" fontSize="11" fontFamily="'Aptos Narrow', 'Jost', sans-serif" className="cta-circle-text-svg">
                <textPath href="#circlePath" startOffset="0%" textLength="445.39" lengthAdjust="spacing">
                  {"GET IN TOUCH • GET IN TOUCH • GET IN TOUCH • GET IN TOUCH • "}
                </textPath>
              </text>
            </svg>
            <div className="cta-circle-arrow">
              <img src={arrowUrl} alt="Arrow" className="cta-arrow-icon" />
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
