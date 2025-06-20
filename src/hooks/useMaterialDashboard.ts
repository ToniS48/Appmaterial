/**
 * Hook especializado para el dashboard de materiales con optimizaciones específicas
 * Proporciona gestión inteligente de cache y carga bajo demanda
 * Integrado con NetworkOptimization para ajustar configuración según conexión
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLazyDataManager, useOnDemandData } from './useLazyDataManager';
import { materialHistorialService } from '../services/domain/MaterialHistorialService';
import { EstadisticasAnuales, EventoMaterial } from '../types/materialHistorial';
import { networkOptimization } from '../services/networkOptimization';

interface UseMaterialDashboardOptions {
  año: number;
  autoLoadStats?: boolean;
  cacheTimeout?: {
    stats: number;
    events: number;
    materials: number;
    comparison: number;
  };
}

interface MaterialDashboardData {
  // Gestores de datos
  statsManager: ReturnType<typeof useLazyDataManager>;
  eventsManager: ReturnType<typeof useOnDemandData>;
  materialsManager: ReturnType<typeof useOnDemandData>;
  comparisonManager: ReturnType<typeof useOnDemandData>;
  
  // Datos principales
  estadisticas: EstadisticasAnuales | null;
  eventos: EventoMaterial[] | null;
  materialesProblematicos: any[] | null;
  comparacion: any | null;
  
  // Estados de carga
  isLoadingAny: boolean;
  hasErrors: boolean;
  
  // Funciones
  preloadForTab: (tabIndex: number) => void;
  refreshYear: (newYear: number) => void;
  clearAllCache: () => void;
  
  // Información de rendimiento
  cacheInfo: {
    statsFromCache: boolean;
    eventsFromCache: boolean;
    materialsFromCache: boolean;
    comparisonFromCache: boolean;
  };
}

export function useMaterialDashboard(options: UseMaterialDashboardOptions): MaterialDashboardData {
  const {
    año,
    autoLoadStats = true,
    cacheTimeout = {
      stats: 5 * 60 * 1000,    // 5 minutos para estadísticas
      events: 3 * 60 * 1000,   // 3 minutos para eventos
      materials: 10 * 60 * 1000, // 10 minutos para materiales problemáticos
      comparison: 10 * 60 * 1000 // 10 minutos para comparaciones
    }
  } = options;

  // Configuración dinámica basada en la red
  const [networkConfig, setNetworkConfig] = useState(networkOptimization.getCurrentConfig());

  // Suscribirse a cambios de configuración de red
  useEffect(() => {
    const unsubscribe = networkOptimization.subscribe((config) => {
      setNetworkConfig(config);
      console.log('🔄 [useMaterialDashboard] Network config updated:', config);
    });

    return unsubscribe;
  }, []);

  // Calcular timeouts ajustados por la red
  const adjustedTimeouts = useMemo(() => {
    const multiplier = networkConfig.cacheMultiplier;
    return {
      stats: Math.round(cacheTimeout.stats * multiplier),
      events: Math.round(cacheTimeout.events * multiplier),
      materials: Math.round(cacheTimeout.materials * multiplier),
      comparison: Math.round(cacheTimeout.comparison * multiplier)
    };
  }, [cacheTimeout, networkConfig.cacheMultiplier]);

  // Gestores de datos con configuraciones específicas ajustadas por la red
  const statsManager = useLazyDataManager({
    loadFunction: () => materialHistorialService.obtenerEstadisticasAnuales(año),
    cacheKey: `material-stats-${año}`,
    cacheTTL: adjustedTimeouts.stats,
    loadOnMount: autoLoadStats,
    debounceTime: Math.max(100, networkConfig.debounceTime), // Respuesta más rápida para estadísticas principales
    autoRetry: true,
    maxRetries: 2
  });

  const eventsManager = useOnDemandData({
    loadFunction: () => materialHistorialService.obtenerHistorial({ 
      años: [año] 
    }).then(eventos => eventos.slice(0, networkConfig.batchSize || 20)), // Usar batch size dinámico
    cacheKey: `material-events-${año}`,
    cacheTTL: adjustedTimeouts.events,
    debounceTime: Math.max(200, networkConfig.debounceTime),
    autoRetry: true,
    maxRetries: 2
  });

  const materialsManager = useOnDemandData({
    loadFunction: () => materialHistorialService.obtenerMaterialesProblematicos(año, Math.min(10, networkConfig.batchSize || 10)),
    cacheKey: `material-problematic-${año}`,
    cacheTTL: adjustedTimeouts.materials,
    debounceTime: Math.max(300, networkConfig.debounceTime),
    autoRetry: true,
    maxRetries: 2
  });

  const comparisonManager = useOnDemandData({
    loadFunction: () => {
      if (año <= 2020) {
        return Promise.resolve(null);
      }
      return materialHistorialService.compararAños(año - 1, año);    },
    cacheKey: `material-comparison-${año}`,
    cacheTTL: adjustedTimeouts.comparison,
    debounceTime: Math.max(500, networkConfig.debounceTime),
    autoRetry: false, // No reintentar comparaciones automáticamente
    maxRetries: 1
  });
  // Función para precargar datos según la pestaña con optimización de red
  const preloadForTab = useCallback((tabIndex: number) => {
    // No precargar si la conexión es muy lenta
    if (!networkConfig.preloadNext) {
      console.log('🚫 [useMaterialDashboard] Precarga deshabilitada por conexión lenta');
      return;
    }

    switch (tabIndex) {
      case 0: // Resumen - no necesita precarga adicional
        break;
      case 1: // Gráficos - usar datos de estadísticas ya cargadas
        break;
      case 2: // Eventos
        if (!eventsManager.loaded && !eventsManager.loading) {
          console.log('⏳ [useMaterialDashboard] Precargando eventos para tab 2');
          eventsManager.preload();
        }
        break;
      case 3: // Materiales problemáticos
        if (!materialsManager.loaded && !materialsManager.loading) {
          console.log('⏳ [useMaterialDashboard] Precargando materiales problemáticos para tab 3');
          materialsManager.preload();
        }        break;
      case 4: // Comparación
        if (año > 2020 && !comparisonManager.loaded && !comparisonManager.loading) {
          console.log('⏳ [useMaterialDashboard] Precargando comparación para tab 4');
          comparisonManager.preload();
        }
        break;
      case 5: // Reportes - no necesita precarga
        break;
    }
  }, [año, eventsManager, materialsManager, comparisonManager, networkConfig.preloadNext]);

  // Función para refrescar datos de un nuevo año
  const refreshYear = useCallback((newYear: number) => {
    console.log(`🔄 [MaterialDashboard] Refreshing data for year: ${newYear}`);
    
    // Limpiar todos los caches
    statsManager.clearCache();
    eventsManager.clearCache();
    materialsManager.clearCache();
    comparisonManager.clearCache();
    
    // Las estadísticas se recargarán automáticamente debido al cambio de cacheKey
    // Los otros datos se cargarán bajo demanda
  }, [statsManager, eventsManager, materialsManager, comparisonManager]);

  // Función para limpiar todo el cache
  const clearAllCache = useCallback(() => {
    console.log('🧹 [MaterialDashboard] Clearing all cache');
    statsManager.clearCache();
    eventsManager.clearCache();
    materialsManager.clearCache();
    comparisonManager.clearCache();
  }, [statsManager, eventsManager, materialsManager, comparisonManager]);

  // Estados computados
  const isLoadingAny = useMemo(() => (
    statsManager.loading || 
    eventsManager.loading || 
    materialsManager.loading || 
    comparisonManager.loading
  ), [statsManager.loading, eventsManager.loading, materialsManager.loading, comparisonManager.loading]);

  const hasErrors = useMemo(() => (
    !!statsManager.error || 
    !!eventsManager.error || 
    !!materialsManager.error || 
    !!comparisonManager.error
  ), [statsManager.error, eventsManager.error, materialsManager.error, comparisonManager.error]);

  const cacheInfo = useMemo(() => ({
    statsFromCache: statsManager.fromCache,
    eventsFromCache: eventsManager.fromCache,
    materialsFromCache: materialsManager.fromCache,
    comparisonFromCache: comparisonManager.fromCache
  }), [
    statsManager.fromCache, 
    eventsManager.fromCache, 
    materialsManager.fromCache, 
    comparisonManager.fromCache
  ]);

  // Log de debug en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [MaterialDashboard] Cache Status:', {
        year: año,
        stats: { loaded: statsManager.loaded, cached: statsManager.fromCache },
        events: { loaded: eventsManager.loaded, cached: eventsManager.fromCache },
        materials: { loaded: materialsManager.loaded, cached: materialsManager.fromCache },
        comparison: { loaded: comparisonManager.loaded, cached: comparisonManager.fromCache }
      });
    }
  }, [año, statsManager, eventsManager, materialsManager, comparisonManager]);

  return {
    // Gestores
    statsManager,
    eventsManager,
    materialsManager,
    comparisonManager,
    
    // Datos
    estadisticas: statsManager.data,
    eventos: eventsManager.data,
    materialesProblematicos: materialsManager.data,
    comparacion: comparisonManager.data,
    
    // Estados
    isLoadingAny,
    hasErrors,
    
    // Funciones
    preloadForTab,
    refreshYear,
    clearAllCache,
    
    // Info
    cacheInfo
  };
}

/**
 * Hook simplificado para casos básicos
 */
export function useMaterialStats(año: number) {
  return useLazyDataManager({
    loadFunction: () => materialHistorialService.obtenerEstadisticasAnuales(año),
    cacheKey: `material-stats-simple-${año}`,
    cacheTTL: 5 * 60 * 1000,
    loadOnMount: true
  });
}

/**
 * Hook para precargar datos en background
 */
export function usePreloadMaterialData(años: number[]) {
  const preloadData = useCallback(async () => {
    const promises = años.map(año => 
      materialHistorialService.obtenerEstadisticasAnuales(año).catch(err => {
        console.warn(`Failed to preload data for year ${año}:`, err);
        return null;
      })
    );
    
    try {
      await Promise.allSettled(promises);
      console.log(`📦 [MaterialDashboard] Preloaded data for years: ${años.join(', ')}`);
    } catch (error) {
      console.warn('Error preloading material data:', error);
    }
  }, [años]);

  useEffect(() => {
    // Precargar después de un pequeño delay para no interferir con la carga principal
    const timer = setTimeout(preloadData, 2000);
    return () => clearTimeout(timer);
  }, [preloadData]);

  return { preloadData };
}
