import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../services/api.js';

export default function ClientOrders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const client = JSON.parse(localStorage.getItem('client') || '{}');

  useEffect(() => {
    orderApi.listClient().then(setOrders).catch(() => navigate('/client/login'));
  }, []);

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('client'); navigate('/'); };

  const statutColor = { en_attente: '#ffc107', en_cours: '#17a2b8', livre: '#28a745' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a5632', color: 'white', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <div><h1 style={{ margin: 0, fontSize: 18 }}>Bonjour {client.nom}</h1></div>
        <button onClick={logout} style={{ background: 'white', color: '#1a5632', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>Déconnexion</button>
      </header>

      <h2>Mes commandes</h2>
      {orders.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Aucune commande pour le moment</p>
      ) : (
        orders.map(order => (
          <div key={order.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#666' }}>#{order.id.slice(0, 8)} • {new Date(order.date_creation).toLocaleDateString('fr-FR')}</span>
              <span style={{ background: statutColor[order.statut] || '#6c757d', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>{order.statut}</span>
            </div>
            {order.items?.map(item => (
              <div key={item.id} style={{ fontSize: 14, color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.product_nom} x {item.quantite}</span>
                <span>{item.prix_unitaire * item.quantite} MRU</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Livraison: {order.client_quartier}</span>
              <strong>{order.total} MRU</strong>
            </div>
            {order.date_livraison && (
              <p style={{ fontSize: 13, color: '#28a745', marginTop: 4 }}>Livré le {new Date(order.date_livraison).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        ))
      )}
      <p style={{ textAlign: 'center', marginTop: 20 }}><a href="/" style={{ color: '#1a5632' }}>← Passer une nouvelle commande</a></p>
    </div>
  );
}
