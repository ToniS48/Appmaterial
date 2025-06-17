// Utilidades básicas para rendimiento

/**
 * Función de debounce básica
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Función de throttle básica
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Función básica de logging
 */
export const logger = {
  debug: (message: string, ...params: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, ...params);
    }
  },
  error: (message: string, ...params: any[]) => {
    console.error(message, ...params);
  }
};

/**
 * Defiiere la ejecución de un callback usando requestAnimationFrame
 */
export const deferCallback = (callback: () => void): void => {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 0);
  }
};

/**
 * Crea un validador optimizado que utiliza debounce para reducir la carga
 */
export const createOptimizedValidator = <T>(
  validator: (data: T) => boolean | Promise<boolean>
) => {
  const debouncedValidator = debounce(validator, 300);
  
  return (data: T) => {
    try {
      return debouncedValidator(data);
    } catch (error) {
      logger.error('Error en validación optimizada:', error);
      return false;
    }
  };
};

/**
 * Función de logging segura que maneja errores
 */
export const safeLog = (message: string, data?: any): void => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, data);
    }
  } catch (error) {
    // Ignorar errores de logging para evitar cascadas de errores
  }
};

/**
 * Procesa arrays grandes en chunks para evitar bloquear el hilo principal
 */
export const processDataInChunks = async <T, R>(
  data: T[],
  processor: (chunk: T[]) => Promise<R[]> | R[],
  chunkSize: number = 100,
  yieldInterval: number = 0
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
    
    // Yield al scheduler para no bloquear el hilo principal
    if (yieldInterval >= 0) {
      await new Promise(resolve => setTimeout(resolve, yieldInterval));
    }
  }
  
  return results;
};

/**
 * Procesa datos de forma síncrona en chunks con yields
 */
export const processDataSync = async <T>(
  data: T[],
  processor: (item: T, index: number) => void,
  chunkSize: number = 50
): Promise<void> => {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    chunk.forEach((item, localIndex) => {
      processor(item, i + localIndex);
    });
    
    // Yield al scheduler
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

/**
 * Cache simple con TTL
 */
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs: number = 10 * 60 * 1000) { // 10 minutos por defecto
    this.ttl = ttlMs;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
