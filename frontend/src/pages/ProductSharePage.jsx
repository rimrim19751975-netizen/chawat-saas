import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productApi } from '../services/api.js';
import { useLang } from '../services/LanguageContext.jsx';
import LangSwitch from '../components/LangSwitch.jsx';

export default function ProductSharePage() {
  const { slug, productId } = useParams();
  const { t, lang } = useLang();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    productApi.single(productId)
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => { setError(t('errProductNotFound')); setLoading(false); });
  }, [productId]);

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `🥩 ${product.nom} - ${product.prix_min} MRU/${product.unite}\n` +
      `${product.boutique_nom}\n` +
      `${window.location.origin}/boutique/${slug}/produit/${productId}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return (
    <div style={{ ...pageStyle, direction: dir, textAlign: 'center', padding: 60 }}>
      <p>{t('loading')}</p>
    </div>
  );

  if (error || !product) return (
    <div style={{ ...pageStyle, direction: dir, textAlign: 'center', padding: 60 }}>
      <h2>{t('errProductNotFound')}</h2>
      <Link to={`/boutique/${slug}`} style={{ color: '#1a5632', marginTop: 16, display: 'inline-block' }}>{t('returnHome')}</Link>
    </div>
  );

  return (
    <div style={{ ...pageStyle, direction: dir }}>
      <header style={headerStyle}>
        <Link to={`/boutique/${slug}`} style={{ color: 'white', textDecoration: 'none', fontSize: 14 }}>← {product.boutique_nom}</Link>
        <LangSwitch />
      </header>

      <div style={cardStyle}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.nom} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
        ) : (
          <div style={{ width: '100%', height: 200, background: '#f0f0f0', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🥩</div>
        )}

        <div style={{ padding: 24 }}>
          {product.categorie_nom && <span style={{ background: '#e8f5e9', color: '#1a5632', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>{product.categorie_nom}</span>}

          <h1 style={{ margin: '16px 0 8px 0', fontSize: 28 }}>{product.nom}</h1>

          <p style={{ fontSize: 24, color: '#1a5632', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            {product.prix_min === product.prix_max
              ? `${product.prix_min} MRU`
              : `${product.prix_min} - ${product.prix_max} MRU`}
            <span style={{ color: '#999', fontWeight: 'normal', fontSize: 16 }}> / {product.unite}</span>
          </p>

          {product.stock > 0
            ? <span style={{ color: '#28a745', fontSize: 14 }}>● {t('inStock')} ({product.stock})</span>
            : <span style={{ color: '#dc3545', fontSize: 14 }}>● {t('outOfStock')}</span>
          }

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee' }}>
            <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: 13 }}>📍 {product.boutique_adresse || product.boutique_nom}</p>
            {product.boutique_telephone && <p style={{ margin: 0, color: '#666', fontSize: 13 }}>📞 {product.boutique_telephone}</p>}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <a href={`https://wa.me/${product.boutique_telephone?.replace(/\s/g, '').replace('+', '')}?text=${encodeURIComponent(`Bonjour, je voudrais commander: ${product.nom}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ ...btnPrimary, background: '#25d366', flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              📱 {t('orderOnWhatsApp')}
            </a>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button onClick={shareWhatsApp} style={{ ...btnSecondary, flex: 1 }}>
              📤 {t('shareOnWhatsApp')}
            </button>
            <button onClick={copyLink} style={{ ...btnSecondary, flex: 1 }}>
              {copied ? '✓ ' + t('linkCopied') : '🔗 ' + t('copyLink')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle = { fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', padding: 16, minHeight: '100vh', background: '#f5f5f5' };
const headerStyle = { background: '#1a5632', color: 'white', padding: '16px 24px', borderRadius: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const cardStyle = { background: 'white', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', overflow: 'hidden' };
const btnPrimary = { background: '#1a5632', color: 'white', border: 'none', padding: 14, borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' };
const btnSecondary = { background: '#f0f0f0', color: '#333', border: 'none', padding: 12, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' };
