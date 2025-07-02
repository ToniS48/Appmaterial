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
    if (!actividad) {
      setWeatherData([]);
      return;
    }

    if (!weatherService.isEnabled()) {
      setWeatherData([]);
      return;
    }

    // Verificar si la actividad es futura (dentro de 7 días)
    const now = new Date();
    const activityDate = actividad.fechaInicio instanceof Timestamp 
      ? actividad.fechaInicio.toDate() 
      : actividad.fechaInicio;
    
    const diffTime = activityDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Solo obtener pronóstico para actividades futuras (próximos 7 días)
    if (diffDays < 0 || diffDays > 7) {
      setWeatherData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {      
      const weather = await weatherService.get7DayForecastForActivity(
        actividad.fechaInicio,
        actividad.lugar,
        actividad.fechaFin
      );

      setWeatherData(weather);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo pronóstico';
      setError(errorMessage);
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
