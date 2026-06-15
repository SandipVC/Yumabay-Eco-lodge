import { useState, useEffect } from 'react';
import { useLang } from '../../context/LanguageContext.jsx';

const safeLocalStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return this._data[key] || null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      this._data[key] = String(value);
    }
  },
  _data: {}
};

export default function CookieConsent() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const consent = safeLocalStorage.getItem('yb_cookie_consent');
    if (!consent) {
      setDismissed(false);
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAction = (accepted) => {
    safeLocalStorage.setItem('yb_cookie_consent', accepted ? 'accepted' : 'declined');
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
    }, 500); // Matches the CSS transform/opacity transition
  };

  if (dismissed) return null;

  const text = lang === 'es'
    ? 'Utilizamos cookies para personalizar el contenido y analizar el tráfico de forma anónima.'
    : 'We use cookies to personalize content and anonymously analyze our site traffic.';

  const acceptText = lang === 'es' ? 'Aceptar' : 'Accept';
  const declineText = lang === 'es' ? 'Rechazar' : 'Decline';
  const policyText = lang === 'es' ? 'Política de Cookies' : 'Cookie Policy';

  return (
    <div className={`cookie-consent-banner ${visible ? 'visible' : ''}`}>
      <div className="cookie-consent-content">
        <p className="cookie-consent-text">
          {text}{' '}
          <a href="#privacy" className="cookie-policy-link">
            {policyText}
          </a>
        </p>
        <div className="cookie-consent-actions">
          <button className="btn-cookie-decline" onClick={() => handleAction(false)}>
            {declineText}
          </button>
          <button className="btn-cookie-accept" onClick={() => handleAction(true)}>
            {acceptText}
          </button>
        </div>
      </div>
    </div>
  );
}
