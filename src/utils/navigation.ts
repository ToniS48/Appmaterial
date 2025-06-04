// Utilidades básicas de navegación
import { RolUsuario } from '../types/usuario';

// Rutas por rol
const ROL_ROUTES: Record<RolUsuario, string> = {
  'admin': '/admin',
  'vocal': '/vocal',
  'socio': '/socio',
  'invitado': '/dashboard'
};

/**
 * Obtiene la ruta para un rol específico
 */
export const getRouteForRole = (rol: RolUsuario): string => {
  if (rol in ROL_ROUTES) {
    return ROL_ROUTES[rol as RolUsuario];
  }
  
  return '/dashboard'; // ruta por defecto
};

interface NavigationOptions {
  fallbackRoute?: string;
  replace?: boolean;
  forceRedirect?: boolean;
}

/**
 * Navega a una ruta específica con opciones
 */
export const navigateToRoute = (
  route: string,
  options: NavigationOptions = {}
): void => {
  try {
    const { fallbackRoute = '/dashboard', replace = false } = options;
    
    if (typeof window !== 'undefined') {
      if (replace) {
        window.location.replace(route || fallbackRoute);
      } else {
        window.location.href = route || fallbackRoute;
      }
    }
  } catch (error) {
    console.error('Error al navegar:', error);
  }
};

/**
 * Alias para compatibilidad
 */
export const getRutaPorRol = (rol: RolUsuario): string => {
  return getRouteForRole(rol);
};

/**
 * Navega al usuario según su rol
 */
export const navigateByUserRole = (rol: RolUsuario, navigate: (path: string) => void): void => {
  const path = getRutaPorRol(rol);
  navigate(path);
};

export {};
