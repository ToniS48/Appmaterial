/**
 * Utilidades para optimizar el rendimiento y evitar violaciones de tiempo en la consola
 */
import { useRef, useEffect, useCallback } from 'react';

/**
 * Determina si estamos en modo desarrollo
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Desactiva los logs de depuración en producción
 * @param message El mensaje a mostrar
 * @param params Parámetros adicionales
 */
export const safeLog = (message: string, ...params: any[]): void => {
  if (isDevelopment) {
    console.log(message, ...params);
  }
};

/**
 * Desactiva los logs de error en producción
 * @param message El mensaje a mostrar
 * @param params Parámetros adicionales
 */
export const safeError = (message: string, ...params: any[]): void => {
  if (isDevelopment) {
    console.error(message, ...params);
  } else {
    // En producción, podríamos enviar errores a un servicio de monitoreo
  }
};

/**
 * Envuelve un callback para asegurar que no consume demasiado tiempo
 * y previene múltiples ejecuciones rápidas
 * 
 * @param callback La función a ejecutar
 * @param delay Tiempo mínimo entre ejecuciones (ms)
 * @returns Función envuelta con protección
 */
export const debounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Hook personalizado para crear una versión debounce de una función
 * que persiste entre renderizados
 * 
 * @param callback La función a debounce
 * @param delay Tiempo de espera en ms
 * @returns Función con debounce
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  const callbackRef = useRef(callback);
  
  // Actualizar la referencia cuando cambia el callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay),
    [delay]
  );
};

/**
 * Envuelve un callback para ejecutarlo en el siguiente ciclo del event loop,
 * sacándolo del hilo principal para evitar bloqueos de UI
 * 
 * @param callback Función a ejecutar
 * @returns Función envuelta para ejecución diferida
 */
export const deferCallback = <T extends (...args: any[]) => any>(
  callback: T
): ((...args: Parameters<T>) => void) => {
  return (...args: Parameters<T>) => {
    setTimeout(() => {
      callback(...args);
    }, 0);
  };
};

/**
 * Comprueba si un elemento es visible en el viewport
 * para optimizar renderizados
 * 
 * @param element Elemento a comprobar
 * @returns boolean indicando si es visible
 */
export const isElementVisible = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Crea un objeto memoizado que solo se recalcula cuando sus dependencias cambian
 * Útil para prevenir recreaciones innecesarias de objetos en renders
 * 
 * @param factory Función que crea el objeto
 * @param deps Dependencias que determinan si se recalcula
 * @returns Objeto memoizado
 */
export function useMemoizedObject<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; obj: T; initialized: boolean }>({
    deps: [],
    obj: {} as T,
    initialized: false
  });

  if (
    !ref.current.initialized ||
    ref.current.deps.length !== deps.length ||
    ref.current.deps.some((dep, i) => deps[i] !== dep)
  ) {
    ref.current.deps = deps;
    ref.current.obj = factory();
    ref.current.initialized = true;
  }

  return ref.current.obj;
}

/**
 * Limita la frecuencia de ejecución de una función
 * @param callback Función a ejecutar
 * @param limit Límite en ms
 * @returns Función throttled
 */
export const throttle = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 300
): ((...args: Parameters<T>) => void) => {
  let waiting = false;
  let lastArgs: Parameters<T> | null = null;
  
  const timeoutFunc = () => {
    if (lastArgs === null) {
      waiting = false;
    } else {
      callback(...lastArgs);
      lastArgs = null;
      setTimeout(timeoutFunc, limit);
    }
  };
  
  return (...args: Parameters<T>) => {
    if (waiting) {
      lastArgs = args;
      return;
    }
    
    callback(...args);
    waiting = true;
    
    setTimeout(timeoutFunc, limit);
  };
};

/**
 * Desactiva todos los logs de la consola en producción
 */
export const disableConsoleInProduction = (): void => {
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    console.warn = () => {};
    // Mantener console.error para errores críticos
  }
};
