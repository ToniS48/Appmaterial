// Utilidades de rendimiento para optimizar operaciones y evitar violaciones del scheduler
// Proporciona funciones para diferir, particionar y optimizar operaciones costosas

interface PerformanceConfig {
  maxChunkSize: number;
  maxExecutionTime: number;
  idleTimeout: number;
  frameTimeout: number;
}

const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  maxChunkSize: 100,
  maxExecutionTime: 50, // 50ms para mantener 60fps
  idleTimeout: 16,
  frameTimeout: 16
};

/**
 * Diferir una operación para evitar bloquear el hilo principal
 * Utiliza requestIdleCallback cuando está disponible, setTimeout como fallback
 */
export async function deferCallback<T>(
  operation: () => T | Promise<T>,
  config: Partial<PerformanceConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };

  return new Promise((resolve, reject) => {
    const executeOperation = async () => {
      const startTime = performance.now();
      
      try {
        const result = await operation();
        
        const executionTime = performance.now() - startTime;
        if (executionTime > finalConfig.maxExecutionTime) {
          console.warn(`Operación diferida ejecutada en ${executionTime}ms (límite: ${finalConfig.maxExecutionTime}ms)`);
        }
        
        resolve(result);
      } catch (error) {
        console.error('Error en operación diferida:', error);
        reject(error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback((deadline) => {
        if (deadline.timeRemaining() > finalConfig.idleTimeout) {
          executeOperation();
        } else {
          // Si no hay tiempo suficiente, programar para el siguiente frame
          setTimeout(executeOperation, 0);
        }
      });
    } else {
      // Fallback para navegadores sin requestIdleCallback
      setTimeout(executeOperation, 0);
    }
  });
}

/**
 * Procesar un array grande en chunks para evitar bloquear el UI
 */
export async function processArrayInChunks<T, R>(
  array: T[],
  processor: (item: T, index: number, array: T[]) => R,
  config: Partial<PerformanceConfig> = {}
): Promise<R[]> {
  const finalConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
  const results: R[] = [];
  
  for (let i = 0; i < array.length; i += finalConfig.maxChunkSize) {
    const chunk = array.slice(i, i + finalConfig.maxChunkSize);
    
    await deferCallback(() => {
      chunk.forEach((item, localIndex) => {
        const globalIndex = i + localIndex;
        results[globalIndex] = processor(item, globalIndex, array);
      });
    });
  }
  
  return results;
}

/**
 * Ejecutar múltiples operaciones asíncronas con control de rendimiento
 */
export async function batchAsyncOperations<T>(
  operations: (() => Promise<T>)[],
  config: Partial<PerformanceConfig> = {}
): Promise<T[]> {
  const finalConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += finalConfig.maxChunkSize) {
    const batch = operations.slice(i, i + finalConfig.maxChunkSize);
    
    const batchResults = await deferCallback(async () => {
      return Promise.all(batch.map(op => op()));
    });
    
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Optimizar operaciones DOM para evitar layout thrashing
 */
export function optimizeDOMUpdates(updates: (() => void)[]): Promise<void> {
  return new Promise((resolve) => {
    if ('requestAnimationFrame' in window) {
      requestAnimationFrame(() => {
        updates.forEach(update => {
          try {
            update();
          } catch (error) {
            console.warn('Error en actualización DOM:', error);
          }
        });
        resolve();
      });
    } else {
      setTimeout(() => {
        updates.forEach(update => {
          try {
            update();
          } catch (error) {
            console.warn('Error en actualización DOM:', error);
          }
        });
        resolve();
      }, DEFAULT_PERFORMANCE_CONFIG.frameTimeout);
    }
  });
}

/**
 * Medir y reportar el rendimiento de una operación
 */
export async function measurePerformance<T>(
  operation: () => T | Promise<T>,
  operationName: string = 'Operación'
): Promise<T> {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  try {
    const result = await operation();
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const executionTime = endTime - startTime;
    const memoryDelta = endMemory - startMemory;
    
    if (executionTime > DEFAULT_PERFORMANCE_CONFIG.maxExecutionTime) {
      console.warn(`${operationName} tardó ${executionTime.toFixed(2)}ms (memoria: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    console.error(`${operationName} falló después de ${executionTime.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Crear un pool de workers para operaciones pesadas (cuando Web Workers están disponibles)
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private available: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(
    private workerScript: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new Worker(this.workerScript);
        this.workers.push(worker);
        this.available.push(worker);
      } catch (error) {
        console.warn('No se pudo crear worker:', error);
      }
    }
  }

  async execute<T, R>(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (this.available.length > 0) {
        this.processWithWorker(data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  private processWithWorker<T, R>(
    data: T,
    resolve: (value: R) => void,
    reject: (error: any) => void
  ) {
    const worker = this.available.pop()!;
    
    const handleMessage = (event: MessageEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      
      this.available.push(worker);
      this.processQueue();
      resolve(event.data);
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      
      this.available.push(worker);
      this.processQueue();
      reject(error);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage(data);
  }

  private processQueue() {
    if (this.queue.length > 0 && this.available.length > 0) {
      const { data, resolve, reject } = this.queue.shift()!;
      this.processWithWorker(data, resolve, reject);
    }
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.available = [];
    this.queue = [];
  }
}

/**
 * Utilidad para throttling avanzado con cancelación
 */
export class AdvancedThrottle {
  private lastExecution = 0;
  private timeout: NodeJS.Timeout | null = null;
  private cancelled = false;

  constructor(private delay: number) {}

  execute<T extends any[]>(fn: (...args: T) => void, ...args: T): void {
    const now = performance.now();
    const timeSinceLastExecution = now - this.lastExecution;

    if (this.cancelled) return;

    if (timeSinceLastExecution >= this.delay) {
      fn(...args);
      this.lastExecution = now;
    } else {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      this.timeout = setTimeout(() => {
        if (!this.cancelled) {
          fn(...args);
          this.lastExecution = performance.now();
        }
      }, this.delay - timeSinceLastExecution);
    }
  }

  cancel(): void {
    this.cancelled = true;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  reset(): void {
    this.cancelled = false;
    this.lastExecution = 0;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

/**
 * Monitor de rendimiento en tiempo real
 */
export class PerformanceMonitor {
  private metrics: Array<{
    timestamp: number;
    operation: string;
    duration: number;
    memory?: number;
  }> = [];

  private maxMetrics = 1000;

  logOperation(operation: string, duration: number, memory?: number): void {
    this.metrics.push({
      timestamp: performance.now(),
      operation,
      duration,
      memory
    });

    // Mantener solo las métricas más recientes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Alertar sobre operaciones lentas
    if (duration > DEFAULT_PERFORMANCE_CONFIG.maxExecutionTime) {
      console.warn(`Operación lenta detectada: ${operation} (${duration.toFixed(2)}ms)`);
    }
  }

  getAverageExecutionTime(operation?: string): number {
    const relevantMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / relevantMetrics.length;
  }

  getSlowOperations(threshold: number = DEFAULT_PERFORMANCE_CONFIG.maxExecutionTime): typeof this.metrics {
    return this.metrics.filter(metric => metric.duration > threshold);
  }

  clear(): void {
    this.metrics = [];
  }
}

// Instancia global del monitor de rendimiento
export const performanceMonitor = new PerformanceMonitor();
