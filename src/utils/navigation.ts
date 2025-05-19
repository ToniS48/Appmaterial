import { NavigateFunction } from 'react-router-dom';
import { Usuario, RolUsuario } from '../types/usuario';

// Mapeo de roles a rutas (dashboard)
export const ROL_ROUTES: Record<RolUsuario, string> = {
  admin: '/admin',
  vocal: '/vocal',
  socio: '/socio',
  invitado: '/invitado'  // Asegurar consistencia con la ruta en AppRoutes
};

/**
 * Obtiene la ruta correspondiente al rol del usuario
 * @param rol Rol del usuario
 * @returns Ruta correspondiente al dashboard de ese rol
 */
export const getRutaPorRol = (rol: string): string => {
  if (rol in ROL_ROUTES) {
    return ROL_ROUTES[rol as RolUsuario];
  }
  return '/login'; // Default fallback
};

/**
 * Navegación basada en rol de usuario
 * @param navigate - Función de navegación de React Router
 * @param userProfile - Perfil del usuario
 * @param options - Opciones adicionales de configuración
 */
export const navigateByUserRole = (
  navigate: NavigateFunction,
  userProfile: Usuario | null,
  options: {
    fallbackRoute?: string;
    replace?: boolean;
    forceRedirect?: boolean;
  } = {}
): void => {
  const { 
    fallbackRoute = '/login',
    replace = true,
    forceRedirect = false
  } = options;
  
  if (!userProfile) {
    navigate(fallbackRoute, { replace });
    return;
  }
  
  const targetRoute = ROL_ROUTES[userProfile.rol] || fallbackRoute;
  
  // Si forceRedirect es true, siempre navega aunque esté en la misma ruta
  if (forceRedirect) {
    navigate(targetRoute, { replace });
  } else {
    // Evitar navegación circular si ya está en la ruta correcta
    const currentPath = window.location.pathname;
    if (currentPath !== targetRoute) {
      navigate(targetRoute, { replace });
    }
  }
};