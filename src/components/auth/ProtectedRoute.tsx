import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Actualizar la interfaz para incluir children
interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode; // Añadir la propiedad children
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, 
  children, 
  redirectTo = '/login' 
}) => {
  const { userProfile, isLoading } = useAuth();
  
  // Mostrar loading o nada mientras se carga el perfil
  if (isLoading) {
    return null; // O un componente de carga
  }
  
  // Redireccionar si no hay usuario o no tiene el rol permitido
  if (!userProfile || !allowedRoles.includes(userProfile.rol)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Renderizar el contenido si está autorizado
  return <>{children}</>;
};

export default ProtectedRoute;