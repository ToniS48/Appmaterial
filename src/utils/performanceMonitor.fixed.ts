/**
 * Utilidad para monitorizar el rendimiento de la aplicación
 * y detectar violaciones de tiempo en la consola
 */
import { useEffect } from 'react';

// Tipos para el monitor de rendimiento
interface PerformanceViolation {
  timestamp: number;
  duration: number;
  type: string;
  source: string;
  message?: string;
}

interface PerformanceMonitorOptions {
  logToConsole?: boolean;
  captureStackTrace?: boolean;
  onViolation?: (violation: PerformanceViolation) => void;
}

/**
 * Clase para monitorizar el rendimiento y las violaciones
 */
class PerformanceMonitor {
  private violations: PerformanceViolation[] = [];
  private isMonitoring: boolean = false;
  private observer: PerformanceObserver | null = null;
  private options: PerformanceMonitorOptions = {
    logToConsole: true,
    captureStackTrace: false
  };
  
  /**
   * Iniciar la monitorización de rendimiento
   */
  public start(options?: PerformanceMonitorOptions): void {
    if (this.isMonitoring) {
      console.warn('El monitor de rendimiento ya está activo');
      return;
    }
    
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    try {
      // Observar tareas largas (bloqueos del hilo principal)
      this.observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.recordViolation({
            timestamp: performance.now(),
            duration: entry.duration,
            type: 'longtask',
            source: entry.name,
          });
        }
      });
      
      this.observer.observe({ entryTypes: ['longtask'] });
      
      // Interceptar console.error para detectar violaciones de scheduler
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        const errorMessage = args.join(' ');
        if (errorMessage.includes('[Violation]') && errorMessage.includes('handler took')) {
          const durationMatch = errorMessage.match(/(\d+)ms/);
          const duration = durationMatch ? parseInt(durationMatch[1], 10) : 0;
          
          this.recordViolation({
            timestamp: performance.now(),
            duration,
            type: 'scheduler',
            source: 'console.error',
            message: errorMessage
          });
        }
        
        originalConsoleError.apply(console, args);
      };
      
      this.isMonitoring = true;
      
      if (this.options.logToConsole) {
        console.log('Monitor de rendimiento iniciado');
      }
    } catch (error) {
      console.error('Error al iniciar el monitor de rendimiento:', error);
    }
  }
  
  /**
   * Detener la monitorización
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.isMonitoring = false;
    
    if (this.options.logToConsole) {
      console.log('Monitor de rendimiento detenido');
    }
  }
  
  /**
   * Registrar una violación de rendimiento
   */
  private recordViolation(violation: PerformanceViolation): void {
    this.violations.push(violation);
    
    if (this.options.logToConsole) {
      console.warn(`[Rendimiento] Violación detectada: ${violation.type} - ${violation.duration.toFixed(2)}ms`);
    }
    
    if (this.options.onViolation) {
      this.options.onViolation(violation);
    }
  }
  
  /**
   * Obtener un resumen de las violaciones registradas
   */
  public getViolationSummary(): { count: number, averageDuration: number, maxDuration: number, byType: Record<string, number> } {
    const count = this.violations.length;
    
    if (count === 0) {
      return {
        count: 0,
        averageDuration: 0,
        maxDuration: 0,
        byType: {}
      };
    }
    
    const totalDuration = this.violations.reduce((sum, v) => sum + v.duration, 0);
    const maxDuration = Math.max(...this.violations.map(v => v.duration));
    const byType: Record<string, number> = {};
    
    this.violations.forEach(v => {
      byType[v.type] = (byType[v.type] || 0) + 1;
    });
    
    return {
      count,
      averageDuration: totalDuration / count,
      maxDuration,
      byType
    };
  }
  
  /**
   * Limpiar las violaciones registradas
   */
  public clearViolations(): void {
    this.violations = [];
  }
}

// Singleton para usar en toda la aplicación
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook para usar el monitor de rendimiento en componentes React
 */
export function usePerformanceMonitor(options?: PerformanceMonitorOptions) {
  useEffect(() => {
    performanceMonitor.start(options);
    
    return () => {
      performanceMonitor.stop();
    };
  }, []);
  
  return performanceMonitor;
}
