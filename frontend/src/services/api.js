const API = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

export const auth = {
  boutiqueLogin: (email, password) => request('/auth/boutique/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  boutiqueRegister: (data) => request('/auth/boutique/register', { method: 'POST', body: JSON.stringify(data) }),
  clientRegister: (data) => request('/auth/client/register', { method: 'POST', body: JSON.stringify(data) }),
  clientLogin: (telephone, password, boutique_slug) => request('/auth/client/login', { method: 'POST', body: JSON.stringify({ telephone, password, boutique_slug }) }),
  superAdminLogin: (email, password) => request('/superadmin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};

export const boutiqueApi = {
  getPublic: (slug) => request(`/boutique/public/${slug}`),
  getMe: () => request('/boutique/me'),
};

export const productApi = {
  list: (slug) => request(`/products/${slug}`),
  my: () => request('/products/my'),
  create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  categories: () => request('/products/categories/all'),
  createCategory: (data) => request('/products/categories', { method: 'POST', body: JSON.stringify(data) }),
};

export const orderApi = {
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  listBoutique: () => request('/orders/boutique'),
  listClient: () => request('/orders/client'),
  updateStatut: (id, statut) => request(`/orders/${id}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) }),
};

export const superAdminApi = {
  getBoutiques: () => request('/superadmin/boutiques'),
  valider: (id, duree_mois) => request(`/superadmin/boutiques/${id}/valider`, { method: 'PUT', body: JSON.stringify({ duree_mois }) }),
  rejeter: (id) => request(`/superadmin/boutiques/${id}/rejeter`, { method: 'PUT' }),
  suspendre: (id) => request(`/superadmin/boutiques/${id}/suspendre`, { method: 'PUT' }),
  getStats: () => request('/superadmin/stats'),
};
