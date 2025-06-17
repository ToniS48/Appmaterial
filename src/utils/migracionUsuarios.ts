/**
 * Utilidades de migración para el sistema de seguimiento de usuarios
 * Proporciona compatibilidad hacia atrás durante la transición de 'activo' a los nuevos estados
 */
import { Usuario } from '../types/usuario';
import { EstadoAprobacion, EstadoActividad } from '../types/usuarioHistorial';

/**
 * Obtiene el estado "activo" legacy basado en los nuevos estados
 * Un usuario se considera "activo" si está aprobado Y activo en actividades
 */
export function getEstadoActivoLegacy(usuario: Usuario): boolean {
  return usuario.estadoAprobacion === EstadoAprobacion.APROBADO && 
         usuario.estadoActividad === EstadoActividad.ACTIVO;
}

/**
 * Extiende temporalmente el tipo Usuario con el campo activo legacy
 * SOLO para migración - debe eliminarse cuando se complete la migración
 */
export interface UsuarioConActivoLegacy extends Usuario {
  activo: boolean;
}

/**
 * Convierte un Usuario a UsuarioConActivoLegacy agregando el campo activo calculado
 */
export function agregarActivoLegacy(usuario: Usuario): UsuarioConActivoLegacy {
  return {
    ...usuario,
    activo: getEstadoActivoLegacy(usuario)
  };
}

/**
 * Convierte una lista de usuarios agregando el campo activo legacy
 */
export function agregarActivoLegacyLista(usuarios: Usuario[]): UsuarioConActivoLegacy[] {
  return usuarios.map(agregarActivoLegacy);
}

/**
 * Establece los nuevos estados basado en el valor activo legacy
 * Para usar en formularios que aún manejan el campo activo
 */
export function setEstadosDesdeActivoLegacy(
  activo: boolean, 
  usuario?: Partial<Usuario>
): { estadoAprobacion: EstadoAprobacion; estadoActividad: EstadoActividad } {
  if (activo) {
    return {
      estadoAprobacion: EstadoAprobacion.APROBADO,
      estadoActividad: EstadoActividad.ACTIVO
    };
  } else {
    // Si era inactivo, mantener como pendiente por defecto
    return {
      estadoAprobacion: usuario?.estadoAprobacion || EstadoAprobacion.PENDIENTE,
      estadoActividad: EstadoActividad.INACTIVO
    };
  }
}
