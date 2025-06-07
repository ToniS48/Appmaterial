import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDeferredInitializationProps {
  delay?: number;
  condition?: boolean;
}

/**
 * Hook para diferir la inicialización de componentes pesados
 * y evitar violaciones de rendimiento en el renderizado inicial
 */
export function useDeferredInitialization({ 
  delay = 100, 
  condition = true 
}: UseDeferredInitializationProps = {}) {
  const [isReady, setIsReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (condition && !isReady) {
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Diferir la inicialización
      timeoutRef.current = setTimeout(() => {
        setIsReady(true);
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [condition, delay, isReady]);

  // Función para forzar la inicialización inmediata
  const forceReady = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsReady(true);
  }, []);

  // Función para resetear el estado
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsReady(false);
  }, []);

  return {
    isReady,
    forceReady,
    reset
  };
}

/**
 * Hook para diferir operaciones que pueden causar violaciones de rendimiento
 */
export function useDeferredOperation() {
  const operationQueue = useRef<Array<() => void>>([]);
  const isProcessing = useRef(false);

  const defer = useCallback((operation: () => void, delay = 0) => {
    operationQueue.current.push(operation);

    if (!isProcessing.current) {
      isProcessing.current = true;
      
      setTimeout(() => {
        // Procesar todas las operaciones encoladas
        while (operationQueue.current.length > 0) {
          const op = operationQueue.current.shift();
          if (op) {
            try {
              op();
            } catch (error) {
              console.error('Error en operación diferida:', error);
            }
          }
        }
        isProcessing.current = false;
      }, delay);
    }
  }, []);

  const immediate = useCallback((operation: () => void) => {
    try {
      operation();
    } catch (error) {
      console.error('Error en operación inmediata:', error);
    }
  }, []);

  return {
    defer,
    immediate
  };
}

export default useDeferredInitialization;
