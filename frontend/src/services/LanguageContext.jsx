import React, { createContext, useContext, useState } from 'react';
import translations from './translations.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr');

  const toggle = () => {
    setLang(prev => {
      const next = prev === 'fr' ? 'ar' : 'fr';
      localStorage.setItem('lang', next);
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = next;
      return next;
    });
  };

  const setLanguage = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  };

  const t = (key) => {
    const val = translations[lang]?.[key];
    if (Array.isArray(val)) return val;
    return val || translations.fr[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggle, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
