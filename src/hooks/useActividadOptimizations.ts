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
