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
    }    // Mostrar pronóstico hasta 1 día después del fin de la actividad
    const today = new Date();
    const activityStartDate = actividad.fechaInicio instanceof Timestamp 
      ? actividad.fechaInicio.toDate() 
      : actividad.fechaInicio;
    
    const activityEndDate = actividad.fechaFin
      ? (actividad.fechaFin instanceof Timestamp ? actividad.fechaFin.toDate() : actividad.fechaFin)
      : activityStartDate;

    // Calcular días desde el fin de la actividad
    const daysSinceEnd = Math.ceil((today.getTime() - activityEndDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // No mostrar si han pasado más de 1 día desde el fin
    if (daysSinceEnd > 1) {
      setWeatherData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {      // Usar ubicación de la actividad
      const locationToUse = actividad.lugar;      const weather = await weatherService.get7DayForecastForActivity(
        actividad.fechaInicio,
        locationToUse,
        actividad.fechaFin
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
