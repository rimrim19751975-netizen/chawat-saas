import React, { useState } from 'react';
import { auth } from '../services/api.js';
import { useLang } from '../services/LanguageContext.jsx';
import LangSwitch from '../components/LangSwitch.jsx';

export default function BoutiqueRegister() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ nom: '', slug: '', email: '', telephone: '', adresse: '', password: '' });
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.nom || !form.slug || !form.email || !form.password) { setError(t('fillAllFields')); return; }
    try { await auth.boutiqueRegister(form); setStep('payment'); } catch (err) { setError(err.message); }
  };

  if (step === 'payment') {
    const features = t('planFeatures');
    const steps = t('paymentSteps');
    return (
      <div style={{ ...pageStyle, direction: dir }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <a href="/" style={{ color: '#1a5632', textDecoration: 'none', fontSize: 28, fontWeight: 'bold' }}>🛒 {t('appName')}</a>
            <div style={{ marginTop: 12 }}><LangSwitch style={{ background: '#1a5632' }} /></div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>💳</div>
              <h2 style={{ margin: '0 0 8px 0', color: '#1a5632' }}>{t('paymentTitle')}</h2>
              <p style={{ color: '#666' }}>{form.nom}</p>
            </div>
            <div style={{ background: '#f0f7ff', borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px 0', textAlign: 'center' }}>{t('monthlyPlan')}</h3>
              <div style={{ textAlign: 'center', fontSize: 36, fontWeight: 'bold', color: '#1a5632', marginBottom: 8 }}>5 000 MRU<span style={{ fontSize: 14, fontWeight: 'normal', color: '#666' }}>{t('perMonth')}</span></div>
              <ul style={{ color: '#555', fontSize: 14, paddingLeft: 20, margin: 0 }}>{features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
            <div style={{ background: '#fff3cd', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>📱 {t('howToPay')}</h4>
              <ol style={{ margin: 0, fontSize: 14, color: '#555', paddingLeft: 20 }}>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
            <div style={{ background: '#d4edda', borderRadius: 8, padding: 16, marginBottom: 20, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, color: '#155724' }}><strong>{t('afterPayment')}</strong> {t('afterPaymentMsg')} <strong>{form.email}</strong>.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={`https://wa.me/22222149282?text=${encodeURIComponent(t('sendProof'))}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', background: '#25d366', color: 'white', padding: 14, borderRadius: 8, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>📱 {t('sendProof')}</a>
              <a href="/admin/login" style={{ textAlign: 'center', color: '#1a5632', fontSize: 14, textDecoration: 'none' }}>{t('backToLogin')}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageStyle, direction: dir }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ color: '#1a5632', textDecoration: 'none', fontSize: 28, fontWeight: 'bold' }}>🛒 {t('appName')}</a>
          <div style={{ marginTop: 12 }}><LangSwitch style={{ background: '#1a5632' }} /></div>
          <h1 style={{ marginTop: 16, fontSize: 24, color: '#333' }}>{t('createBoutique')}</h1>
          <p style={{ color: '#666' }}>{t('createBoutiqueDesc2')}</p>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 6, marginBottom: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>{t('boutiqueName')} *</label>
            <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>{t('slug')} *</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} style={inputStyle} placeholder="chawat" />
            <label style={labelStyle}>{t('email')} *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>{t('phone')}</label>
            <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} placeholder="+222 XX XX XX XX" />
            <label style={labelStyle}>{t('address')}</label>
            <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>{t('password')} *</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} />
            <button type="submit" style={{ ...btnPrimary, width: '100%', marginTop: 8 }}>{t('createMyAccount')}</button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p><a href="/admin/login" style={{ color: '#1a5632' }}>{t('alreadyRegistered')}</a></p>
        </div>
      </div>
    </div>
  );
}

const pageStyle = { fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5', padding: '40px 16px' };
const inputStyle = { width: '100%', padding: 12, marginBottom: 16, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box', fontSize: 14 };
const labelStyle = { display: 'block', marginBottom: 4, fontSize: 13, color: '#555', fontWeight: 'bold' };
const btnPrimary = { padding: 14, background: '#1a5632', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' };
