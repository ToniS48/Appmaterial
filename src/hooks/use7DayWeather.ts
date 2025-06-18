import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { weatherService, WeatherData } from '../services/weatherService';
import { Actividad } from '../types/actividad';

interface Use7DayWeatherReturn {
  weatherData: WeatherData[];
  loading: boolean;
  error: string | null;
  isEnabled: boolean;
}

/**
 * Hook específico para obtener pronóstico de 7 días para tarjetas de actividades
 */
export const use7DayWeather = (actividad: Actividad | null): Use7DayWeatherReturn => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Función para obtener pronóstico de 7 días
   */
  const fetch7DayWeather = useCallback(async (): Promise<void> => {
    if (!actividad || !weatherService.isEnabled()) {
      setWeatherData([]);
      return;
    }

    // Solo mostrar pronóstico para actividades futuras
    const today = new Date();
    const activityDate = actividad.fechaInicio instanceof Timestamp 
      ? actividad.fechaInicio.toDate() 
      : actividad.fechaInicio;

    if (activityDate <= today) {
      setWeatherData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {      // Usar ubicación de la actividad
      const locationToUse = actividad.lugar;

      const weather = await weatherService.get7DayForecastForActivity(
        actividad.fechaInicio,
        locationToUse
      );

      setWeatherData(weather);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo pronóstico';
      setError(errorMessage);
      console.error('Error en use7DayWeather:', err);
    } finally {
      setLoading(false);
    }
  }, [actividad]);

  /**
   * Efecto principal para cargar datos
   */
  useEffect(() => {
    fetch7DayWeather();
  }, [fetch7DayWeather]);

  return {
    weatherData,
    loading,
    error,
    isEnabled: weatherService.isEnabled()
  };
};
