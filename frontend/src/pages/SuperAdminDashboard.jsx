import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '../services/api.js';

export default function SuperAdminDashboard() {
  const [boutiques, setBoutiques] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('en_attente');
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) return navigate('/superadmin/login');
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

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: '#1a1a2e', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🛡️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 18 }}>Administration Chawat</h1>
            <span style={{ fontSize: 12, color: '#aaa' }}>Gestion des abonnements</span>
          </div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Déconnexion</button>
      </header>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard title="Total boutiques" value={stats.total || 0} icon="🏪" />
          <StatCard title="En attente" value={stats.en_attente || 0} icon="⏳" color="#ffc107" />
          <StatCard title="Actives" value={stats.actives || 0} icon="✅" color="#28a745" />
          <StatCard title="Revenu total" value={`${(stats.revenu_total || 0).toLocaleString()} MRU`} icon="💰" color="#17a2b8" />
        </div>

        {/* ONGLETS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'en_attente', label: `En attente (${enAttente.length})`, color: '#ffc107' },
            { id: 'actif', label: `Actives (${actives.length})`, color: '#28a745' },
            { id: 'all', label: `Toutes (${boutiques.length})`, color: '#6c757d' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', background: tab === t.id ? t.color : 'white', color: tab === t.id ? 'white' : '#333', fontWeight: tab === t.id ? 'bold' : 'normal', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* LISTE BOUTIQUES */}
        {filtered.map(b => (
          <div key={b.id} style={{ ...cardStyle, borderLeft: `4px solid ${{ en_attente: '#ffc107', actif: '#28a745', rejete: '#dc3545', suspendu: '#6c757d' }[b.statut] || '#6c757d'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 18 }}>{b.nom}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
                  📍 {b.adresse || '-'} | 📞 {b.telephone || '-'} | ✉️ {b.email}
                </p>
                <p style={{ margin: 0, color: '#999', fontSize: 12, marginTop: 4 }}>
                  Inscrit le {new Date(b.date_creation).toLocaleDateString('fr-FR')} | Slug: {b.slug}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ ...badgeStyle, background: { en_attente: '#ffc107', actif: '#28a745', rejete: '#dc3545', suspendu: '#6c757d' }[b.statut] || '#6c757d' }}>
                  {b.statut}
                </span>
                {b.statut === 'actif' && b.abonnement_fin && (
                  <p style={{ margin: 0, fontSize: 12, color: '#666', marginTop: 4 }}>
                    Fin: {new Date(b.abonnement_fin).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: '#666' }}>
              <span>📦 {b.total_orders} commandes</span>
              <span>💰 {b.total_revenue} MRU</span>
            </div>

            {b.statut === 'en_attente' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <button onClick={() => setModal(b)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                  ✅ Valider l'abonnement
                </button>
                <button onClick={async () => { if (confirm('Rejeter cette boutique ?')) { await superAdminApi.rejeter(b.id); loadData(); } }}
                  style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>
                  ❌ Rejeter
                </button>
                <a href={`https://wa.me/${b.telephone?.replace(/\s/g, '').replace('+', '')}?text=${encodeURIComponent(`Bonjour ${b.nom} ! Votre demande de compte boutique est en cours de traitement.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: '#25d366', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  📱 WhatsApp
                </a>
              </div>
            )}

            {b.statut === 'actif' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <button onClick={async () => { if (confirm('Suspendre cette boutique ?')) { await superAdminApi.suspendre(b.id); loadData(); } }}
                  style={{ background: '#ffc107', color: '#333', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>
                  ⏸ Suspendre
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL VALIDATION */}
      {modal && <ValidationModal boutique={modal} setModal={setModal} loadData={loadData} />}
    </div>
  );
}

function ValidationModal({ boutique, setModal, loadData }) {
  const [duree, setDuree] = useState(1);
  const [loading, setLoading] = useState(false);
  const prix = duree * 5000;

  async function handleValider() {
    setLoading(true);
    try {
      await superAdminApi.valider(boutique.id, duree);
      loadData();
      setModal(null);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={() => setModal(null)}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, width: 480 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px 0' }}>Valider l'abonnement</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>Boutique: <strong>{boutique.nom}</strong></p>

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Durée de l'abonnement</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[1, 3, 6, 12].map(m => (
            <button key={m} onClick={() => setDuree(m)}
              style={{ flex: 1, padding: 12, border: duree === m ? '2px solid #1a1a2e' : '1px solid #ddd', borderRadius: 8, background: duree === m ? '#e8f5e9' : 'white', cursor: 'pointer', fontWeight: duree === m ? 'bold' : 'normal' }}>
              {m} mois
            </button>
          ))}
        </div>

        <div style={{ background: '#f0f7ff', padding: 16, borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Montant à payer</p>
          <p style={{ margin: '4px 0', fontSize: 32, fontWeight: 'bold', color: '#1a5632' }}>{prix.toLocaleString()} MRU</p>
          <p style={{ margin: 0, color: '#999', fontSize: 13 }}>{duree} mois × 5 000 MRU/mois</p>
        </div>

        <p style={{ background: '#fff3cd', color: '#856404', padding: 12, borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
          ⚠️ Confirmez avoir reçu le paiement de <strong>{prix} MRU</strong> avant de valider.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleValider} disabled={loading}
            style={{ flex: 1, padding: 12, background: '#28a745', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Validation...' : 'Confirmer la validation'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = '#333' }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: 24, color }}>{value}</h3>
      <p style={{ margin: 0, color: '#666', fontSize: 13, marginTop: 4 }}>{title}</p>
    </div>
  );
}

const cardStyle = { background: 'white', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const badgeStyle = { padding: '4px 12px', borderRadius: 12, fontSize: 12, color: 'white', display: 'inline-block', textTransform: 'uppercase', fontWeight: 'bold' };
