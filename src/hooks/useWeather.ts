import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { weatherService, WeatherData } from '../services/weatherService';
import { Actividad } from '../types/actividad';
import { 
  obtenerConfiguracionMeteorologica, 
  actualizarConfiguracionMeteorologica 
} from '../services/configuracionService';

interface UseWeatherOptions {
  enabled?: boolean;
  location?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
}

interface UseWeatherReturn {
  weatherData: WeatherData[];
  loading: boolean;
  error: string | null;
  isEnabled: boolean;
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook personalizado para gestionar datos meteorológicos de actividades
 */
export const useWeather = (
  actividad: Actividad | null,
  options: UseWeatherOptions = {}
): UseWeatherReturn => {
  const {
    enabled = true,
    location,
    autoRefresh = false,
    refreshInterval = 10 * 60 * 1000 // 10 minutos por defecto
  } = options;

  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Función para obtener datos meteorológicos
   */
  const fetchWeatherData = useCallback(async (): Promise<void> => {
    if (!actividad || !enabled || !weatherService.isEnabled()) {
      setWeatherData([]);
      return;
    }

    setLoading(true);
    setError(null);    try {
      const locationToUse = location || actividad.lugar || undefined;
      
      // Usar coordenadas específicas si están disponibles
      let weather: WeatherData[];
      if (actividad.ubicacionLat && actividad.ubicacionLon && 
          actividad.ubicacionLat !== 0 && actividad.ubicacionLon !== 0) {        // Usar coordenadas exactas de la actividad
        weather = await weatherService.getWeatherForActivityWithCoordinates(
          actividad.fechaInicio,
          actividad.ubicacionLat,
          actividad.ubicacionLon,
          actividad.fechaFin,
          locationToUse
        );
      } else {
        // Usar método tradicional con geocodificación
        weather = await weatherService.getWeatherForActivity(
          actividad.fechaInicio,
          actividad.fechaFin,
          locationToUse
        );
      }

      setWeatherData(weather);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo datos meteorológicos';
      setError(errorMessage);
      console.error('Error en useWeather:', err);
    } finally {
      setLoading(false);
    }
  }, [actividad, enabled, location]);

  /**
   * Función para actualizar manualmente
   */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchWeatherData();
  }, [fetchWeatherData]);

  /**
   * Función para limpiar errores
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  /**
   * Efecto principal para cargar datos
   */
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  /**
   * Efecto para auto-actualización
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchWeatherData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWeatherData]);

  return {
    weatherData,
    loading,
    error,
    isEnabled: weatherService.isEnabled(),
    refresh,
    clearError
  };
};

/**
 * Hook para gestionar la configuración del servicio meteorológico
 */
export const useWeatherConfig = () => {
  const [config, setConfig] = useState(weatherService.getConfig());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Carga la configuración desde Firebase al inicializar
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { obtenerConfiguracionMeteorologica } = await import('../services/configuracionService');
        const savedConfig = await obtenerConfiguracionMeteorologica();
        await weatherService.configure(savedConfig);
        setConfig(weatherService.getConfig());
      } catch (err) {
        console.error('Error cargando configuración meteorológica:', err);
      }
    };

    loadConfig();
  }, []);

  /**
   * Actualiza la configuración del servicio
   */
  const updateConfig = useCallback(async (newConfig: Partial<typeof config>): Promise<void> => {
    setLoading(true);
    setError(null);    try {
      const updatedConfig = { ...config, ...newConfig };
        // Guardar en Firebase
      const { actualizarConfiguracionMeteorologica } = await import('../services/configuracionService');
      await actualizarConfiguracionMeteorologica(updatedConfig);
      
      // Actualizar el servicio
      await weatherService.configure(updatedConfig);
      setConfig(weatherService.getConfig());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando configuración';
      setError(errorMessage);
      console.error('Error actualizando configuración meteorológica:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config]);

  /**
   * Prueba la conexión con la API
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!weatherService.isEnabled()) {
      setError('Servicio meteorológico no configurado');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const testForecast = await weatherService.getWeatherForecast(undefined, 1);
      const success = testForecast !== null;
      
      if (!success) {
        setError('No se pudo conectar con el servicio meteorológico');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error probando conexión';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpia el cache del servicio
   */
  const clearCache = useCallback((): void => {
    weatherService.clearCache();
  }, []);

  return {
    config,
    loading,
    error,
    updateConfig,
    testConnection,
    clearCache,
    isEnabled: config.enabled
  };
};

export default useWeather;
