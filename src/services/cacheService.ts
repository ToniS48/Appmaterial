import { logger } from '../utils/loggerUtils';

interface CacheOptions {
  ttl?: number; // Time to live en milisegundos
  storageType?: 'memory' | 'local' | 'session';
  namespace?: string;
  maxSize?: number; // Número máximo de entradas
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class AdvancedCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private options: Required<CacheOptions>;
  private storageKey: string;
  
  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutos por defecto
      storageType: options.storageType || 'memory',
      namespace: options.namespace || 'app_cache',
      maxSize: options.maxSize || 100
    };
    
    this.storageKey = `${this.options.namespace}_cache`;
    
    // Cargar caché desde almacenamiento persistente si corresponde
    if (this.options.storageType !== 'memory') {
      this.loadFromStorage();
    }
    
    // Configurar limpieza periódica
    setInterval(() => this.cleanup(), 60000); // Limpiar cada minuto
  }
  
  /**
   * Obtiene un valor de la caché
   */
  get(key: string): T | null {
    const cacheKey = this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Verificar expiración
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.value;
  }
  
  /**
   * Almacena un valor en la caché
   */
  set(key: string, value: T, ttl?: number): void {
    const cacheKey = this.getCacheKey(key);
    const timestamp = Date.now();
    const actualTtl = ttl || this.options.ttl;
    
    this.cache.set(cacheKey, {
      value,
      timestamp,
      expiresAt: timestamp + actualTtl,
      accessCount: 0,
      lastAccessed: timestamp
    });
    
    // Si excedemos el tamaño máximo, eliminar las entradas menos usadas
    if (this.cache.size > this.options.maxSize) {
      this.evictLeastUsed();
    }
    
    // Persistir si es necesario
    if (this.options.storageType !== 'memory') {
      this.saveToStorage();
    }
  }
  
  /**
   * Verifica si una clave existe y no ha expirado
   */
  has(key: string): boolean {
    const cacheKey = this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return false;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return false;
    }
    
    return true;
  }
  
  /**
   * Elimina una entrada específica de la caché
   */
  delete(key: string): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.delete(cacheKey);
    
    if (this.options.storageType !== 'memory') {
      this.saveToStorage();
    }
  }
  
  /**
   * Invalida todas las entradas de caché que coincidan con un patrón
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    
    // Usar Array.from para convertir las claves a un array antes de iterar
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    
    if (this.options.storageType !== 'memory') {
      this.saveToStorage();
    }
    
    logger.debug(`Invalidadas ${this.cache.size} entradas de caché con patrón: ${pattern}`);
  }
  
  /**
   * Limpia toda la caché
   */
  clear(): void {
    this.cache.clear();
    
    if (this.options.storageType !== 'memory') {
      this.clearStorage();
    }
    
    logger.debug('Caché completamente limpiada');
  }
  
  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    // Usar Array.from para convertir las entradas a un array antes de iterar
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0 && this.options.storageType !== 'memory') {
      this.saveToStorage();
      logger.debug(`Limpieza de caché: eliminadas ${expiredCount} entradas expiradas`);
    }
  }
  
  /**
   * Desaloja las entradas menos usadas cuando se alcanza el tamaño máximo
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por conteo de acceso (menor primero) y luego por último acceso (más antiguo primero)
    entries.sort((a, b) => {
      const accessDiff = a[1].accessCount - b[1].accessCount;
      if (accessDiff !== 0) return accessDiff;
      return a[1].lastAccessed - b[1].lastAccessed;
    });
    
    // Eliminar el 20% de las entradas menos usadas
    const toRemove = Math.ceil(this.options.maxSize * 0.2);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    logger.debug(`Caché: desalojadas ${toRemove} entradas por límite de tamaño`);
  }
    /**
   * Obtiene estadísticas de la caché
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      storageType: this.options.storageType,
      namespace: this.options.namespace,
      ttl: this.options.ttl
    };
  }

  /**
   * Genera una clave normalizada para la caché
   */
  private getCacheKey(key: string): string {
    return `${this.options.namespace}_${key}`;
  }
  
  /**
   * Carga la caché desde almacenamiento persistente
   */
  private loadFromStorage(): void {
    try {
      const storage = this.options.storageType === 'local' ? localStorage : sessionStorage;
      const data = storage.getItem(this.storageKey);
      
      if (data) {
        const parsed = JSON.parse(data);
        this.cache = new Map(Object.entries(parsed));
        this.cleanup(); // Limpiar entradas expiradas inmediatamente
      }
    } catch (error) {
      logger.error('Error al cargar caché desde almacenamiento:', error);
      // Fallback a caché vacía
      this.cache = new Map();
    }
  }
  
  /**
   * Guarda la caché en almacenamiento persistente
   */
  private saveToStorage(): void {
    try {
      const storage = this.options.storageType === 'local' ? localStorage : sessionStorage;
      const data = Object.fromEntries(this.cache.entries());
      storage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('Error al guardar caché en almacenamiento:', error);
    }
  }
  
  /**
   * Limpia el almacenamiento persistente
   */
  private clearStorage(): void {
    try {
      const storage = this.options.storageType === 'local' ? localStorage : sessionStorage;
      storage.removeItem(this.storageKey);
    } catch (error) {
      logger.error('Error al limpiar caché del almacenamiento:', error);
    }
  }
}

// Exportar instancias para diferentes entidades
export const actividadCache = new AdvancedCache({ namespace: 'actividad' });
export const materialCache = new AdvancedCache({ namespace: 'material' });
export const usuarioCache = new AdvancedCache({ namespace: 'usuario' });
