import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Dashboard from '../pages/Dashboard'; // Importar el Dashboard unificado
import GestionMaterialPage from '../pages/material/GestionMaterialPage';
import MaterialDetallePage from '../pages/material/MaterialDetallePage';
import QRPrintPage from '../pages/material/QRPrintPage';
import GestionUsuariosPage from '../pages/common/GestionUsuariosPage';
import ActividadesPage from '../pages/actividades/ActividadesPage';
import PerfilPage from '../pages/usuario/PerfilPage';
import CalendarioPage from '../pages/actividades/CalendarioPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Dashboard unificado para todos los roles */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vocal" 
        element={
          <ProtectedRoute allowedRoles={['vocal']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/socio" 
        element={
          <ProtectedRoute allowedRoles={['socio']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/usuario" 
        element={
          <ProtectedRoute allowedRoles={['invitado']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Resto de rutas */}
      <Route path="/material" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio']}>
          <GestionMaterialPage />
        </ProtectedRoute>
      } />
      <Route path="/material/:id" element={<MaterialDetallePage />} />
      <Route path="/material/print-qr" element={<QRPrintPage />} />
      <Route path="/activities" element={<ActividadesPage />} />
      <Route path="/activities/calendario" element={<CalendarioPage />} />
      <Route path="/profile" element={<PerfilPage />} />
    </Routes>
  );
};

export default AppRoutes;