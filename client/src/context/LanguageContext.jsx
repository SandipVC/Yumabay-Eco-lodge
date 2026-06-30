import { createContext, useContext, useMemo, useState } from 'react';
import { en } from '../translations/en.js';
import { es } from '../translations/es.js';
import { useAssets } from '../hooks/useAssets.js';
import { useEditMode } from './EditModeContext.jsx';
import { deepMerge } from '../utils/textMerge.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const { assets } = useAssets();
  // When in-context editing is on, preview the live draft (EditMode already
  // layers defaults ⊕ CMS overrides ⊕ draft into `effective`).
  const em = useEditMode();

  const t = useMemo(() => {
    if (em?.editing) return em.effective[lang];
    const base = lang === 'es' ? es : en;
    const override = assets?.translations?.[lang];
    return override ? deepMerge(base, override) : base;
  }, [lang, assets, em?.editing, em?.effective]);

  const toggle = () => setLang(l => l === 'en' ? 'es' : 'en');
  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
