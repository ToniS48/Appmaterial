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
    try {
      await deferCallback(saveOperation)();
      
      const executionTime = performance.now() - startTime;
      performanceMetrics.current.totalOperations++;
      performanceMetrics.current.averageExecutionTime = 
        (performanceMetrics.current.averageExecutionTime + executionTime) / 2;
      
      if (enableLogging) {
        console.log(`✅ Operación ${operationName} completada en ${executionTime.toFixed(2)}ms`);
      }
    } catch (error) {
      performanceMetrics.current.violationCount++;
      if (enableLogging) {
        console.error(`❌ Error en operación ${operationName}:`, error);
      }
      throw error;
    }
  }, [enableLogging]);

  // Optimización para cambios de pestañas
  const optimizedTabChange = useCallback((
    tabChangeHandler: (tab: string) => void,
    newTab: string
  ) => {
    deferCallback(() => tabChangeHandler(newTab))();
  }, []);

  // Optimización para actualizaciones de formulario
  const optimizedFormUpdate = useCallback((
    updateHandler: (data: any) => void,
    data: any
  ) => {
    deferCallback(() => updateHandler(data))();
  }, []);

  // Obtener métricas de rendimiento
  const getMetrics = useCallback(() => ({
    ...performanceMetrics.current
  }), []);

  // Resetear métricas
  const resetMetrics = useCallback(() => {
    performanceMetrics.current = {
      violationCount: 0,
      totalOperations: 0,
      averageExecutionTime: 0
    };
  }, []);

  return {
    optimizedSave,
    optimizedTabChange,
    optimizedFormUpdate,
    getMetrics,
    resetMetrics
  };
};

export default useActividadOptimizations;
