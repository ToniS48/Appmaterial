import React, { useEffect, useMemo, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';
import { getRutaPorRol } from '../../utils/navigation';
import { logger } from '../../utils/performanceUtils';

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
  const lastLoggedRoute = useRef<string>('');

  // Memoizar los permisos para evitar recálculos innecesarios
  const hasPermission = useMemo(() => {
    if (!userProfile?.rol) return false;
    return allowedRoles.includes(userProfile.rol);
  }, [userProfile?.rol, allowedRoles]);

  // Log solo cuando cambia la ruta (no en cada render) y solo en desarrollo
  useEffect(() => {
    if (!loading && userProfile?.rol && process.env.NODE_ENV === 'development') {
      const currentRoute = `${location.pathname}-${userProfile.rol}-${allowedRoles.join(',')}`;
      if (currentRoute !== lastLoggedRoute.current) {
        logger.debug(`ProtectedRoute - Ruta: ${location.pathname}, Rol: ${userProfile?.rol}, Permitidos: ${allowedRoles.join(', ')}`);
        lastLoggedRoute.current = currentRoute;
      }
    }
  }, [location.pathname, userProfile?.rol, allowedRoles, loading]);
  
  // Solo mostrar spinner durante la carga inicial o cuando el rol no está definido
  if (loading || (!currentUser && !userProfile)) {
    return (
      <Center h="80vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }  // Si no hay usuario, redirigir al login
  if (!currentUser || !userProfile) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('ProtectedRoute - Redirigiendo a login: sin usuario autenticado');
    }
    return <Navigate to={redirectTo} replace />;
  }
  
  // Si el usuario no tiene los permisos necesarios
  if (!hasPermission) {
    const redirectPath = getRutaPorRol(userProfile.rol);
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`ProtectedRoute - Redirigiendo a ${redirectPath}: rol no permitido`);
    }
    return <Navigate to={redirectPath} replace />;
  }
  
  // Acceso permitido (log solo una vez por sesión de ruta)
  return <>{children}</>;
};

export default ProtectedRoute;