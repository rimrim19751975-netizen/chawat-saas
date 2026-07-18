import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BoutiquePage from './pages/BoutiquePage.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ClientLogin from './pages/ClientLogin.jsx';
import ClientOrders from './pages/ClientOrders.jsx';
import BoutiqueRegister from './pages/BoutiqueRegister.jsx';
import SuperAdminLogin from './pages/SuperAdminLogin.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const storedRole = localStorage.getItem('role');
  if (!token || (role && storedRole !== role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoutiquePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute role="boutique"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/boutique/register" element={<BoutiqueRegister />} />
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/orders" element={<ProtectedRoute role="client"><ClientOrders /></ProtectedRoute>} />
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
