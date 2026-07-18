import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boutiqueApi, productApi, orderApi } from '../services/api.js';

const API = '/api';

async function apiReq(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
}

export default function AdminDashboard() {
  const [boutique, setBoutique] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    boutiqueApi.getMe().then(b => setBoutique(b)).catch(() => navigate('/admin/login'));
    loadData();
  }, []);

  function loadData() {
    orderApi.listBoutique().then(setOrders).catch(() => {});
    apiReq('/products/my').then(setProducts).catch(() => {});
    apiReq('/products/categories/all').then(setCategories).catch(() => {});
  }

  const logout = () => { localStorage.clear(); navigate('/admin/login'); };

  const pending = orders.filter(o => o.statut === 'en_attente').length;
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* HEADER */}
      <header style={{ background: '#1a5632', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>{boutique?.nom || 'Chawat'}</h1>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Espace boutique</span>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Déconnexion</button>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* SIDEBAR */}
        <nav style={{ width: 220, background: 'white', borderRight: '1px solid #eee', padding: '16px 0' }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Tableau de bord' },
            { id: 'orders', icon: '📦', label: `Commandes${pending ? ` (${pending})` : ''}` },
            { id: 'products', icon: '🥩', label: 'Produits' },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 20px', border: 'none', background: tab === item.id ? '#e8f5e9' : 'transparent', color: tab === item.id ? '#1a5632' : '#333', cursor: 'pointer', fontSize: 14, fontWeight: tab === item.id ? 'bold' : 'normal' }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: 24 }}>

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div>
              <h2 style={{ marginBottom: 20 }}>Tableau de bord</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <StatCard title="Commandes en attente" value={pending} color="#ffc107" />
                <StatCard title="Revenu total" value={`${revenue.toLocaleString()} MRU`} color="#28a745" />
                <StatCard title="Produits" value={products.length} color="#17a2b8" />
              </div>
              <h3>Dernières commandes</h3>
              {orders.slice(0, 5).map(o => (
                <div key={o.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{o.client_nom}</strong> — {o.client_quartier}
                      <p style={{ margin: 0, fontSize: 13, color: '#666' }}>{o.client_telephone}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ ...badgeStyle, background: statutColor(o.statut) }}>{o.statut}</span>
                      <p style={{ fontWeight: 'bold', marginTop: 4 }}>{o.total} MRU</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ORDERS */}
          {tab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Commandes ({orders.length})</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['en_attente', 'en_cours', 'livre'].map(s => (
                    <span key={s} style={{ background: statutColor(s), color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>{s}: {orders.filter(o => o.statut === s).length}</span>
                  ))}
                </div>
              </div>

              {orders.map(order => (
                <div key={order.id} style={{ ...cardStyle, borderLeft: `4px solid ${statutColor(order.statut)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <strong>{order.client_nom}</strong>
                      <p style={{ margin: 0, fontSize: 13, color: '#666' }}>📞 {order.client_telephone} | 📍 {order.client_quartier}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#999' }}>{new Date(order.date_creation).toLocaleString('fr-FR')}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ ...badgeStyle, background: statutColor(order.statut) }}>{order.statut}</span>
                      <p style={{ fontWeight: 'bold', fontSize: 18, marginTop: 4 }}>{order.total} MRU</p>
                    </div>
                  </div>

                  {/* Items */}
                  {order.items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14, color: '#555', borderTop: '1px solid #f0f0f0' }}>
                      <span>{item.product_nom} × {item.quantite}</span>
                      <span>{item.prix_unitaire * item.quantite} MRU</span>
                    </div>
                  ))}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                    <a
                      href={`https://wa.me/${order.client_telephone.replace(/\s/g, '').replace('+', '')}?text=${encodeURIComponent(`Bonjour ${order.client_nom} ! Votre commande de ${order.total} MRU est ${order.statut === 'livre' ? 'livrée' : 'en cours de préparation'}. Merci pour votre confiance !`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: '#25d366', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >📱 WhatsApp</a>

                    {order.statut === 'en_attente' && (
                      <button onClick={() => updateOrder(order.id, 'en_cours')} style={{ ...actionBtn, background: '#17a2b8' }}>
                        Prendre en cours
                      </button>
                    )}
                    {order.statut === 'en_cours' && (
                      <button onClick={() => updateOrder(order.id, 'livre')} style={{ ...actionBtn, background: '#28a745' }}>
                        Marquer livré ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PRODUCTS */}
          {tab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Produits ({products.length})</h2>
                <button onClick={() => setModal({ type: 'product', data: null })} style={{ background: '#1a5632', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                  + Ajouter un produit
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {products.map(p => (
                  <div key={p.id} style={{ ...cardStyle, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{p.nom}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{p.categorie_nom || 'Sans catégorie'}</p>
                      </div>
                      <span style={{ background: p.actif ? '#d4edda' : '#f8d7da', color: p.actif ? '#155724' : '#721c24', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#1a5632', fontSize: 18 }}>{p.prix_min} MRU</strong>
                        {p.prix_max !== p.prix_min && <span style={{ color: '#999', fontSize: 13 }}> - {p.prix_max} MRU</span>}
                        <p style={{ margin: 0, fontSize: 12, color: '#999' }}>Stock: {p.stock} {p.unite}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModal({ type: 'product', data: p })} style={{ ...smBtn, background: '#ffc107', color: '#333' }}>✏️</button>
                        <button onClick={() => deleteProduct(p.id)} style={{ ...smBtn, background: '#dc3545', color: 'white' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL */}
      {modal && <Modal modal={modal} setModal={setModal} categories={categories} loadData={loadData} boutique={boutique} />}
    </div>
  );

  async function updateOrder(id, statut) {
    await orderApi.updateStatut(id, statut);
    loadData();
    if (statut === 'livre') {
      const order = orders.find(o => o.id === id);
      if (order) {
        const msg = encodeURIComponent(`Bonjour ${order.client_nom} ! Votre commande de ${order.total} MRU est maintenant livrée. Merci !`);
        window.open(`https://wa.me/${order.client_telephone.replace(/\s/g, '')}?text=${msg}`, '_blank');
      }
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    await apiReq(`/products/${id}`, { method: 'DELETE' });
    loadData();
  }
}

function StatCard({ title, value, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '20', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8 }}>●</div>
      <h3 style={{ margin: 0, fontSize: 24 }}>{value}</h3>
      <p style={{ margin: 0, color: '#666', fontSize: 13, marginTop: 4 }}>{title}</p>
    </div>
  );
}

function Modal({ modal, setModal, categories, loadData, boutique }) {
  const [form, setForm] = useState(modal.data || { nom: '', prix_min: '', prix_max: '', unite: 'kg', stock: 0, categorie_id: '', actif: 1 });
  const [catForm, setCatForm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      if (modal.type === 'product') {
        const body = { ...form, prix_min: Number(form.prix_min), prix_max: Number(form.prix_max || form.prix_min), stock: Number(form.stock), categorie_id: form.categorie_id ? Number(form.categorie_id) : null };
        if (modal.data) {
          await apiReq(`/products/${modal.data.id}`, { method: 'PUT', body: JSON.stringify(body) });
        } else {
          await apiReq('/products', { method: 'POST', body: JSON.stringify(body) });
        }
      }
      if (modal.type === 'category') {
        await apiReq('/products/categories', { method: 'POST', body: JSON.stringify({ nom: catForm }) });
      }
      loadData();
      setModal(null);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={overlayStyle} onClick={() => setModal(null)}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>
            {modal.type === 'product' ? (modal.data ? 'Modifier le produit' : 'Ajouter un produit') : 'Nouvelle catégorie'}
          </h3>
          <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {modal.type === 'product' && (
          <>
            <label style={labelStyle}>Nom du produit</label>
            <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} placeholder="Ex: Viande de bœuf" />

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Prix min (MRU)</label>
                <input type="number" value={form.prix_min} onChange={e => setForm(f => ({ ...f, prix_min: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Prix max (MRU)</label>
                <input type="number" value={form.prix_max} onChange={e => setForm(f => ({ ...f, prix_max: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Unité</label>
                <select value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))} style={inputStyle}>
                  <option value="kg">kg</option>
                  <option value="pièce">pièce</option>
                  <option value="litre">litre</option>
                  <option value="botte">botte</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Stock</label>
                <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>Catégorie</label>
            <select value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))} style={inputStyle}>
              <option value="">-- Sélectionner --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </>
        )}

        {modal.type === 'category' && (
          <>
            <label style={labelStyle}>Nom de la catégorie</label>
            <input value={catForm} onChange={e => setCatForm(e.target.value)} style={inputStyle} placeholder="Ex: Viandes, Poulets, Poissons..." />
          </>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1, padding: 12, background: '#1a5632', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function statutColor(s) {
  return { en_attente: '#ffc107', en_cours: '#17a2b8', livre: '#28a745' }[s] || '#6c757d';
}

const cardStyle = { background: 'white', borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const badgeStyle = { padding: '4px 10px', borderRadius: 12, fontSize: 12, color: 'white', display: 'inline-block' };
const actionBtn = { color: 'white', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
const smBtn = { border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', borderRadius: 12, padding: 24, width: 500, maxHeight: '90vh', overflow: 'auto' };
const inputStyle = { width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box', fontSize: 14 };
const labelStyle = { display: 'block', marginBottom: 4, fontSize: 13, color: '#555', fontWeight: 'bold' };
