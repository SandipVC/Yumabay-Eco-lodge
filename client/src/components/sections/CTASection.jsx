import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';
import assetsUrls from '../../assetsUrls.json';

const patternUrl = assetsUrls['palm-band-cta.png'];
const circleUrl = assetsUrls['circle-logo.png'];

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
          <h2 className="cta-title reveal rd1">{title}</h2>
        </div>
        <button
          className="cta-circle reveal rd2"
          onClick={() => navigate('/contact')}
          aria-label={c.visitBtn}
        >
          <img src={circleUrl} alt="" />
        </button>
      </div>
      <div className="cta-divider" />
    </section>
  );
}
