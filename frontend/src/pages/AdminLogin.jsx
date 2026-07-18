import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api.js';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await auth.boutiqueLogin(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'boutique');
      localStorage.setItem('boutique', JSON.stringify(data.boutique));
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ color: '#1a5632', textDecoration: 'none', fontSize: 32, fontWeight: 'bold' }}>🛒 Chawat</a>
          <p style={{ color: '#666', marginTop: 8 }}>Espace boutique - Connexion</p>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="contact@boutique.mr" required />

            <label style={labelStyle}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••" required />

            <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ marginBottom: 12 }}>
            <a href="/boutique/register" style={{ color: '#1a5632', fontSize: 15, textDecoration: 'none', fontWeight: 'bold' }}>
              📋 Contactez-nous pour un compte boutique
            </a>
          </p>
          <p style={{ color: '#999', fontSize: 13 }}>
            Créez votre boutique en ligne et commencez à vendre
          </p>
          <p style={{ marginTop: 16 }}><a href="/" style={{ color: '#999', fontSize: 13, textDecoration: 'none' }}>← Retour à la boutique</a></p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: 12, marginBottom: 16, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box', fontSize: 14 };
const labelStyle = { display: 'block', marginBottom: 4, fontSize: 13, color: '#555', fontWeight: 'bold' };
const btnPrimary = { width: '100%', padding: 14, background: '#1a5632', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' };
