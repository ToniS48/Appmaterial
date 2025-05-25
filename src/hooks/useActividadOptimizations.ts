
// Hook personalizado para optimizaciones específicas de actividades
// Centraliza la lógica de optimización de rendimiento para componentes de actividades

import { useCallback, useRef, useMemo } from 'react';
import { deferCallback } from '../utils/performanceUtils';
import { useOptimizedClickHandler } from '../utils/eventOptimizer';

interface UseActividadOptimizationsConfig {
  throttleDelay?: number;
  deferredTimeout?: number;
  enableLogging?: boolean;
}

export const useActividadOptimizations = (config: UseActividadOptimizationsConfig = {}) => {
  const {
    throttleDelay = 300,
    deferredTimeout = 16,
    enableLogging = false
  } = config;

  const performanceMetrics = useRef({
    violationCount: 0,
    totalOperations: 0,
    averageExecutionTime: 0
  });

  // Optimización para operaciones de guardado
  const optimizedSave = useCallback(async (
    saveOperation: () => Promise<void>,
    operationName: string = 'save'
  ) => {
    const startTime = performance.now();
    performanceMetrics.current.totalOperations++;

    try {
      await deferCallback(saveOperation, { 
        maxExecutionTime: 100,
        idleTimeout: deferredTimeout 
      });
      
      const executionTime = performance.now() - startTime;
      performanceMetrics.current.averageExecutionTime = 
        (performanceMetrics.current.averageExecutionTime + executionTime) / 2;

      if (enableLogging) {
        console.log(`Operación ${operationName} completada en ${executionTime}ms`);
      }
    } catch (error) {
      performanceMetrics.current.violationCount++;
      console.error(`Error en operación optimizada ${operationName}:`, error);
      throw error;
    }
  }, [deferredTimeout, enableLogging]);

  // Optimización para navegación entre tabs
  const optimizedTabChange = useCallback((
    tabChangeOperation: (newIndex: number) => void,
    newIndex: number
  ) => {
    deferCallback(() => {
      tabChangeOperation(newIndex);
    }, { 
      maxExecutionTime: 50,
      idleTimeout: 8 
    });
  }, []);

  // Optimización para operaciones de carga
  const optimizedLoad = useCallback(async (
    loadOperation: () => Promise<any>,
    operationName: string = 'load'
  ) => {
    const startTime = performance.now();
    
    try {
      const result = await deferCallback(loadOperation, {
        maxExecutionTime: 200,
        idleTimeout: deferredTimeout
      });
      
      if (enableLogging) {
        const executionTime = performance.now() - startTime;
        console.log(`Carga ${operationName} completada en ${executionTime}ms`);
      }
      
      return result;
    } catch (error) {
      performanceMetrics.current.violationCount++;
      console.error(`Error en carga optimizada ${operationName}:`, error);
      throw error;
    }
  }, [deferredTimeout, enableLogging]);
  // Click handlers optimizados usando el optimizador de eventos
  const createOptimizedClickHandler = useCallback((
    handler: (...args: any[]) => void | Promise<void>,
    options: { throttle?: boolean; defer?: boolean } = {}
  ) => {
    return useOptimizedClickHandler(handler, {
      throttleDelay: options.throttle ? throttleDelay : 0,
      maxExecutionTime: 100
    });
  }, [throttleDelay]);

  // Métricas de rendimiento
  const getPerformanceMetrics = useCallback(() => {
    return {
      ...performanceMetrics.current,
      successRate: performanceMetrics.current.totalOperations > 0 
        ? ((performanceMetrics.current.totalOperations - performanceMetrics.current.violationCount) 
           / performanceMetrics.current.totalOperations) * 100 
        : 100
    };
  }, []);

  // Reset de métricas
  const resetMetrics = useCallback(() => {
    performanceMetrics.current = {
      violationCount: 0,
      totalOperations: 0,
      averageExecutionTime: 0
    };
  }, []);

  return useMemo(() => ({
    optimizedSave,
    optimizedTabChange,
    optimizedLoad,
    createOptimizedClickHandler,
    getPerformanceMetrics,
    resetMetrics
  }), [
    optimizedSave,
    optimizedTabChange,
    optimizedLoad,
    createOptimizedClickHandler,
    getPerformanceMetrics,
    resetMetrics
  ]);
};

export default useActividadOptimizations;

/**
 * Optimizaciones específicas para reducir violaciones en el scheduler de React
 * Este archivo contiene optimizaciones específicas para el componente de actividades
 */
import { useRef, useCallback } from 'react';
import { scheduleCallback } from '../utils/eventOptimizer';

/**
 * Hook personalizado para optimizar la creación de actividades
 * Previene las violaciones de 'message' handler en scheduler.development.js
 */
export function useActividadOptimizations() {
  // Referencias para evitar rerender
  const tabChangePromise = useRef<Promise<void> | null>(null);
  const resolveTabChange = useRef<() => void>(() => {});
  
  /**
   * Optimiza el cambio de pestañas para evitar violaciones
   */
  const handleTabChangeOptimized = useCallback((newTabIndex: number, changeTabFn: (index: number) => void) => {
    // Planificamos el cambio para el próximo ciclo de event loop
    scheduleCallback(() => {
      changeTabFn(newTabIndex);
    });
    
    // Creamos una promesa que se resolverá cuando se complete el cambio de pestaña
    tabChangePromise.current = new Promise<void>((resolve) => {
      resolveTabChange.current = resolve;
      
      // Auto-resolver después de un tiempo máximo por si hay algún problema
      setTimeout(resolve, 500);
    });
    
    return tabChangePromise.current;
  }, []);
  
  /**
   * Notificar que el cambio de pestaña se ha completado
   */
  const completeTabChange = useCallback(() => {
    resolveTabChange.current();
  }, []);
  
  /**
   * Optimiza las actualizaciones de datos que podrían causar violaciones
   */
  const scheduleDataUpdate = useCallback(<T extends (...args: any[]) => any>(
    updateFn: T,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      // Usar requestIdleCallback o setTimeout como fallback
      const execute = () => {
        try {
          const result = updateFn(...args);
          resolve(result as ReturnType<T>);
        } catch (error) {
          console.error('Error en actualización programada:', error);
          resolve(undefined as ReturnType<T>);
        }
      };
      
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => execute(), { timeout: 200 });
      } else {
        setTimeout(execute, 0);
      }
    });
  }, []);
  
  return {
    handleTabChangeOptimized,
    completeTabChange,
    scheduleDataUpdate,
  };
}

