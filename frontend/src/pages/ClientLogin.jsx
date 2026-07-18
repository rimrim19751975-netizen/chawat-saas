import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api.js';
import { useLang } from '../services/LanguageContext.jsx';
import LangSwitch from '../components/LangSwitch.jsx';

export default function ClientLogin() {
  const { t, lang } = useLang();
  const [telephone, setTelephone] = useState('');
  const [nom, setNom] = useState('');
  const [quartier, setQuartier] = useState('');
  const [isNew, setIsNew] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (isNew) await auth.clientRegister({ boutique_slug: 'chawat', nom, telephone, quartier });
      const data = await auth.clientLogin(telephone, '', 'chawat');
      localStorage.setItem('token', data.token); localStorage.setItem('role', 'client'); localStorage.setItem('client', JSON.stringify(data.client));
      navigate('/client/orders');
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 400, margin: '80px auto', padding: 16, direction: dir }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#1a5632' }}>{t('clientLogin')}</h1>
        <p style={{ color: '#666' }}>{t('clientLoginDesc')}</p>
        <div style={{ marginTop: 12 }}><LangSwitch style={{ background: '#1a5632' }} /></div>
      </div>
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 4, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input placeholder={t('whatsappNumber')} value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} required />
        {isNew && (<>
          <input placeholder={t('name')} value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} required />
          <select value={quartier} onChange={e => setQuartier(e.target.value)} style={inputStyle} required>
            <option value="">{t('deliveryQuarter')}</option>
            <option>{t('qTevraghZeina')}</option><option>{t('qKsar')}</option><option>{t('qArafat')}</option>
            <option>{t('qSoukouk')}</option><option>{t('qDarNaim')}</option><option>{t('qToujounine')}</option>
            <option>{t('qRiyad')}</option><option>{t('qSebkha')}</option><option>{t('qElMina')}</option>
          </select>
        </>)}
        <button type="submit" style={btnStyle}>{isNew ? t('createAndView') : t('viewMyOrders')}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 12 }}>
        <button onClick={() => setIsNew(!isNew)} style={{ background: 'none', border: 'none', color: '#1a5632', cursor: 'pointer', textDecoration: 'underline' }}>{isNew ? t('existingClient') : t('newClient')}</button>
      </p>
      <p style={{ textAlign: 'center' }}><a href="/" style={{ color: '#999', fontSize: 14 }}>{t('returnHome')}</a></p>
    </div>
  );
}

const inputStyle = { width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: 12, background: '#1a5632', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 };
