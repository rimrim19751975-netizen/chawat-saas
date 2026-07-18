import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api.js';

export default function SuperAdminLogin() {
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
      const data = await auth.superAdminLogin(email, password);
      localStorage.setItem('superadmin_token', data.token);
      navigate('/superadmin');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
          <h1 style={{ color: 'white', margin: 0, fontSize: 24 }}>Administration Chawat</h1>
          <p style={{ color: '#aaa', marginTop: 8 }}>Gestion des abonnements boutiques</p>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: 32 }}>
          {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email admin" style={inputStyle} required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" style={inputStyle} required />
            <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>{loading ? 'Connexion...' : 'Se connecter'}</button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 16 }}><a href="/" style={{ color: '#aaa', fontSize: 13, textDecoration: 'none' }}>← Retour</a></p>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: 12, marginBottom: 14, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box', fontSize: 14 };
const btnPrimary = { width: '100%', padding: 14, background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' };
