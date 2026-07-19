import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boutiqueApi, productApi, orderApi } from '../services/api.js';
import { useLang } from '../services/LanguageContext.jsx';
import LangSwitch from '../components/LangSwitch.jsx';

const API = '/api';
async function apiReq(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Erreur de connexion au serveur.'); }
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
}

export default function AdminDashboard() {
  const { t, lang } = useLang();
  const [boutique, setBoutique] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

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
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5', direction: dir }}>
      <header style={{ background: '#1a5632', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 style={{ margin: 0, fontSize: 20 }}>{boutique?.nom || 'Chawat'}</h1><span style={{ fontSize: 12, opacity: 0.8 }}>{t('navAdmin')}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LangSwitch />
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>{t('logout')}</button>
        </div>
      </header>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <nav style={{ width: 220, background: 'white', borderRight: dir === 'rtl' ? 'none' : '1px solid #eee', borderLeft: dir === 'rtl' ? '1px solid #eee' : 'none', padding: '16px 0' }}>
          {[{ id: 'dashboard', icon: '📊', label: t('navDashboard') }, { id: 'orders', icon: '📦', label: `${t('navOrders')}${pending ? ` (${pending})` : ''}` }, { id: 'products', icon: '🥩', label: t('navProducts') }].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 20px', border: 'none', background: tab === item.id ? '#e8f5e9' : 'transparent', color: tab === item.id ? '#1a5632' : '#333', cursor: 'pointer', fontSize: 14, fontWeight: tab === item.id ? 'bold' : 'normal' }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <main style={{ flex: 1, padding: 24 }}>
          {tab === 'dashboard' && (
            <div>
              <h2 style={{ marginBottom: 20 }}>{t('navDashboard')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <StatCard title={t('pendingOrders')} value={pending} color="#ffc107" />
                <StatCard title={t('totalRevenue')} value={`${revenue.toLocaleString()} MRU`} color="#28a745" />
                <StatCard title={t('totalProducts')} value={products.length} color="#17a2b8" />
              </div>
              <h3>{t('latestOrders')}</h3>
              {orders.slice(0, 5).map(o => (
                <div key={o.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>{o.client_nom}</strong> — {o.client_quartier}<p style={{ margin: 0, fontSize: 13, color: '#666' }}>{o.client_telephone}</p></div>
                    <div style={{ textAlign: 'right' }}><span style={{ ...badgeStyle, background: statutColor(o.statut) }}>{statutLabel(o.statut)}</span><p style={{ fontWeight: 'bold', marginTop: 4 }}>{o.total} MRU</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>{t('navOrders')} ({orders.length})</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['en_attente', 'en_cours', 'livre'].map(s => (
                    <span key={s} style={{ background: statutColor(s), color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>{statutLabel(s)}: {orders.filter(o => o.statut === s).length}</span>
                  ))}
                </div>
              </div>
              {orders.map(order => (
                <div key={order.id} style={{ ...cardStyle, borderLeft: dir === 'rtl' ? 'none' : `4px solid ${statutColor(order.statut)}`, borderRight: dir === 'rtl' ? `4px solid ${statutColor(order.statut)}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div><strong>{order.client_nom}</strong><p style={{ margin: 0, fontSize: 13, color: '#666' }}>📞 {order.client_telephone} | 📍 {order.client_quartier}</p><p style={{ margin: 0, fontSize: 12, color: '#999' }}>{new Date(order.date_creation).toLocaleString('fr-FR')}</p></div>
                    <div style={{ textAlign: 'right' }}><span style={{ ...badgeStyle, background: statutColor(order.statut) }}>{statutLabel(order.statut)}</span><p style={{ fontWeight: 'bold', fontSize: 18, marginTop: 4 }}>{order.total} MRU</p></div>
                  </div>
                  {order.items?.map(item => (<div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14, color: '#555', borderTop: '1px solid #f0f0f0' }}><span>{item.product_nom} × {item.quantite}</span><span>{item.prix_unitaire * item.quantite} MRU</span></div>))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                    <a href={`https://wa.me/${order.client_telephone.replace(/\s/g, '').replace('+', '')}?text=${encodeURIComponent(`Bonjour ${order.client_nom} !`)}`} target="_blank" rel="noopener noreferrer" style={{ background: '#25d366', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', textDecoration: 'none', fontSize: 13 }}>{t('whatsappNotify')}</a>
                    {order.statut === 'en_attente' && <button onClick={() => updateOrder(order.id, 'en_cours')} style={{ ...actionBtn, background: '#17a2b8' }}>{t('takeInCharge')}</button>}
                    {order.statut === 'en_cours' && <button onClick={() => updateOrder(order.id, 'livre')} style={{ ...actionBtn, background: '#28a745' }}>{t('markDelivered')}</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>{t('navProducts')} ({products.length})</h2>
                <button onClick={() => setModal({ type: 'product', data: null })} style={{ background: '#1a5632', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>+ {t('addProduct')}</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {products.map(p => (
                  <div key={p.id} style={cardStyle}>
                    {p.image_url && <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '10px 10px 0 0' }} />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: p.image_url ? '12px 0 0 0' : 0 }}>
                      <div><h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{p.nom}</h3><p style={{ margin: 0, color: '#666', fontSize: 13 }}>{p.categorie_nom || t('noCategory')}</p></div>
                      <span style={{ background: p.actif ? '#d4edda' : '#f8d7da', color: p.actif ? '#155724' : '#721c24', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{p.actif ? t('active') : t('inactive')}</span>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><strong style={{ color: '#1a5632', fontSize: 18 }}>{p.prix_min} MRU</strong><p style={{ margin: 0, fontSize: 12, color: '#999' }}>{t('stock')}: {p.stock} {p.unite}</p></div>
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
      {modal && <Modal modal={modal} setModal={setModal} categories={categories} loadData={loadData} t={t} />}
    </div>
  );

  async function updateOrder(id, statut) { await orderApi.updateStatut(id, statut); loadData(); }
  async function deleteProduct(id) { if (confirm(t('confirm'))) { await apiReq(`/products/${id}`, { method: 'DELETE' }); loadData(); } }
  function statutLabel(s) { return { en_attente: t('statutEnAttente'), en_cours: t('statutEnCours'), livre: t('statutLivre') }[s] || s; }
  function statutColor(s) { return { en_attente: '#ffc107', en_cours: '#17a2b8', livre: '#28a745' }[s] || '#6c757d'; }
}

function StatCard({ title, value, color }) {
  return (<div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}><div style={{ width: 40, height: 40, borderRadius: 10, background: color + '20', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8 }}>●</div><h3 style={{ margin: 0, fontSize: 24 }}>{value}</h3><p style={{ margin: 0, color: '#666', fontSize: 13, marginTop: 4 }}>{title}</p></div>);
}

function Modal({ modal, setModal, categories, loadData, t }) {
  const [form, setForm] = useState(modal.data || { nom: '', prix_min: '', prix_max: '', unite: 'kg', stock: 0, categorie_id: '', actif: 1, image_url: '' });
  const [catForm, setCatForm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(modal.data?.image_url || '');

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await productApi.uploadImage(file);
      setForm(f => ({ ...f, image_url: data.url }));
      setPreview(data.url);
    } catch (err) { alert(err.message); }
    setUploading(false);
  }

  async function handleSave() {
    setLoading(true);
    try {
      if (modal.type === 'product') {
        const body = { ...form, prix_min: Number(form.prix_min), prix_max: Number(form.prix_max || form.prix_min), stock: Number(form.stock), categorie_id: form.categorie_id ? Number(form.categorie_id) : null, image_url: form.image_url || null };
        if (modal.data) { await apiReq(`/products/${modal.data.id}`, { method: 'PUT', body: JSON.stringify(body) }); }
        else { await apiReq('/products', { method: 'POST', body: JSON.stringify(body) }); }
      }
      if (modal.type === 'category') { await apiReq('/products/categories', { method: 'POST', body: JSON.stringify({ nom: catForm }) }); }
      loadData(); setModal(null);
    } catch (err) { alert(err.message); }
    setLoading(false);
  }

  return (
    <div style={overlayStyle} onClick={() => setModal(null)}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>{modal.type === 'product' ? (modal.data ? t('modifyProduct') : t('addProduct')) : t('newCategory')}</h3>
          <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {modal.type === 'product' && (<>
          <label style={labelStyle}>{t('productName')}</label>
          <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
          <label style={labelStyle}>{t('productImage')}</label>
          {preview && <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={uploading} style={{ ...inputStyle, padding: '8px 0' }} />
          {uploading && <p style={{ fontSize: 12, color: '#17a2b8', margin: '0 0 12px 0' }}>{t('uploading')}...</p>}
          <div style={{ display: 'flex', gap: 12 }}><div style={{ flex: 1 }}><label style={labelStyle}>{t('priceMin')}</label><input type="number" value={form.prix_min} onChange={e => setForm(f => ({ ...f, prix_min: e.target.value }))} style={inputStyle} /></div><div style={{ flex: 1 }}><label style={labelStyle}>{t('priceMax')}</label><input type="number" value={form.prix_max} onChange={e => setForm(f => ({ ...f, prix_max: e.target.value }))} style={inputStyle} /></div></div>
          <div style={{ display: 'flex', gap: 12 }}><div style={{ flex: 1 }}><label style={labelStyle}>{t('unit')}</label><select value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))} style={inputStyle}><option value="kg">kg</option><option value="pièce">pièce</option><option value="litre">litre</option></select></div><div style={{ flex: 1 }}><label style={labelStyle}>{t('stock')}</label><input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={inputStyle} /></div></div>
          <label style={labelStyle}>{t('category')}</label>
          <select value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))} style={inputStyle}><option value="">--</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
        </>)}
        {modal.type === 'category' && (<><label style={labelStyle}>{t('categoryName')}</label><input value={catForm} onChange={e => setCatForm(e.target.value)} style={inputStyle} /></>)}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{t('cancel')}</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1, padding: 12, background: '#1a5632', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? t('loading') : t('save')}</button>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { background: 'white', borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const badgeStyle = { padding: '4px 10px', borderRadius: 12, fontSize: 12, color: 'white', display: 'inline-block' };
const actionBtn = { color: 'white', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
const smBtn = { border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', borderRadius: 12, padding: 24, width: 500, maxHeight: '90vh', overflow: 'auto' };
const inputStyle = { width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box', fontSize: 14 };
const labelStyle = { display: 'block', marginBottom: 4, fontSize: 13, color: '#555', fontWeight: 'bold' };
