import { createContext, useContext, useState } from 'react';
import { en } from '../translations/en.js';
import { es } from '../translations/es.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = lang === 'es' ? es : en;
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
