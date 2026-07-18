import React from 'react';
import { useLang } from '../services/LanguageContext.jsx';

export default function LangSwitch({ style = {} }) {
  const { lang, toggle } = useLang();

  return (
    <button
      onClick={toggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.1)',
        color: 'white',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 'bold',
        ...style
      }}
    >
      <span style={{ fontSize: 16 }}>{lang === 'fr' ? '🇲🇷' : '🇫🇷'}</span>
      {lang === 'fr' ? 'عربي' : 'FR'}
    </button>
  );
}
