import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api.js';

export default function ClientLogin() {
  const [telephone, setTelephone] = useState('');
  const [nom, setNom] = useState('');
  const [quartier, setQuartier] = useState('');
  const [isNew, setIsNew] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        await auth.clientRegister({ boutique_slug: 'chawat', nom, telephone, quartier });
      }
      const data = await auth.clientLogin(telephone, '', 'chawat');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'client');
      localStorage.setItem('client', JSON.stringify(data.client));
      navigate('/client/orders');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#1a5632' }}>Suivi commande</h1>
        <p style={{ color: '#666' }}>Entrez votre numéro WhatsApp</p>
      </div>
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 4, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input placeholder="WhatsApp (ex: 22222149282)" value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} required />
        {isNew && (
          <>
            <input placeholder="Votre nom" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} required />
            <select value={quartier} onChange={e => setQuartier(e.target.value)} style={inputStyle} required>
              <option value="">Quartier</option>
              <option>Tevragh Zeina</option><option>Ksar</option><option>Arafat</option>
              <option>Soukouk</option><option>Dar Naim</option><option>Toujounine</option>
              <option>Riyad</option><option>Sebkha</option><option>El Mina</option>
            </select>
          </>
        )}
        <button type="submit" style={btnStyle}>{isNew ? 'Créer et voir mes commandes' : 'Voir mes commandes'}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 12 }}>
        <button onClick={() => setIsNew(!isNew)} style={{ background: 'none', border: 'none', color: '#1a5632', cursor: 'pointer', textDecoration: 'underline' }}>
          {isNew ? 'Déjà inscrit ? Cliquez ici' : 'Nouveau client ? Créez un compte'}
        </button>
      </p>
      <p style={{ textAlign: 'center' }}><a href="/" style={{ color: '#999', fontSize: 14 }}>← Retour boutique</a></p>
    </div>
  );
}

const inputStyle = { width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: 12, background: '#1a5632', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 };
