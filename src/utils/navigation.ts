import { NavigateFunction } from 'react-router-dom';
import { Usuario, RolUsuario } from '../types/usuario';

/**
 * Mapa de rutas por rol de usuario
 */
export const ROL_ROUTES: Record<RolUsuario, string> = {
  admin: '/admin',
  vocal: '/vocal',
  socio: '/socio',
  invitado: '/invitado'  // Antes era "/usuario"
};

// Mapa de rutas de gestión de usuario por rol
export const USER_MANAGEMENT_ROUTES: Record<string, string> = {
  admin: '/admin/usuarios',
  vocal: '/vocal/usuarios', // Añadimos ruta para gestión de usuarios por vocales
};

/**
 * Verifica si un rol tiene permisos para gestionar usuarios
 * @param rol - Rol del usuario
 * @returns boolean indicando si tiene permisos
 */
export const hasUserManagementPermission = (rol?: RolUsuario): boolean => {
  return rol === 'admin' || rol === 'vocal';
};

/**
 * Obtiene la ruta para un rol específico
 * @param rol - Rol del usuario
 * @returns Ruta correspondiente al rol
 */
export const getRutaPorRol = (rol?: RolUsuario): string => {
  if (!rol || !ROL_ROUTES[rol]) {
    return '/login';
  }
  return ROL_ROUTES[rol];
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