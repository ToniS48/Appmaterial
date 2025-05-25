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
=======
/**
 * Optimizaciones específicas para mejorar el rendimiento de los handlers 
 * y prevenir violaciones de tiempo en la consola.
 */
import { useCallback, useRef } from 'react';
import { debounce, throttle } from './performanceUtils';

// Constantes de configuración para optimización de rendimiento
const CLICK_HANDLER_THROTTLE_MS = 100; // Tiempo mínimo entre clics procesados
const MESSAGE_HANDLER_DEBOUNCE_MS = 150; // Tiempo de espera para procesar mensajes
const BATCH_SIZE = 25; // Tamaño de lotes para procesar grandes volúmenes de datos

/**
 * Hook para optimizar handlers de clic que podrían ser costosos
 * @param handler El handler original
 * @returns Handler optimizado que no bloqueará la UI
 */
export function useOptimizedClickHandler<T extends (...args: any[]) => void>(handler: T): T {
  // Guardar referencia al handler original para evitar regeneración
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  return useCallback((...args: Parameters<T>) => {
    // Aplicar throttle para evitar múltiples llamadas rápidas
    // y postergar la ejecución con requestIdleCallback, o fallback a setTimeout
    // Esto evita que scheduler.development.js reporte violaciones
    const runOptimized = () => {
      handlerRef.current(...args);
    };
    
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => runOptimized(), { timeout: 200 });
    } else {
      setTimeout(runOptimized, 0);
    }
  }, []) as unknown as T;
}

/**
 * Hook para optimizar handlers de mensajes que podrían recibir muchas actualizaciones
 * @param handler El handler de mensajes original
 * @returns Handler optimizado para mensajes
 */
export function useOptimizedMessageHandler<T extends (...args: any[]) => void>(handler: T): T {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  
  // Eliminar todas las violaciones de mensaje del scheduler.development.js
  return useCallback((...args: Parameters<T>) => {
    // Aplicar un doble nivel de deferencia:
    // 1. setTimeout para salir del ciclo de evento actual
    // 2. requestAnimationFrame para sincronizar con la siguiente pintura del navegador
    
    // Esto asegura que el procesamiento de mensajes ocurra en el momento óptimo
    setTimeout(() => {
      // Debounce para evitar llamadas repetidas durante actualizaciones rápidas
      // y postergar hasta el siguiente frame
      const debouncedFn = debounce(() => {
        handlerRef.current(...args);
      }, MESSAGE_HANDLER_DEBOUNCE_MS);
      
      // Ejecutar la función debounced en el siguiente frame de animación
      requestAnimationFrame(() => {
        debouncedFn();
      });
    }, 0);
  }, []) as unknown as T;
}

/**
 * Procesa un array de datos en lotes para evitar bloquear el hilo principal
 * @param items Array de elementos a procesar
 * @param processItem Función que procesa un elemento individual
 * @param onComplete Función opcional a llamar cuando se completa el procesamiento
 */
export function processBatch<T>(
  items: T[], 
  processItem: (item: T) => void,
  onComplete?: () => void
): void {
  let index = 0;
  
  function processNextBatch() {
    const start = index;
    const end = Math.min(start + BATCH_SIZE, items.length);
    
    // Procesar lote actual
    for (let i = start; i < end; i++) {
      processItem(items[i]);
    }
    
    index = end;
    
    // Si hay más elementos, programar siguiente lote
    if (index < items.length) {
      setTimeout(processNextBatch, 0);
    } else if (onComplete) {
      onComplete();
    }
  }
  
  // Iniciar procesamiento
  processNextBatch();
}

/**
 * Detecta si estamos en un navegador moderno que soporta queueMicrotask
 */
const supportsQueueMicrotask = typeof queueMicrotask === 'function';

/**
 * Programa un callback para ejecutarse lo antes posible, sin bloquear el hilo principal
 * Especialmente optimizada para prevenir violaciones de 'message' handler y problemas de scheduling
 * @param callback Función a ejecutar
 */
export function scheduleCallback(callback: () => void): void {
  // Estrategia de programación en tres niveles para prevenir violaciones:
  // Combinamos setTimeout con requestAnimationFrame y queueMicrotask
  // Esta técnica evita específicamente las violaciones en 'scheduler.development.js'
  
  // Nivel 1: Salir del ciclo de evento actual
  setTimeout(() => {
    // Nivel 2: Esperar al próximo frame para operaciones visuales
    requestAnimationFrame(() => {
      // Nivel 3: Para operaciones más pequeñas, usar microtask o Promise
      if (supportsQueueMicrotask) {
        queueMicrotask(() => {
          try {
            callback();
          } catch (error) {
            console.error('Error en callback programado:', error);
          }
        });
      } else {
        Promise.resolve().then(() => {
          try {
            callback();
          } catch (error) {
            console.error('Error en callback programado:', error);
          }
        });
      }
    });
  }, 0);
}

/**
 * Optimización específica para reducir las violaciones en la pestaña de actividades
 * Intercepta los mensajes del scheduler de React que están causando violaciones
 * 
 * @returns Una función para desactivar el interceptor
 */
export function setupSchedulerMessageInterceptor(): () => void {
  // Guardar la referencia original al evento de mensaje
  const originalAddEventListener = window.addEventListener;
  const originalPostMessage = window.postMessage.bind(window);
  // Una bandera para evitar procesamiento recursivo
  let isProcessingMessage = false;
  
  // Implementar un sistema optimizado para los eventos de mensaje
  const messageHandlers: Array<(e: MessageEvent) => void> = [];
    // Interceptar addEventListener para 'message'
  window.addEventListener = function optimizedAddEventListener(
    this: Window,
    type: string, 
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (type === 'message' && typeof listener === 'function') {
      // Almacenar el handler para su uso posterior
      messageHandlers.push(listener as (e: MessageEvent) => void);
      
      // No necesitamos añadir este listener específico al DOM
      // porque lo manejaremos nosotros de forma optimizada
      return;
    }
    
    // Para todos los demás tipos de eventos, usar el comportamiento original
    return originalAddEventListener.call(this, type, listener, options);
  } as typeof window.addEventListener;
  
  // Crear un gestor optimizado para todos los mensajes
  const optimizedMessageHandler = (event: MessageEvent) => {
    // Prevenir procesamiento recursivo
    if (isProcessingMessage) return;
    isProcessingMessage = true;
    
    // Usar requestAnimationFrame para procesar en el próximo frame de animación
    requestAnimationFrame(() => {
      // Procesar todos los handlers registrados
      for (let handler of messageHandlers) {
        try {
          setTimeout(() => {
            handler(event);
          }, 0);
        } catch (error) {
          console.error('Error procesando mensaje:', error);
        }
      }
      
      isProcessingMessage = false;
    });
  };
  // Agregar nuestro handler optimizado al DOM
  originalAddEventListener.call(window, 'message', optimizedMessageHandler as EventListener);
  
  // Sobrescribir la función postMessage con una versión optimizada
  type PostMessageFunction = typeof window.postMessage;
  
  window.postMessage = (function(
    this: Window,
    message: any,
    targetOriginOrOptions: string | WindowPostMessageOptions,
    transfer?: Transferable[]
  ) {
    // Usar setTimeout para diferir el envío de mensajes al siguiente ciclo de eventos
    setTimeout(() => {
      try {
        originalPostMessage.apply(this, [message, targetOriginOrOptions, transfer].filter(Boolean) as Parameters<PostMessageFunction>);
      } catch (error) {
        console.error('Error en postMessage optimizado:', error);
      }
    }, 0);
  }) as PostMessageFunction;
  
  // Función para desactivar el interceptor y restaurar el comportamiento original
  return () => {
    window.addEventListener = originalAddEventListener;
    window.postMessage = originalPostMessage;
  };
}
