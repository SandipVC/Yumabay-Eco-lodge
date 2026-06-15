import { createContext, useContext, useMemo, useState } from 'react';
import { en } from '../translations/en.js';
import { es } from '../translations/es.js';
import { useAssets } from '../hooks/useAssets.js';

const LanguageContext = createContext(null);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deep-merge `override` on top of `base`.
 * - Plain objects merge recursively.
 * - Arrays merge element-wise; missing elements fall back to base.
 * - Primitives: override wins if defined and not empty string.
 */
function deepMerge(base, override) {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) && Array.isArray(override)) {
    const out = [];
    const len = Math.max(base.length, override.length);
    for (let i = 0; i < len; i++) {
      out[i] = deepMerge(base[i], override[i]);
    }
    return out;
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const out = { ...base };
    for (const k of Object.keys(override)) {
      out[k] = deepMerge(base[k], override[k]);
    }
    return out;
  }
  // Primitive — keep base if override is empty string (treat blank as "use default")
  if (typeof override === 'string' && override === '' && typeof base === 'string' && base !== '') {
    return base;
  }
  return override;
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const { assets } = useAssets();

  const t = useMemo(() => {
    const base = lang === 'es' ? es : en;
    const override = assets?.translations?.[lang];
    return override ? deepMerge(base, override) : base;
  }, [lang, assets]);

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
