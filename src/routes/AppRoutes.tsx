import { Route, Routes, Navigate } from 'react-router-dom'; // Elimina BrowserRouter
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import ActividadesPage from '../pages/actividades/ActividadesPage';
import CalendarioPage from '../pages/actividades/CalendarioPage';
import ActividadPage from '../pages/actividades/ActividadPage';
import ActividadFormPage from '../pages/actividades/ActividadFormPage';
import ActividadMaterialPage from '../pages/actividades/ActividadMaterialPage';
import MaterialPage from '../pages/material/GestionMaterialPage';
import MaterialInventoryPage from '../pages/material/MaterialInventoryPage';
import PerfilPage from '../pages/usuario/PerfilPage';
import GestionUsuariosPage from '../pages/common/GestionUsuariosPage';
import PrestamosAdminPage from '../pages/admin/PrestamosAdminPage';
import ConfiguracionPage from '../pages/admin/ConfiguracionPage';
import NotificacionesAdminPage from '../pages/admin/NotificacionesAdminPage';
import ReportesAdminPage from '../pages/admin/ReportesAdminPage';
import PrestamosVocalPage from '../pages/vocal/PrestamosVocalPage';
import NotificacionesPage from '../pages/common/NotificacionesPage';
import MisPrestamosPag from '../pages/common/MisPrestamosPag';
import DevolucionMaterialPage from '../pages/material/DevolucionMaterialPage';
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
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* IMPORTANTE: Colocar primero las rutas específicas antes de la ruta genérica /:role */}
      
      {/* Rutas específicas para administrador */}
      <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['admin']}><GestionUsuariosPage /></ProtectedRoute>} />
      <Route path="/admin/prestamos" element={<ProtectedRoute allowedRoles={['admin']}><PrestamosAdminPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><ConfiguracionPage /></ProtectedRoute>} />
      <Route path="/admin/notificaciones" element={<ProtectedRoute allowedRoles={['admin']}><NotificacionesAdminPage /></ProtectedRoute>} />
      <Route path="/admin/reportes" element={<ProtectedRoute allowedRoles={['admin']}><ReportesAdminPage /></ProtectedRoute>} />
      
      {/* Rutas específicas para vocal */}
      <Route path="/vocal/usuarios" element={<ProtectedRoute allowedRoles={['vocal']}><GestionUsuariosPage /></ProtectedRoute>} />
      <Route path="/vocal/prestamos" element={<ProtectedRoute allowedRoles={['vocal']}><PrestamosVocalPage /></ProtectedRoute>} />
      
      {/* Dashboards - Unificado para todos los roles */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/vocal" element={<ProtectedRoute allowedRoles={['vocal']}><Dashboard /></ProtectedRoute>} />
      <Route path="/socio" element={<ProtectedRoute allowedRoles={['socio']}><Dashboard /></ProtectedRoute>} />
      <Route path="/invitado" element={<ProtectedRoute allowedRoles={['invitado']}><Dashboard /></ProtectedRoute>} />
      
      {/* Rutas comunes - protegidas para usuarios autenticados */}
      <Route path="/activities" element={<ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}><ActividadesPage /></ProtectedRoute>} />
      <Route path="/activities/calendario" element={<ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}><CalendarioPage /></ProtectedRoute>} />
      <Route path="/activities/:id" element={<ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}><ActividadPage /></ProtectedRoute>} />
      <Route 
        path="/activities/create" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
            <ActividadFormPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/activities/edit/:id" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
            <ActividadFormPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/activities/:id/material" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
            <ActividadMaterialPage />
          </ProtectedRoute>
        }
      />      <Route path="/material" element={<ProtectedRoute allowedRoles={['admin', 'vocal']}><MaterialPage /></ProtectedRoute>} />
      <Route path="/material/inventario" element={<ProtectedRoute allowedRoles={['socio']}><MaterialInventoryPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}><PerfilPage /></ProtectedRoute>} />
      <Route 
        path="/notificaciones" 
        element={
          <ProtectedRoute 
            allowedRoles={['admin', 'vocal', 'socio', 'invitado']}
          >
            <NotificacionesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/mis-prestamos" 
        element={
          <ProtectedRoute 
            allowedRoles={['admin', 'vocal', 'socio']}
          >
            <MisPrestamosPag />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/devolucion-material" 
        element={
          <ProtectedRoute 
            allowedRoles={['admin', 'vocal']}
          >
            <DevolucionMaterialPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Dashboard unificado con redirección según rol - IMPORTANTE: colocar DESPUÉS de las rutas específicas */}
      <Route 
        path="/:role" 
        element={
          <ProtectedRoute 
            allowedRoles={['admin', 'vocal', 'socio', 'invitado']}
          >
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Ruta de fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;