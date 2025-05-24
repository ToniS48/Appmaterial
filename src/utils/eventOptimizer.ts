// Optimizador de eventos para prevenir violaciones de rendimiento
// Proporciona hooks y utilidades para manejar eventos de forma eficiente

import { useCallback, useRef } from 'react';

interface EventOptimizationConfig {
  throttleDelay: number;
  debounceDelay: number;
  maxExecutionTime: number;
}

const DEFAULT_CONFIG: EventOptimizationConfig = {
  throttleDelay: 100,
  debounceDelay: 300,
  maxExecutionTime: 50
};

/**
 * Hook para crear handlers de click optimizados que evitan violaciones
 */
export function useOptimizedClickHandler<T extends any[]>(
  handler: (...args: T) => void | Promise<void>,
  config: Partial<EventOptimizationConfig> = {}
) {
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const lastExecutionRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: T) => {
    const now = performance.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;

    // Throttle: evitar ejecuciones muy frecuentes
    if (timeSinceLastExecution < configRef.current.throttleDelay) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        executeOptimizedHandler(handler, args);
        lastExecutionRef.current = performance.now();
      }, configRef.current.throttleDelay - timeSinceLastExecution);
      
      return;
    }

    executeOptimizedHandler(handler, args);
    lastExecutionRef.current = now;
  }, [handler]);
}

/**
 * Ejecuta un handler de forma optimizada usando requestIdleCallback cuando es posible
 */
function executeOptimizedHandler<T extends any[]>(
  handler: (...args: T) => void | Promise<void>,
  args: T
) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(async (deadline) => {
      if (deadline.timeRemaining() > DEFAULT_CONFIG.maxExecutionTime) {
        await executeHandler(handler, args);
      } else {
        // Diferir la ejecución si no hay tiempo suficiente
        setTimeout(() => executeHandler(handler, args), 0);
      }
    });
  } else {
    // Fallback para navegadores sin requestIdleCallback
    setTimeout(() => executeHandler(handler, args), 0);
  }
}

/**
 * Ejecuta el handler con manejo de errores
 */
async function executeHandler<T extends any[]>(
  handler: (...args: T) => void | Promise<void>,
  args: T
) {
  const startTime = performance.now();
  
  try {
    await handler(...args);
    
    const executionTime = performance.now() - startTime;
    if (executionTime > DEFAULT_CONFIG.maxExecutionTime) {
      console.warn(`Handler ejecutado en ${executionTime}ms (límite: ${DEFAULT_CONFIG.maxExecutionTime}ms)`);
    }
  } catch (error) {
    console.error('Error en handler optimizado:', error);
  }
}

/**
 * Hook para crear handlers de cambio optimizados (para inputs, selects, etc.)
 */
export function useOptimizedChangeHandler<T>(
  handler: (value: T) => void,
  config: Partial<EventOptimizationConfig> = {}
) {
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((value: T) => {
    // Debounce: evitar demasiadas actualizaciones mientras el usuario escribe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      executeOptimizedHandler(handler, [value]);
    }, configRef.current.debounceDelay);
  }, [handler]);
}

/**
 * Hook para optimizar handlers de scroll
 */
export function useOptimizedScrollHandler(
  handler: (event: Event) => void,
  config: Partial<EventOptimizationConfig> = {}
) {
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const lastExecutionRef = useRef<number>(0);
  const isScheduledRef = useRef<boolean>(false);

  return useCallback((event: Event) => {
    if (isScheduledRef.current) {
      return;
    }

    const now = performance.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;

    if (timeSinceLastExecution < configRef.current.throttleDelay) {
      isScheduledRef.current = true;
      
      if ('requestAnimationFrame' in window) {
        requestAnimationFrame(() => {
          handler(event);
          lastExecutionRef.current = performance.now();
          isScheduledRef.current = false;
        });
      } else {
        setTimeout(() => {
          handler(event);
          lastExecutionRef.current = performance.now();
          isScheduledRef.current = false;
        }, 16); // ~60fps
      }
      
      return;
    }

    handler(event);
    lastExecutionRef.current = now;
  }, [handler]);
}

/**
 * Utilidad para throttling de funciones
 */
export function throttle<T extends any[]>(
  func: (...args: T) => void,
  delay: number = DEFAULT_CONFIG.throttleDelay
): (...args: T) => void {
  let lastExecutionTime = 0;
  let timeoutId: NodeJS.Timeout;

  return function(...args: T) {
    const now = performance.now();
    const timeSinceLastExecution = now - lastExecutionTime;

    if (timeSinceLastExecution >= delay) {
      func(...args);
      lastExecutionTime = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecutionTime = performance.now();
      }, delay - timeSinceLastExecution);
    }
  };
}

/**
 * Utilidad para debouncing de funciones
 */
export function debounce<T extends any[]>(
  func: (...args: T) => void,
  delay: number = DEFAULT_CONFIG.debounceDelay
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;

  return function(...args: T) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Hook para optimizar handlers de formularios
 */
export function useOptimizedFormHandler<T extends Record<string, any>>(
  onSubmit: (data: T) => void | Promise<void>,
  config: Partial<EventOptimizationConfig> = {}
) {
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });

  return useCallback((data: T) => {
    // Validar que no haya una submisión muy reciente
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        await executeHandler(onSubmit, [data]);
      });
    } else {
      setTimeout(() => executeHandler(onSubmit, [data]), 0);
    }
  }, [onSubmit]);
}

/**
 * Optimiza eventos de búsqueda/filtrado
 */
export function useOptimizedSearchHandler(
  searchHandler: (query: string) => void,
  config: Partial<EventOptimizationConfig> = {}
) {
  const configRef = useRef({ 
    ...DEFAULT_CONFIG, 
    debounceDelay: 500, // Mayor delay para búsquedas
    ...config 
  });
  
  return useOptimizedChangeHandler(searchHandler, configRef.current);
}

/**
 * Hook para optimizar handlers de input (combinación de change y search)
 */
export function useOptimizedInputHandler(
  handler: (value: string) => void,
  config: Partial<EventOptimizationConfig> = {}
) {
  const configRef = useRef({ 
    ...DEFAULT_CONFIG, 
    debounceDelay: 300, // Delay moderado para inputs
    ...config 
  });
  
  return useOptimizedChangeHandler(handler, configRef.current);
}
