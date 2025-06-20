import { useState, useEffect, useCallback } from 'react';
import { weatherService, WeatherData } from '../services/weatherService';
import { Actividad } from '../types/actividad';
import { Timestamp } from 'firebase/firestore';

interface UseHistoricalWeatherOptions {
  /**
   * Si true, carga los datos automáticamente al montar el componente
   */
  loadOnMount?: boolean;
  
  /**
   * Número de días hacia atrás para obtener datos históricos
   */
  daysBack?: number;
  
  /**
   * Ubicación específica (si no se proporciona, usa la de la actividad)
   */
  location?: string;
  
  /**
   * Si true, muestra logs de debug en consola
   */
  debug?: boolean;
}

interface UseHistoricalWeatherReturn {
  /**
   * Datos meteorológicos históricos
   */
  historicalData: WeatherData[];
  
  /**
   * Indica si está cargando los datos
   */
  loading: boolean;
  
  /**
   * Error si lo hubo durante la carga
   */
  error: string | null;
  
  /**
   * Función para cargar los datos manualmente
   */
  loadHistoricalData: () => Promise<void>;
  
  /**
   * Función para limpiar errores
   */
  clearError: () => void;
  
  /**
   * Indica si el servicio meteorológico está habilitado
   */
  isEnabled: boolean;
}

/**
 * Hook para obtener datos meteorológicos históricos de una actividad
 */
export function useHistoricalWeather(
  actividad: Actividad,
  options: UseHistoricalWeatherOptions = {}
): UseHistoricalWeatherReturn {
  const {
    loadOnMount = false,
    daysBack = 7,
    location,
    debug = false
  } = options;

  const [historicalData, setHistoricalData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Función principal para cargar datos históricos
   */
  const loadHistoricalData = useCallback(async (): Promise<void> => {
    if (!weatherService.isEnabled()) {
      setError('El servicio meteorológico no está habilitado');
      return;
    }

    if (!actividad.fechaInicio || (!actividad.lugar && !actividad.ubicacionLat && !location)) {
      setError('No hay suficiente información de ubicación');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (debug) {
        console.log('🕰️ [useHistoricalWeather] Cargando datos históricos:', {
          actividad: actividad.id,
          daysBack,
          location: location || actividad.lugar,
          coordinates: actividad.ubicacionLat ? { lat: actividad.ubicacionLat, lon: actividad.ubicacionLon } : null
        });
      }

      // Determinar ubicación a usar
      let locationToUse: string | undefined;
      if (location) {
        locationToUse = location;
      } else if (actividad.lugar) {
        locationToUse = actividad.lugar;
      }

      // Si tenemos coordenadas, usarlas directamente en el servicio
      let historical: WeatherData[];
      if (actividad.ubicacionLat && actividad.ubicacionLon) {
        // Calcular fechas manualmente para usar coordenadas
        const startDate = actividad.fechaInicio instanceof Timestamp 
          ? actividad.fechaInicio.toDate() 
          : actividad.fechaInicio;

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() - 1); // Un día antes del inicio
        
        const historyStartDate = new Date(startDate);
        historyStartDate.setDate(historyStartDate.getDate() - daysBack);

        historical = await weatherService.getHistoricalWeather(
          { lat: actividad.ubicacionLat, lon: actividad.ubicacionLon },
          historyStartDate,
          endDate
        );
      } else {
        // Usar el método que maneja ubicaciones por nombre
        historical = await weatherService.getHistoricalWeatherForActivity(
          actividad.fechaInicio,
          locationToUse,
          daysBack
        );
      }

      setHistoricalData(historical);

      if (debug) {
        console.log('✅ [useHistoricalWeather] Datos históricos cargados:', {
          diasObtenidos: historical.length,
          rangoFechas: historical.length > 0 ? {
            desde: historical[0]?.date,
            hasta: historical[historical.length - 1]?.date
          } : null
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo datos históricos';
      setError(errorMessage);
      
      if (debug) {
        console.error('❌ [useHistoricalWeather] Error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [actividad, daysBack, location, debug]);

  /**
   * Función para limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Efecto para cargar datos al montar si está configurado
   */
  useEffect(() => {
    if (loadOnMount) {
      loadHistoricalData();
    }
  }, [loadOnMount, loadHistoricalData]);

  /**
   * Efecto para limpiar datos cuando cambia la actividad
   */
  useEffect(() => {
    setHistoricalData([]);
    setError(null);
  }, [actividad.id]);

  return {
    historicalData,
    loading,
    error,
    loadHistoricalData,
    clearError,
    isEnabled: weatherService.isEnabled()
  };
}

/**
 * Hook especializado para datos históricos que se cargan automáticamente
 */
export function usePreloadedHistoricalWeather(
  actividad: Actividad,
  options: Omit<UseHistoricalWeatherOptions, 'loadOnMount'> = {}
) {
  return useHistoricalWeather(actividad, {
    ...options,
    loadOnMount: true
  });
}

/**
 * Hook especializado para datos históricos que se cargan bajo demanda
 */
export function useOnDemandHistoricalWeather(
  actividad: Actividad,
  options: Omit<UseHistoricalWeatherOptions, 'loadOnMount'> = {}
) {
  return useHistoricalWeather(actividad, {
    ...options,
    loadOnMount: false
  });
}
