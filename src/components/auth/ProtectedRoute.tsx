import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';
import { getRutaPorRol } from '../../utils/navigation';
import { safeLog } from '../../utils/performanceUtils';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, 
  children, 
  redirectTo = '/login' 
}) => {
  const { userProfile, loading, currentUser } = useAuth();
  const location = useLocation();
  
  // Log único usando safeLog al cambiar la ruta
  useEffect(() => {
    safeLog(`ProtectedRoute - Ruta: ${location.pathname}, Rol: ${userProfile?.rol}, Permitidos: ${allowedRoles.join(', ')}`);
  }, [location.pathname, userProfile?.rol, allowedRoles]);
  
  // Solo mostrar spinner durante la carga inicial
  if (loading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }
  
  // Si no hay usuario, redirigir al login
  if (!currentUser || !userProfile) {
    safeLog('ProtectedRoute - Redirigiendo a login: sin usuario autenticado');
    return <Navigate to={redirectTo} replace />;
  }
  
  // Si el usuario no tiene los permisos necesarios
  if (!allowedRoles.includes(userProfile.rol)) {
    const redirectPath = getRutaPorRol(userProfile.rol);
    safeLog(`ProtectedRoute - Redirigiendo a ${redirectPath}: rol no permitido`);
    return <Navigate to={redirectPath} replace />;
  }
  
  // Acceso permitido
  safeLog('ProtectedRoute - Acceso permitido');
  return <>{children}</>;
};

export default ProtectedRoute;