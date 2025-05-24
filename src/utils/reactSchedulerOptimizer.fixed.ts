/**
 * Utilidades específicas para optimizar y prevenir violaciones de 'message' en scheduler.development.js
 */
import { useEffect } from 'react';

/**
 * Número de intentos máximos para validar debounce
 */
const MAX_VALIDATION_RETRIES = 3;

/**
 * Ajustar la forma en que se manejan los eventos del scheduler de React
 * para evitar violaciones de tiempo cuando se crean actividades.
 * 
 * Esta función debe ejecutarse lo antes posible cuando se carga el componente que
 * tiene problemas con las violaciones de [Violation] 'message' handler took
 */
export function setupSchedulerOptimizer(): () => void {
  // Solo ejecutar en desarrollo
  if (process.env.NODE_ENV !== 'development') return () => {};

  // Modificar el comportamiento del scheduler
  if (typeof window !== 'undefined') {
    // Variables para tracking del estado original
    const originalMessageEvent = window.onmessage;
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalSetTimeout = window.setTimeout;
    
    // Reemplazar el manejador de mensajes global
    const optimizedMessageHandler = (ev: MessageEvent<any>) => {
      // Usar MessageChannel para diferir el procesamiento a otro hilo
      // Esto evita bloquear el hilo principal y las violaciones
      const channel = new MessageChannel();
      
      channel.port1.onmessage = () => {
        if (originalMessageEvent && typeof originalMessageEvent === 'function') {
          // Llamar al handler original en el contexto adecuado
          originalMessageEvent.apply(window as Window, [ev]);
        }
      };
      
      // Postear un mensaje vacío para activar el handler en otro hilo
      channel.port2.postMessage(undefined);
    };
    
    // Asignar el handler optimizado
    window.onmessage = optimizedMessageHandler;
    
    // Interceptar addEventListener para optimizar los message handlers
    EventTarget.prototype.addEventListener = function(
      this: EventTarget,
      type: string, 
      listener: EventListenerOrEventListenerObject | null, 
      options?: boolean | AddEventListenerOptions
    ): void {
      if (type === 'message' && listener && typeof listener === 'function') {
        const optimizedListener = function(this: any, event: Event) {
          // Aplazar el procesamiento de los mensajes usando RAF + Promise
          requestAnimationFrame(() => {
            Promise.resolve().then(() => {
              if (listener && typeof listener === 'function') {
                listener.call(this, event);
              }
            });
          });
        };
        return originalAddEventListener.call(this, type, optimizedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
      // Optimizar los temporizadores que React Scheduler usa internamente
    // TypeScript no puede inferir correctamente el tipo, por lo que primero
    // definimos la función y luego la asignamos con el tipo correcto
    const enhancedSetTimeout = (
      handler: Function | string, 
      timeout?: number | undefined, 
      ...args: any[]
    ): number => {
      // Si detectamos una llamada de 0ms desde el scheduler,
      // aumentamos el tiempo para evitar violaciones
      let timeoutDelay = timeout || 0;
      if (timeoutDelay === 0) {
        const stack = new Error().stack || '';
        if (stack.includes('scheduler') || stack.includes('performWorkUntilDeadline')) {
          timeoutDelay = 4; // Un valor más alto que 1ms para mejor prevención de violaciones
        }
      }
      
      // Para funciones, las envolvemos en optimizaciones
      if (typeof handler === 'function') {
        const wrappedCallback = function() {
          if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => {
              if (typeof handler === 'function') {
                handler.apply(null, args);
              }
            }, { timeout: 50 });
          } else {
            requestAnimationFrame(() => {
              if (typeof handler === 'function') {
                handler.apply(null, args);
              }
            });
          }
        };
        
        return originalSetTimeout(wrappedCallback, timeoutDelay);
      }
      
      // Para cadenas (código a evaluar)
      return originalSetTimeout(handler, timeoutDelay);
    }
    
    // Asignar la función optimizada a window.setTimeout con el tipo correcto
    window.setTimeout = enhancedSetTimeout as typeof window.setTimeout;
    
    // Función para revertir todas las modificaciones cuando se desmonta el componente
    return function cleanupSchedulerOptimizer() {
      window.onmessage = originalMessageEvent;
      EventTarget.prototype.addEventListener = originalAddEventListener;
      window.setTimeout = originalSetTimeout;
      console.log('Optimizaciones del scheduler limpiadas correctamente');
    };
  }
  
  return () => {}; // Devolver función noop si window no está definido
}

/**
 * Optimiza la validación de formularios para evitar bloquear la UI
 * y causar violaciones del scheduler
 * @param validationFn Función de validación original
 * @returns Función de validación optimizada
 */
export function createOptimizedValidator<T>(
  validationFn: (data: T) => boolean,
): (data: T) => Promise<boolean> {
  return async (data: T): Promise<boolean> => {
    return new Promise((resolve) => {
      // Planificar la validación para el siguiente frame de animación
      requestAnimationFrame(() => {
        try {
          const isValid = validationFn(data);
          resolve(isValid);
        } catch (error) {
          console.error('Error during validation:', error);
          resolve(false);
        }
      });
    });
  };
}

/**
 * Optimiza los cambios de pestaña que pueden generar violaciones
 * al validar datos o realizar transiciones de UI
 * @param changeTabFn Función original para cambiar de pestaña
 * @returns Función optimizada
 */
export function optimizeTabChange(
  changeTabFn: (index: number) => void
): (index: number) => Promise<void> {
  return (newIndex: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Usar MessageChannel para planificar el cambio de manera asincrónica
        // Esta técnica evita específicamente las violaciones de 'message' handler
        const channel = new MessageChannel();
        
        // Establecer un timeout de seguridad por si el MessageChannel falla
        const safetyTimeout = setTimeout(() => {
          try {
            // Plan B: Intentar con un enfoque más simple si MessageChannel falla
            requestAnimationFrame(() => {
              try {
                changeTabFn(newIndex);
                resolve();
              } catch (error) {
                console.error('Error en el fallback del cambio de pestaña:', error);
                reject(error);
              }
            });
          } catch (error) {
            console.error('Error en el timeout de seguridad:', error);
            reject(error);
          }
        }, 300);
        
        channel.port1.onmessage = () => {
          clearTimeout(safetyTimeout); // Limpiar el timeout de seguridad
          // Ejecutar el cambio de pestaña con triple barrera para evitar violaciones:
          // 1. Promise.resolve para microtask queue
          // 2. requestAnimationFrame para sincronizar con el frame
          // 3. setTimeout para salir del ciclo actual
          Promise.resolve().then(() => {
            requestAnimationFrame(() => {
              try {
                changeTabFn(newIndex);
                
                // Esperar un poco antes de resolver para dar tiempo al DOM de actualizarse
                // y prevenir problemas de sincronización con los efectos de la UI
                setTimeout(() => {
                  resolve();
                }, 20);
              } catch (error) {
                console.error('Error durante el cambio de pestaña:', error);
                reject(error);
              }
            });
          });
        };
        
        // Enviar mensaje para programar el cambio
        channel.port2.postMessage(null);
      } catch (error) {
        reject(error);
      }
    });
  };
}

/**
 * Hook para usar el optimizador del scheduler en componentes React
 * @param options Opciones de configuración
 */
export function useSchedulerOptimizer(options?: { enabled?: boolean }) {
  useEffect(() => {
    // Solo activar si está explícitamente habilitado o no se proporciona la opción
    const shouldEnable = options?.enabled ?? true;
    
    let cleanup = () => {};
    if (shouldEnable) {
      cleanup = setupSchedulerOptimizer();
    }
    
    return () => {
      cleanup();
    };
  }, [options?.enabled]);
}
