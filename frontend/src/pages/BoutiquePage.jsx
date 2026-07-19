import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productApi, boutiqueApi, orderApi } from '../services/api.js';
import { useLang } from '../services/LanguageContext.jsx';
import LangSwitch from '../components/LangSwitch.jsx';

export default function BoutiquePage() {
  const { slug } = useParams();
  const boutiqueSlug = slug || 'chawat';
  const { t, lang } = useLang();
  const [boutique, setBoutique] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ nom: '', telephone: '', quartier: '' });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    boutiqueApi.getPublic(boutiqueSlug).then(b => setBoutique(b)).catch(() => {});
    productApi.list(boutiqueSlug).then(d => { setProducts(d.products); setCategories(d.categories); }).catch(() => {});
  }, [boutiqueSlug]);

  function addToCart(product) {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, nom: product.nom, prix: product.prix_min, unite: product.unite, qty: 1 }];
    });
  }

  function removeFromCart(productId) {
    setCart(prev => {
      const item = prev.find(i => i.id === productId);
      if (item && item.qty > 1) return prev.map(i => i.id === productId ? { ...i, qty: i.qty - 1 } : i);
      return prev.filter(i => i.id !== productId);
    });
  }

  const total = cart.reduce((sum, item) => sum + item.prix * item.qty, 0);

  function shareWhatsApp(product) {
    const productUrl = `${window.location.origin}/boutique/${boutiqueSlug}/produit/${product.id}`;
    const text = encodeURIComponent(`🥩 ${product.nom} - ${product.prix_min} MRU/${product.unite} | ${boutique?.nom || 'Chawat'}\n${productUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function copyLink(product) {
    const url = `${window.location.origin}/boutique/${boutiqueSlug}/produit/${product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(product.id);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  async function handleOrder() {
    if (!form.nom || !form.telephone || !form.quartier) { setError(t('errFillFields')); return; }
    if (cart.length === 0) { setError(t('errCartEmpty')); return; }
    setLoading(true); setError('');
    try {
      const items = cart.map(item => ({ product_id: item.id, product_nom: item.nom, quantite: item.qty, prix_unitaire: item.prix }));
      await orderApi.create({ boutique_slug: 'chawat', client_nom: form.nom, client_telephone: form.telephone, client_quartier: form.quartier, items });
      setSuccess(true); setCart([]); setForm({ nom: '', telephone: '', quartier: '' });
    } catch (err) { setError(t('errOrderFailed') + ': ' + err.message); }
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ ...pageStyle, direction: dir }}>
        <header style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{boutique?.nom || t('shopTitle')}</h1>
          <LangSwitch />
        </header>
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#1a5632', marginBottom: 8 }}>{t('orderSuccess')}</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>{t('orderSuccessMsg')}</p>
          <button onClick={() => setSuccess(false)} style={{ ...btnPrimary, fontSize: 18 }}>{t('newOrder')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageStyle, direction: dir }}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{boutique?.nom || t('shopTitle')}</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>{t('shopSubtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cart.length > 0 && (
            <div style={{ background: 'white', color: '#1a5632', padding: '8px 16px', borderRadius: 20, fontWeight: 'bold', fontSize: 13 }}>
              {t('cart')}: {cart.reduce((s, i) => s + i.qty, 0)} {t('articles')} - {total} MRU
            </div>
          )}
          <LangSwitch />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: cart.length > 0 ? '1fr 340px' : '1fr', gap: 20 }}>
        <div>
          {categories.map(cat => (
            <div key={cat.id} style={{ marginBottom: 24 }}>
              <h2 style={{ color: '#1a5632', borderBottom: '3px solid #1a5632', paddingBottom: 8, marginTop: 24 }}>{cat.nom}</h2>
              {products.filter(p => p.categorie_id === cat.id).map(product => {
                const inCart = cart.find(i => i.id === product.id);
                return (
                  <div key={product.id} style={productCardStyle}>
                    {product.image_url && <img src={product.image_url} alt={product.nom} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                    <div style={{ flex: 1, padding: product.image_url ? '0 0 0 12px' : 0 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{product.nom}</h3>
                      <p style={{ margin: 0, color: '#1a5632', fontWeight: 'bold', fontSize: 15 }}>
                        {product.prix_min === product.prix_max ? `${product.prix_min} MRU` : `${product.prix_min} - ${product.prix_max} MRU`}
                        <span style={{ color: '#999', fontWeight: 'normal', fontSize: 13 }}> / {product.unite}</span>
                      </p>
                      {product.stock > 0 && <span style={{ fontSize: 12, color: '#28a745' }}>● {t('inStock')}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {inCart && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => removeFromCart(product.id)} style={qtyBtn}>−</button>
                          <span style={{ fontWeight: 'bold', fontSize: 16, minWidth: 24, textAlign: 'center' }}>{inCart.qty}</span>
                          <button onClick={() => addToCart(product)} style={qtyBtn}>+</button>
                        </div>
                      )}
                      <button onClick={() => addToCart(product)} style={inCart ? btnAddMore : btnAddToCart}>
                        {inCart ? t('addMore') : t('addToCart')}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                      <button onClick={() => shareWhatsApp(product)} style={shareBtn} title={t('shareOnWhatsApp')}>📱</button>
                      <button onClick={() => copyLink(product)} style={shareBtn} title={t('copyLink')}>{copied === product.id ? '✓' : '🔗'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div>
            <div style={cartBoxStyle}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>🛒 {t('yourCart')}</h2>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14 }}>{item.nom}</strong>
                    <p style={{ margin: 0, fontSize: 13, color: '#666' }}>{item.prix} MRU × {item.qty}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 'bold', fontSize: 14 }}>{item.prix * item.qty} MRU</span>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: '#dc3545', color: 'white', border: 'none', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '2px solid #1a5632', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
                <strong>{t('total')}</strong>
                <strong style={{ color: '#1a5632' }}>{total} MRU</strong>
              </div>
              {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 10, borderRadius: 6, marginTop: 12, fontSize: 13 }}>{error}</div>}
              <div style={{ marginTop: 16 }}>
                <input placeholder={t('yourName')} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
                <input placeholder={t('whatsappNumber')} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} type="tel" />
                <select value={form.quartier} onChange={e => setForm(f => ({ ...f, quartier: e.target.value }))} style={inputStyle}>
                  <option value="">{t('deliveryQuarter')}</option>
                  <option>{t('qTevraghZeina')}</option><option>{t('qKsar')}</option><option>{t('qArafat')}</option>
                  <option>{t('qSoukouk')}</option><option>{t('qDarNaim')}</option><option>{t('qToujounine')}</option>
                  <option>{t('qRiyad')}</option><option>{t('qSebkha')}</option><option>{t('qElMina')}</option>
                </select>
                <button onClick={handleOrder} disabled={loading} style={{ ...btnPrimary, width: '100%', marginTop: 8, opacity: loading ? 0.7 : 1 }}>
                  {loading ? t('ordering') : `${t('order')} - ${total} MRU`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <a href="/client/login" style={{ color: '#1a5632', marginRight: 16, textDecoration: 'none' }}>{t('followOrder')}</a>
        <a href="/admin/login" style={{ color: '#999', textDecoration: 'none', fontSize: 13 }}>{t('adminSpace')}</a>
      </div>
      {boutique && (
        <footer style={{ textAlign: 'center', marginTop: 32, padding: 16, color: '#666', fontSize: 13, borderTop: '1px solid #eee' }}>
          {boutique.adresse} | {boutique.telephone}
        </footer>
      )}
    </div>
  );
}

const pageStyle = { fontFamily: 'Arial, sans-serif', maxWidth: 1100, margin: '0 auto', padding: 16 };
const headerStyle = { background: '#1a5632', color: 'white', padding: '16px 24px', borderRadius: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const productCardStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'white', borderRadius: 8, marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
const cartBoxStyle = { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 20 };
const inputStyle = { width: '100%', padding: 12, marginBottom: 10, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box', fontSize: 14 };
const btnAddToCart = { background: '#1a5632', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap' };
const btnAddMore = { background: '#28a745', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap' };
const btnPrimary = { background: '#1a5632', color: 'white', border: 'none', padding: 14, borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' };
const qtyBtn = { background: '#eee', border: 'none', width: 32, height: 32, borderRadius: 4, cursor: 'pointer', fontSize: 18, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const shareBtn = { background: '#f0f0f0', border: 'none', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' };
