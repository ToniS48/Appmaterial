/**
 * Cache simple para optimizar consultas duplicadas
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 30000; // 30 segundos por defecto

  /**
   * Obtiene datos del cache si están disponibles y no han expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Verificar si ha expirado
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Guarda datos en el cache con TTL opcional
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  /**
   * Invalida una entrada del cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Wrapper para consultas que implementa cache automático
   */
  async query<T>(
    key: string, 
    queryFn: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Intentar obtener del cache primero
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`📦 Cache HIT para ${key}`);
      return cached;
    }

    // Si no está en cache, ejecutar la consulta
    console.log(`🔍 Cache MISS para ${key} - ejecutando consulta`);
    const result = await queryFn();
    
    // Guardar en cache
    this.set(key, result, ttl);
    
    return result;
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): { entries: number; keys: string[] } {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instancia singleton
export const queryCache = new QueryCache();

// Claves de cache predefinidas
export const CACHE_KEYS = {
  ESTADISTICAS_USUARIOS: 'estadisticas:usuarios',
  ESTADISTICAS_PRESTAMOS: 'estadisticas:prestamos', 
  ESTADISTICAS_MATERIALES: 'estadisticas:materiales',
  ESTADISTICAS_ACTIVIDADES: 'estadisticas:actividades',
  MATERIALES_DISPONIBLES: 'materiales:disponibles',
  USUARIOS_LISTA: 'usuarios:lista',
  PRESTAMOS_ACTIVOS: 'prestamos:activos',
  USUARIOS: 'usuarios',
  PRESTAMOS: 'prestamos',
  MATERIALES: 'materiales'
} as const;
