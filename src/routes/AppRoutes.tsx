import React from 'react';
import { 
  Route, 
  Routes,
  Navigate
} from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import ActividadesPage from '../pages/actividades/ActividadesPage';
import CalendarioPage from '../pages/actividades/CalendarioPage';
import ActividadPage from '../pages/actividades/ActividadPage';
import { ActividadFormPage } from '../pages/actividades/ActividadFormPage';
import ActividadMaterialPage from '../pages/actividades/ActividadMaterialPage';
import GestionMaterialPage from '../pages/material/GestionMaterialPage';
import PerfilPage from '../pages/usuario/PerfilPage';
import GestionUsuariosPage from '../pages/common/GestionUsuariosPage';
import DevolucionMaterialPage from '../pages/material/DevolucionMaterialPage';
import MisActividadesPage from '../pages/MisActividadesPage';
import { RolUsuario } from '../types/usuario';

// Definir interfaz para las props de ProtectedRoute
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: RolUsuario[];
}

// Componente para rutas protegidas
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { userProfile, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  
  if (!userProfile) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(userProfile.rol)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Dashboard principal y rutas por rol */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Dashboards específicos por rol */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/vocal" element={
        <ProtectedRoute allowedRoles={['vocal']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/socio" element={
        <ProtectedRoute allowedRoles={['socio']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/invitado" element={
        <ProtectedRoute allowedRoles={['invitado']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Rutas de Actividades */}
      <Route path="/activities" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ActividadesPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/create" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ActividadFormPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/:id" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ActividadPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/:id/material" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ActividadMaterialPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/calendario" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <CalendarioPage />
        </ProtectedRoute>
      } />
      
      {/* Rutas de Usuarios - Solo Admin */}
      <Route path="/usuarios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <GestionUsuariosPage />
        </ProtectedRoute>
      } />
      
      {/* Rutas de Material - Requiere autenticación */}
      <Route path="/material" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio']}>
          <GestionMaterialPage />
        </ProtectedRoute>
      } />
      <Route path="/material/devoluciones" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio']}>
          <DevolucionMaterialPage />
        </ProtectedRoute>
      } />
      
      <Route path="/perfil" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <PerfilPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRoutes;