import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';
import { getRutaPorRol } from '../../utils/navigation';

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
  const { userProfile, loading } = useAuth(); // Cambiado isLoading por loading
  const location = useLocation();
  
  // Log único al renderizar
  const logInfo = () => {
    console.log(`ProtectedRoute - Ruta: ${location.pathname}, Rol: ${userProfile?.rol}, Permitidos: ${allowedRoles.join(', ')}`);
  };
  
  // Solo mostrar spinner durante la carga inicial
  if (loading) { // Usando loading en lugar de isLoading
    logInfo();
    return (
      <Center h="80vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }
  
  // Si no hay usuario, redirigir al login
  if (!userProfile) {
    logInfo();
    console.log('ProtectedRoute - Redirigiendo a login: sin usuario autenticado');
    return <Navigate to={redirectTo} replace />;
  }
  
  // Si el usuario no tiene los permisos necesarios
  if (!allowedRoles.includes(userProfile.rol)) {
    logInfo();
    const redirectPath = getRutaPorRol(userProfile.rol);
    console.log(`ProtectedRoute - Redirigiendo a ${redirectPath}: rol no permitido`);
    return <Navigate to={redirectPath} replace />;
  }
  
  // Acceso permitido
  logInfo();
  console.log('ProtectedRoute - Acceso permitido');
  return <>{children}</>;
};

export default ProtectedRoute;