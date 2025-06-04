// Utilidades básicas para rendimiento

/**
 * Función de debounce básica
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Función de throttle básica
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Función básica de logging
 */
export const logger = {
  debug: (message: string, ...params: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, ...params);
    }
  },
  error: (message: string, ...params: any[]) => {
    console.error(message, ...params);
  }
};

/**
 * Defiiere la ejecución de un callback usando requestAnimationFrame
 */
export const deferCallback = (callback: () => void): void => {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 0);
  }
};

/**
 * Crea un validador optimizado que utiliza debounce para reducir la carga
 */
export const createOptimizedValidator = <T>(
  validator: (data: T) => boolean | Promise<boolean>
) => {
  const debouncedValidator = debounce(validator, 300);
  
  return (data: T) => {
    try {
      return debouncedValidator(data);
    } catch (error) {
      logger.error('Error en validación optimizada:', error);
      return false;
    }
  };
};

/**
 * Función de logging segura que maneja errores
 */
export const safeLog = (message: string, data?: any): void => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, data);
    }
  } catch (error) {
    // Ignorar errores de logging para evitar cascadas de errores
  }
};
