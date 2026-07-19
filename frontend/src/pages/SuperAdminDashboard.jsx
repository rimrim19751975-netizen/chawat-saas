import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '../services/api.js';
import { useLang } from '../services/LanguageContext.jsx';
import LangSwitch from '../components/LangSwitch.jsx';

export default function SuperAdminDashboard() {
  const { t, lang } = useLang();
  const [boutiques, setBoutiques] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('en_attente');
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!localStorage.getItem('superadmin_token')) return navigate('/superadmin/login');
    loadData();
  }, []);

  function loadData() {
    superAdminApi.getBoutiques().then(setBoutiques).catch(() => navigate('/superadmin/login'));
    superAdminApi.getStats().then(setStats).catch(() => {});
  }

  const logout = () => { localStorage.removeItem('superadmin_token'); navigate('/superadmin/login'); };
  const enAttente = boutiques.filter(b => b.statut === 'en_attente');
  const actives = boutiques.filter(b => b.statut === 'actif');
  const filtered = tab === 'en_attente' ? enAttente : tab === 'actif' ? actives : boutiques;

  const statutColors = { en_attente: '#ffc107', actif: '#28a745', rejete: '#dc3545', suspendu: '#6c757d' };
  function statutLabel(s) { return { en_attente: t('statutEnAttente'), actif: t('statutActif'), rejete: t('statutRejete'), suspendu: t('statutSuspendu') }[s] || s; }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5', direction: dir }}>
      <header style={{ background: '#1a1a2e', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 24 }}>🛡️</span><div><h1 style={{ margin: 0, fontSize: 18 }}>{t('superAdminTitle')}</h1><span style={{ fontSize: 12, color: '#aaa' }}>{t('superAdminDesc')}</span></div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><LangSwitch /><button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>{t('logout')}</button></div>
      </header>
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard title={t('totalBoutiques')} value={stats.total || 0} icon="🏪" />
          <StatCard title={t('pending')} value={stats.en_attente || 0} icon="⏳" color="#ffc107" />
          <StatCard title={t('activeShops')} value={stats.actives || 0} icon="✅" color="#28a745" />
          <StatCard title={t('revenueTotal')} value={`${(stats.revenu_total || 0).toLocaleString()} MRU`} icon="💰" color="#17a2b8" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ id: 'en_attente', label: `${t('pending')} (${enAttente.length})`, color: '#ffc107' }, { id: 'actif', label: `${t('activeShops')} (${actives.length})`, color: '#28a745' }, { id: 'all', label: `${t('allBoutiques')} (${boutiques.length})`, color: '#6c757d' }].map(t2 => (
            <button key={t2.id} onClick={() => setTab(t2.id)} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', background: tab === t2.id ? t2.color : 'white', color: tab === t2.id ? 'white' : '#333', fontWeight: tab === t2.id ? 'bold' : 'normal', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>{t2.label}</button>
          ))}
        </div>
        {filtered.map(b => (
          <div key={b.id} style={{ ...cardStyle, borderLeft: dir === 'rtl' ? 'none' : `4px solid ${statutColors[b.statut]}`, borderRight: dir === 'rtl' ? `4px solid ${statutColors[b.statut]}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 18 }}>{b.nom}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 13 }}>📍 {b.adresse || '-'} | 📞 {b.telephone || '-'} | ✉️ {b.email}</p>
                <p style={{ margin: 0, color: '#999', fontSize: 12, marginTop: 4 }}>{t('registeredOn')} {new Date(b.date_creation).toLocaleDateString('fr-FR')} | {b.slug}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ ...badgeStyle, background: statutColors[b.statut] }}>{statutLabel(b.statut)}</span>
                {b.statut === 'actif' && b.abonnement_fin && <p style={{ margin: 0, fontSize: 12, color: '#666', marginTop: 4 }}>Fin: {new Date(b.abonnement_fin).toLocaleDateString('fr-FR')}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: '#666' }}><span>📦 {b.total_orders} {t('ordersCount')}</span><span>💰 {b.total_revenue} MRU</span></div>
            {b.statut === 'en_attente' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <button onClick={() => setModal(b)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>✅ {t('validateSub')}</button>
                <button onClick={async () => { if (confirm(t('confirm'))) { await superAdminApi.rejeter(b.id); loadData(); } }} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>❌ {t('reject')}</button>
                <a href={`https://wa.me/${b.telephone?.replace(/\s/g, '').replace('+', '')}`} target="_blank" rel="noopener noreferrer" style={{ background: '#25d366', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>📱 WhatsApp</a>
              </div>
            )}
            {b.statut === 'actif' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <button onClick={async () => { if (confirm(t('confirm'))) { await superAdminApi.suspendre(b.id); loadData(); } }} style={{ background: '#ffc107', color: '#333', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>⏸ {t('suspend')}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {modal && <ValidationModal boutique={modal} setModal={setModal} loadData={loadData} t={t} dir={dir} />}
    </div>
  );
}

function ValidationModal({ boutique, setModal, loadData, t, dir }) {
  const [duree, setDuree] = useState(1);
  const [loading, setLoading] = useState(false);
  const prix = duree * 5000;

  async function handleValider() {
    setLoading(true);
    try { await superAdminApi.valider(boutique.id, duree); loadData(); setModal(null); }
    catch (err) { alert(err.message); }
    setLoading(false);
  }

  return (
    <div style={overlayStyle} onClick={() => setModal(null)}>
      <div style={{ ...modalStyle, direction: dir }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px 0' }}>{t('validateSub')}</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>{boutique.nom}</p>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>{t('duration')}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[1, 3, 6, 12].map(m => (
            <button key={m} onClick={() => setDuree(m)} style={{ flex: 1, padding: 12, border: duree === m ? '2px solid #1a1a2e' : '1px solid #ddd', borderRadius: 8, background: duree === m ? '#e8f5e9' : 'white', cursor: 'pointer', fontWeight: duree === m ? 'bold' : 'normal' }}>{m} {t('months')}</button>
          ))}
        </div>
        <div style={{ background: '#f0f7ff', padding: 16, borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{t('amountToPay')}</p>
          <p style={{ margin: '4px 0', fontSize: 32, fontWeight: 'bold', color: '#1a5632' }}>{prix.toLocaleString()} MRU</p>
          <p style={{ margin: 0, color: '#999', fontSize: 13 }}>{duree} {t('months')} × 5 000 MRU</p>
        </div>
        <p style={{ background: '#fff3cd', color: '#856404', padding: 12, borderRadius: 6, fontSize: 13, marginBottom: 16 }}>⚠️ {t('confirmPayment')}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{t('cancel')}</button>
          <button onClick={handleValider} disabled={loading} style={{ flex: 1, padding: 12, background: '#28a745', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}>{loading ? t('loading') : t('confirmValidation')}</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = '#333' }) { return (<div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}><div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div><h3 style={{ margin: 0, fontSize: 24, color }}>{value}</h3><p style={{ margin: 0, color: '#666', fontSize: 13, marginTop: 4 }}>{title}</p></div>); }

const cardStyle = { background: 'white', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const badgeStyle = { padding: '4px 12px', borderRadius: 12, fontSize: 12, color: 'white', display: 'inline-block', textTransform: 'uppercase', fontWeight: 'bold' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', borderRadius: 12, padding: 32, width: 480, maxHeight: '90vh', overflow: 'auto' };
