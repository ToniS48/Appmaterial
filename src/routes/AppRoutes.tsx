import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRutaPorRol } from '../utils/navigation';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Importaciones de componentes (mantener las existentes)
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import ActividadesPage from '../pages/actividades/ActividadesPage';
import CalendarioPage from '../pages/actividades/CalendarioPage';
import ActividadPage from '../pages/actividades/ActividadPage';
import ActividadFormPage from '../pages/actividades/ActividadFormPage';
import ActividadMaterialPage from '../pages/actividades/ActividadMaterialPage';
import MaterialInventoryPage from '../pages/material/MaterialInventoryPage';
import GestionMaterialPage from '../pages/material/GestionMaterialPage';
import ProfilePage from '../pages/usuario/ProfilePage';
import GestionUsuariosPage from '../pages/common/GestionUsuariosPage';
import DevolucionMaterialPage from '../pages/material/DevolucionMaterialPage';
import MisActividadesPage from '../pages/MisActividadesPage';
import MaterialDetallePage from '../pages/material/MaterialDetallePage';
import QRPrintPage from '../pages/material/QRPrintPage';
import NotificacionesPage from '../pages/common/NotificacionesPage';
import ConfiguracionPage from '../pages/admin/ConfiguracionPage';
import ReportesAdminPage from '../pages/reportes/ReportesAdminPage';
import PrestamosAdminPage from '../pages/prestamos/PrestamosAdminPage';
import PrestamosVocalPage from '../pages/prestamos/PrestamosVocalPage';
import MisPrestamosPage from '../pages/prestamos/MisPrestamosPage';
import EstadisticasAdminPage from '../pages/admin/EstadisticasAdminPage';
import EstadisticasVocalPage from '../pages/vocal/EstadisticasVocalPage';
import MensajeriaPage from '../pages/MensajeriaPage';
import MensajeriaTesting from '../components/testing/MensajeriaTesting';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useAuth();

  return (
    <Routes>
      {/* RUTAS PÚBLICAS */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* RUTAS DE DASHBOARDS (por rol) */}
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
      

      {/* IMPORTANTE: Colocar primero las rutas específicas antes de la ruta genérica /:role */}
        {/* Rutas específicas para administrador */}
      <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['admin']}><GestionUsuariosPage /></ProtectedRoute>} />
      <Route path="/admin/prestamos" element={<ProtectedRoute allowedRoles={['admin']}><PrestamosAdminPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><ConfiguracionPage /></ProtectedRoute>} />
      <Route path="/admin/notificaciones" element={<ProtectedRoute allowedRoles={['admin']}><NotificacionesPage /></ProtectedRoute>} />
      <Route path="/admin/reportes" element={<ProtectedRoute allowedRoles={['admin']}><ReportesAdminPage /></ProtectedRoute>} />
      <Route path="/admin/estadisticas" element={<ProtectedRoute allowedRoles={['admin']}><EstadisticasAdminPage /></ProtectedRoute>} />
        {/* Rutas específicas para vocal */}
      <Route path="/vocal/usuarios" element={<ProtectedRoute allowedRoles={['vocal']}><GestionUsuariosPage /></ProtectedRoute>} />
      <Route path="/vocal/prestamos" element={<ProtectedRoute allowedRoles={['vocal']}><PrestamosVocalPage /></ProtectedRoute>} />
      <Route path="/vocal/reportes" element={<ProtectedRoute allowedRoles={['vocal']}><ReportesAdminPage /></ProtectedRoute>} />
      <Route path="/vocal/estadisticas" element={<ProtectedRoute allowedRoles={['vocal']}><EstadisticasVocalPage /></ProtectedRoute>} />
      <Route path="/vocal/estadisticas" element={<ProtectedRoute allowedRoles={['vocal']}><EstadisticasVocalPage /></ProtectedRoute>} />
      
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
          </ProtectedRoute>        }
      />
      <Route path="/material/inventario" element={<ProtectedRoute allowedRoles={['socio']}><MaterialInventoryPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}><ProfilePage /></ProtectedRoute>} />
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
            <MisPrestamosPage />
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

      {/* RUTAS ESPECÍFICAS Y ESTÁTICAS (antes de las dinámicas) */}
      <Route path="/activities/calendario" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <CalendarioPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/create" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ActividadFormPage />
        </ProtectedRoute>
      } />

      {/* RUTAS DINÁMICAS */}
      <Route path="/activities/:id/material" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ActividadMaterialPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/:id" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ActividadPage />
        </ProtectedRoute>
      } />

      
      {/* RESTO DE RUTAS (mantener las existentes en el mismo orden) */}
      <Route path="/activities" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ActividadesPage />
        </ProtectedRoute>
      } />

      {/* Rutas de material */}
      <Route path="/material" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal']}>
          <GestionMaterialPage />
        </ProtectedRoute>
      } />
      <Route path="/material/detalle/:id" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <MaterialDetallePage />
        </ProtectedRoute>
      } />
      <Route path="/material/qr/:id" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal']}>
          <QRPrintPage />
        </ProtectedRoute>
      } />
      <Route path="/material/devolucion/:prestamoId" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio']}>
          <DevolucionMaterialPage />
        </ProtectedRoute>
      } />

      {/* Rutas de usuario */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/admin/usuarios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <GestionUsuariosPage />
        </ProtectedRoute>
      } />
      <Route path="/vocal/usuarios" element={
        <ProtectedRoute allowedRoles={['vocal']}>
          <GestionUsuariosPage />
        </ProtectedRoute>
      } />

      {/* Rutas de préstamos */}
      <Route path="/mis-prestamos" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio']}>
          <MisPrestamosPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/prestamos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <PrestamosAdminPage />
        </ProtectedRoute>
      } />
      <Route path="/vocal/prestamos" element={
        <ProtectedRoute allowedRoles={['vocal']}>
          <PrestamosVocalPage />
        </ProtectedRoute>
      } />

      {/* Otras rutas */}
      <Route path="/mis-actividades" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <MisActividadesPage />
        </ProtectedRoute>
      } />      <Route path="/notificaciones" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <NotificacionesPage />
        </ProtectedRoute>
      } />
      <Route path="/mensajeria" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio', 'invitado']}>
          <MensajeriaPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ConfiguracionPage />
        </ProtectedRoute>      } />
      <Route path="/admin/reportes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ReportesAdminPage />
        </ProtectedRoute>
      } />

      {/* RUTA DE PRUEBAS - SOLO PARA DESARROLLO */}
      <Route path="/testing/mensajeria" element={
        <ProtectedRoute allowedRoles={['admin', 'vocal', 'socio']}>
          <MensajeriaTesting />
        </ProtectedRoute>
      } />

      {/* RUTA DE FALLBACK */}
      <Route path="*" element={
        userProfile ? 
          <Navigate to={getRutaPorRol(userProfile.rol)} replace /> : 
          <Navigate to="/login" replace />
      } />
    </Routes>
  );
};

export default AppRoutes;