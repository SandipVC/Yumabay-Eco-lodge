import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';

export default function CTASection() {
  const { t } = useLang();
  const c = t.cta;
  const navigate = useNavigate();

  return (
    <section id="cta">
      <div className="cta-content">
        <p className="cta-eyebrow reveal">{c.eyebrow}</p>
        <h2 className="cta-title reveal rd1">
          {c.title.split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
          <em>{c.titleEm}</em>
        </h2>
        <div className="cta-actions reveal rd2">
          <button className="btn-white" onClick={() => navigate('/contact')}>
            {c.brochureBtn}
          </button>
          <button className="btn-outline" onClick={() => navigate('/contact')}>
            {c.visitBtn}
          </button>
        </div>
      </div>
    </section>
  );
}
