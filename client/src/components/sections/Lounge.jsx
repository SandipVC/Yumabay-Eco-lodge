import { useLang } from '../../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useAssets } from '../../hooks/useAssets.js';
import assetsUrls from '../../assetsUrls.json';
import SplitText from '../ui/SplitText.jsx';
import EditMark from '../cms/EditMark.jsx';

export default function Lounge() {
  const { t }      = useLang();
  const l          = t.lounge;
  const navigate   = useNavigate();
  const { assets } = useAssets();

  const patternUrl = assets?.decor?.loungePattern || assetsUrls['palm-band-cta.png'];

  // Figma renders the heading as one flowing block (wraps naturally).
  const title = `${l.title.replace(/\n/g, ' ')} ${l.titleEm}`;

  return (
    <section id="lounge">
      <div className="lounge-pattern" style={{ '--pattern': `url(${patternUrl})` }} />
      <div className="lounge-inner wrap">
        <div className="lounge-head reveal">
          <EditMark as="div" path={['lounge.title', 'lounge.titleEm']} label="Lounge heading">
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
          </EditMark>
        </div>
        <div className="lounge-side reveal rd1">
          <p className="section-body">
            <EditMark path="lounge.body" label="Lounge body">{l.body}</EditMark>
          </p>
          <button className="btn-dark" onClick={() => navigate('/sitemap')}>
            <EditMark path="lounge.bookBtn" label="Book a Visit button">{l.bookBtn}</EditMark>
          </button>
        </div>
      </div>
    </section>
  );
}
