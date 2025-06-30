/**
 * Utilidades para manejo dinámico de campos en entidades
 * Permite agregar campos nuevos sin romper el código existente
 */

import { 
  completeUsuario, 
  completeActividad, 
  completeMaterial, 
  completeEntity,
  DEFAULT_VALUES 
} from './FirestoreConverters';

// Re-exportar las funciones principales
export {
  completeUsuario,
  completeActividad,
  completeMaterial,
  completeEntity,
  DEFAULT_VALUES
};

/**
 * Middleware para usar en hooks y servicios que manejan entidades
 * Automáticamente completa campos faltantes antes de procesar
 */
export class EntityCompleter {
  
  /**
   * Aplica valores por defecto a un usuario antes de procesarlo
   */
  static usuario(usuario: any): any {
    if (!usuario) return usuario;
    return completeUsuario(usuario);
  }
  
  /**
   * Aplica valores por defecto a una actividad antes de procesarla
   */
  static actividad(actividad: any): any {
    if (!actividad) return actividad;
    return completeActividad(actividad);
  }
  
  /**
   * Aplica valores por defecto a un material antes de procesarlo
   */
  static material(material: any): any {
    if (!material) return material;
    return completeMaterial(material);
  }
  
  /**
   * Aplica valores por defecto a una lista de entidades
   */
  static list<T>(
    entities: T[], 
    entityType: 'usuario' | 'actividad' | 'material'
  ): T[] {
    return entities.map(entity => completeEntity(entity, entityType));
  }
}

/**
 * Función helper para usar en formularios - completa campos automáticamente
 */
export const withDefaults = <T>(
  data: Partial<T>, 
  entityType: 'usuario' | 'actividad' | 'material'
): T => {
  return completeEntity(data, entityType);
};

/**
 * Hook-like function para completar datos en tiempo real
 */
export const useEntityDefaults = () => {
  return {
    completeUsuario: EntityCompleter.usuario,
    completeActividad: EntityCompleter.actividad,
    completeMaterial: EntityCompleter.material,
    completeList: EntityCompleter.list,
    withDefaults
  };
};
