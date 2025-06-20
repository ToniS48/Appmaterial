/**
 * Hook para manejo inteligente de datos con lazy loading y cache optimizado para 4G
 * Carga datos solo cuando son necesarios y los mantiene en cache
 * Integrado con NetworkOptimization para ajustar configuración según conexión
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AdvancedCache } from '../services/cacheService';
import { networkOptimization } from '../services/networkOptimization';

interface LazyDataOptions<T> {
  /**
   * Función que carga los datos
   */
  loadFunction: () => Promise<T>;
  
  /**
   * Clave única para identificar los datos en cache
   */
  cacheKey: string;
  
  /**
   * Tiempo de vida del cache en milisegundos (default: 10 minutos)
   */
  cacheTTL?: number;
  
  /**
   * Si true, carga inmediatamente al montar el componente
   * Si false, carga solo cuando se llama explícitamente
   */
  loadOnMount?: boolean;
  
  /**
   * Tiempo de debounce para evitar llamadas múltiples (default: 300ms)
   */
  debounceTime?: number;
  
  /**
   * Callback ejecutado cuando los datos se cargan exitosamente
   */
  onSuccess?: (data: T) => void;
  
  /**
   * Callback ejecutado cuando hay un error
   */
  onError?: (error: Error) => void;
  
  /**
   * Si true, reintenta la carga automáticamente en caso de error
   */
  autoRetry?: boolean;
  
  /**
   * Número máximo de reintentos (default: 3)
   */
  maxRetries?: number;
}

interface LazyDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fromCache: boolean;
}

// Cache global para datos lazy
const lazyDataCache = new AdvancedCache<any>({
  ttl: 10 * 60 * 1000, // 10 minutos por defecto
  storageType: 'session', // Usar sessionStorage para persistencia durante la sesión
  maxSize: 100
});

/**
 * Hook para manejo inteligente de datos con lazy loading
 */
export function useLazyDataManager<T>(options: LazyDataOptions<T>) {
  const {
    loadFunction,
    cacheKey,
    cacheTTL = 10 * 60 * 1000, // 10 minutos por defecto
    loadOnMount = false,
    debounceTime = 300,
    onSuccess,
    onError,
    autoRetry = true,
    maxRetries = 3
  } = options;

  const [state, setState] = useState<LazyDataState<T>>({
    data: null,
    loading: false,
    error: null,
    loaded: false,
    fromCache: false
  });

  // Configuración dinámica basada en la red
  const [networkConfig, setNetworkConfig] = useState(networkOptimization.getCurrentConfig());

  const loadingRef = useRef(false);
  const retryCountRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Suscribirse a cambios de configuración de red
  useEffect(() => {
    const unsubscribe = networkOptimization.subscribe((config) => {
      setNetworkConfig(config);
      console.log('🔄 [useLazyDataManager] Network config updated:', config);
    });

    return unsubscribe;
  }, []);

  // Calcular valores ajustados por la red
  const adjustedCacheTTL = useMemo(() => {
    return cacheTTL * networkConfig.cacheMultiplier;
  }, [cacheTTL, networkConfig.cacheMultiplier]);

  const adjustedDebounceTime = useMemo(() => {
    return Math.max(debounceTime, networkConfig.debounceTime);
  }, [debounceTime, networkConfig.debounceTime]);

  /**
   * Carga los datos con cache y manejo de errores
   */
  const loadData = useCallback(async (force = false): Promise<T | null> => {
    // Evitar llamadas múltiples
    if (loadingRef.current && !force) {
      console.log(`⏳ [LazyData] Ya hay una carga en curso para ${cacheKey}`);
      return null;
    }

    // Verificar cache primero si no es una carga forzada
    if (!force) {
      const cached = lazyDataCache.get(cacheKey);
      if (cached) {
        console.log(`📦 [LazyData] Cache hit para ${cacheKey}`);
        setState(prev => ({
          ...prev,
          data: cached,
          loaded: true,
          fromCache: true,
          error: null
        }));
        onSuccess?.(cached);
        return cached;
      }
    }

    loadingRef.current = true;
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      fromCache: false
    }));

    try {
      console.log(`🔄 [LazyData] Cargando datos para ${cacheKey}...`);
      const data = await loadFunction();
        // Guardar en cache con TTL ajustado por la red
      lazyDataCache.set(cacheKey, data, adjustedCacheTTL);
      
      setState(prev => ({
        ...prev,
        data,
        loading: false,
        loaded: true,
        error: null,
        fromCache: false
      }));

      retryCountRef.current = 0; // Reset contador de reintentos
      onSuccess?.(data);
      
      console.log(`✅ [LazyData] Datos cargados exitosamente para ${cacheKey}`);
      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ [LazyData] Error cargando ${cacheKey}:`, error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));

      // Auto-retry si está habilitado
      if (autoRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000); // Exponential backoff
        
        console.log(`🔄 [LazyData] Reintentando en ${retryDelay}ms (intento ${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          loadData(force);
        }, retryDelay);
      }

      return null;
    } finally {
      loadingRef.current = false;
    }
  }, [loadFunction, cacheKey, cacheTTL, onSuccess, onError, autoRetry, maxRetries]);
  /**
   * Carga los datos con debounce para evitar llamadas excesivas
   */
  const debouncedLoad = useCallback((force = false) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      loadData(force);
    }, adjustedDebounceTime); // Usar el tiempo ajustado por la red
  }, [loadData, adjustedDebounceTime]);

  /**
   * Fuerza la recarga de datos ignorando el cache
   */
  const forceReload = useCallback(() => {
    console.log(`🔄 [LazyData] Forzando recarga para ${cacheKey}`);
    loadData(true);
  }, [loadData, cacheKey]);

  /**
   * Limpia los datos del cache
   */
  const clearCache = useCallback(() => {
    lazyDataCache.delete(cacheKey);
    console.log(`🧹 [LazyData] Cache limpiado para ${cacheKey}`);
  }, [cacheKey]);
  /**
   * Precargar datos en background (sin mostrar loading)
   */
  const preload = useCallback(() => {
    if (!state.loaded && !loadingRef.current) {
      const cached = lazyDataCache.get(cacheKey);
      if (!cached) {
        console.log(`⏳ [LazyData] Precargando datos para ${cacheKey}`);
        loadFunction().then(data => {
          lazyDataCache.set(cacheKey, data, adjustedCacheTTL); // Usar TTL ajustado
        }).catch(error => {
          console.warn(`⚠️ [LazyData] Error precargando ${cacheKey}:`, error);
        });
      }
    }
  }, [loadFunction, cacheKey, adjustedCacheTTL, state.loaded]);

  // Cargar al montar si está configurado
  useEffect(() => {
    if (loadOnMount) {
      debouncedLoad();
    }
  }, [loadOnMount, debouncedLoad]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    data: state.data,
    loading: state.loading,
    error: state.error,
    loaded: state.loaded,
    fromCache: state.fromCache,
    
    // Funciones
    load: debouncedLoad,
    forceReload,
    clearCache,
    preload,
    
    // Estado del cache
    hasCachedData: lazyDataCache.has(cacheKey),
    
    // Información de debug
    cacheKey,
    retryCount: retryCountRef.current
  };
}

/**
 * Hook especializado para datos que se cargan bajo demanda
 */
export function useOnDemandData<T>(options: Omit<LazyDataOptions<T>, 'loadOnMount'>) {
  return useLazyDataManager({
    ...options,
    loadOnMount: false
  });
}

/**
 * Hook especializado para datos que se precargan
 */
export function usePreloadedData<T>(options: Omit<LazyDataOptions<T>, 'loadOnMount'>) {
  return useLazyDataManager({
    ...options,
    loadOnMount: true
  });
}

/**
 * Utilidad para limpiar todo el cache de lazy data
 */
export function clearAllLazyCache() {
  lazyDataCache.clear();
  console.log('🧹 [LazyData] Todo el cache lazy limpiado');
}

/**
 * Utilidad para obtener estadísticas del cache
 */
export function getLazyCacheStats() {
  return lazyDataCache.getStats();
}
