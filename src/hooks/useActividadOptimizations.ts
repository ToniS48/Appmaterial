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
