// Optimizador simplificado del scheduler de React
// Enfoque minimalista para reducir violaciones sin complejidad excesiva

/**
 * Configuración simplificada del optimizador
 * Retorna null para evitar optimizaciones complejas que puedan causar problemas
 */
export function setupSchedulerOptimizer(): (() => void) | null {
  // Deshabilitado para evitar violaciones adicionales
  return null;
}

/**
 * Optimización simplificada para cambios de tab
 */
export function optimizeTabChange(callback: () => void): void {
  // Ejecutar de forma diferida para no bloquear el hilo principal
  setTimeout(callback, 0);
}

/**
 * Utilidad para procesar arrays grandes en chunks (simplificada)
 */
export function processInChunks<T, R>(
  array: T[],
  processor: (chunk: T[]) => R[],
  chunkSize: number = 5
): Promise<R[]> {
  return new Promise((resolve) => {
    const results: R[] = [];
    let index = 0;

    function processChunk() {
      const chunk = array.slice(index, index + chunkSize);
      if (chunk.length === 0) {
        resolve(results);
        return;
      }

      try {
        const chunkResults = processor(chunk);
        results.push(...chunkResults);
        index += chunkSize;

        // Procesar siguiente chunk de forma asíncrona
        setTimeout(processChunk, 0);
      } catch (error) {
        console.warn('Error procesando chunk:', error);
        resolve(results);
      }
    }

    processChunk();
  });
}

/**
 * Throttle simplificado para eventos
 */
export function createThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  let lastCall = 0;
  
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return callback(...args);
    }
  }) as T;
}

/**
 * Debounce simplificado para validaciones
 */
export function createDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  }) as T;
}

/**
 * Validator optimizado simplificado
 */
export function createOptimizedValidator<T>(
  validationFn: (data: T) => boolean,
): (data: T) => Promise<boolean> {
  return async (data: T): Promise<boolean> => {
    return new Promise((resolve) => {
      // Validación diferida simple
      setTimeout(() => {
        try {
          const isValid = validationFn(data);
          resolve(isValid);
        } catch (error) {
          console.warn('Error during validation:', error);
          resolve(false);
        }
      }, 0);
    });
  };
}