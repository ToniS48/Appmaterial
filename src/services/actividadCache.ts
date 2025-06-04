
import { Actividad } from '../types/actividad';

// Clase para gestionar el caché de actividades
class ActividadCache {
  private cache: Map<string, Actividad> = new Map();
  private listCache: Map<string, Actividad[]> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutos en milisegundos
  private lastListFetch: Map<string, number> = new Map();
  
  // Guardar una actividad en caché
  setActividad(id: string, actividad: Actividad): void {
    this.cache.set(id, actividad);
  }
  
  // Obtener una actividad de caché
  getActividad(id: string): Actividad | undefined {
    return this.cache.get(id);
  }
  
  // Guardar lista de actividades por clave (ejemplo: estados)
  setActividadesList(key: string, actividades: Actividad[]): void {
    this.listCache.set(key, actividades);
    this.lastListFetch.set(key, Date.now());
    
    // Guardar cada actividad individualmente también
    actividades.forEach(actividad => {
      if (actividad.id) {
        this.cache.set(actividad.id, actividad);
      }
    });
  }
  
  // Obtener lista de actividades por clave
  getActividadesList(key: string): Actividad[] | undefined {
    const lastFetch = this.lastListFetch.get(key);
    
    // Verificar si el caché ha expirado
    if (lastFetch && (Date.now() - lastFetch > this.ttl)) {
      this.listCache.delete(key);
      this.lastListFetch.delete(key);
      return undefined;
    }
    
    return this.listCache.get(key);
  }
  
  // Limpiar caché
  clear(): void {
    this.cache.clear();
    this.listCache.clear();
    this.lastListFetch.clear();
  }
}

export const actividadCache = new ActividadCache();