/**
 * Índice de repositorios - Exportación centralizada
 * Proporciona instancias singleton de todos los repositorios
 */

import { BaseRepository } from './BaseRepository';
import { ActividadRepository } from './ActividadRepository';
import { MaterialRepository } from './MaterialRepository'; 
import { PrestamoRepository } from './PrestamoRepository';
import { UsuarioRepository } from './UsuarioRepository';

// Re-exportar las clases
export { BaseRepository } from './BaseRepository';
export { ActividadRepository } from './ActividadRepository';
export { MaterialRepository } from './MaterialRepository'; 
export { PrestamoRepository } from './PrestamoRepository';
export { UsuarioRepository } from './UsuarioRepository';

// Instancias singleton para uso en la aplicación
export const actividadRepository = new ActividadRepository();
export const materialRepository = new MaterialRepository();
export const prestamoRepository = new PrestamoRepository();
export const usuarioRepository = new UsuarioRepository();

// Tipo para el mapa de repositorios
export type RepositoryMap = {
  actividad: ActividadRepository;
  material: MaterialRepository;
  prestamo: PrestamoRepository;
  usuario: UsuarioRepository;
};

// Mapa de repositorios para acceso dinámico
export const repositories: RepositoryMap = {
  actividad: actividadRepository,
  material: materialRepository,
  prestamo: prestamoRepository,
  usuario: usuarioRepository
};

// Función para limpiar caché de todos los repositorios
export const clearAllRepositoryCaches = (): void => {
  Object.values(repositories).forEach(repo => repo.clearCache());
};
