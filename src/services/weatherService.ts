import { Timestamp } from 'firebase/firestore';
import { weatherConfigConverter, safeFirestoreUpdate } from './firestore/FirestoreConverters';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface WeatherData {
  date: string;
  temperature: {
    min: number;
    max: number;
    current?: number;
  };
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitation?: number;
  condition: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'mist' | 'unknown';
}

export interface WeatherForecast {
  current?: WeatherData;
  daily: WeatherData[];
  location: {
    lat: number;
    lon: number;
    name?: string;
  };
}

interface OpenMeteoConfig {
  enabled: boolean;
  defaultLocation: {
    lat: number;
    lon: number;
    name: string;
  };
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'ms' | 'mph';
  precipitationUnit: 'mm' | 'inch';
  aemet: {
    enabled: boolean;
    apiKey: string;
    useForSpain: boolean; // Usar AEMET para ubicaciones en España
  };
}

// Configuración por defecto para España (Madrid como referencia)
const defaultWeatherConfig: OpenMeteoConfig = {
  enabled: false,
  defaultLocation: {
    lat: 40.4168,
    lon: -3.7038,
    name: 'Madrid, España'
  },
  temperatureUnit: 'celsius',
  windSpeedUnit: 'kmh',
  precipitationUnit: 'mm',
  aemet: {
    enabled: false,
    apiKey: '',
    useForSpain: true
  }
};

/**
 * Servicio para integrar datos meteorológicos de Open-Meteo
 * API gratuita y de código abierto
 */
class WeatherService {
  private config: OpenMeteoConfig = defaultWeatherConfig;
  private cache: Map<string, { data: WeatherForecast; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

  /**
   * Configura el servicio
   */
  async configure(config: Partial<OpenMeteoConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
  }
  /**
   * Verifica si el servicio está habilitado (Open-Meteo siempre disponible, AEMET opcional)
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Verifica si AEMET está configurado y habilitado
   */
  isAemetEnabled(): boolean {
    return this.config.aemet.enabled && this.config.aemet.apiKey.length > 0;
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): OpenMeteoConfig {
    return { ...this.config };
  }
  /**
   * Obtiene coordenadas a partir del nombre de una ubicación usando Nominatim (gratuito)
   */
  async getCoordinatesFromLocation(location: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.length === 0) return null;

      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    } catch (error) {
      console.warn('Error obteniendo coordenadas:', error);
      return null;
    }
  }  /**
   * Obtiene datos meteorológicos para una ubicación específica usando Open-Meteo o AEMET
   */
  async getWeatherForecast(
    location?: string | { lat: number; lon: number },
    days: number = 5
  ): Promise<WeatherForecast | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      let coordinates: { lat: number; lon: number };

      // Determinar coordenadas
      if (!location) {
        coordinates = this.config.defaultLocation;
      } else if (typeof location === 'string') {
        const coords = await this.getCoordinatesFromLocation(location);
        if (!coords) {
          coordinates = this.config.defaultLocation;
        } else {
          coordinates = coords;
        }
      } else {
        coordinates = location;
      }

      // Verificar cache
      const cacheKey = `${coordinates.lat},${coordinates.lon},${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      let forecast: WeatherForecast | null = null;

      // Usar AEMET para ubicaciones en España si está habilitado
      if (this.config.aemet.enabled && 
          this.config.aemet.useForSpain && 
          this.isLocationInSpain(coordinates.lat, coordinates.lon)) {
        
        console.log('Usando AEMET para ubicación en España');
        forecast = await this.getAemetForecast(coordinates.lat, coordinates.lon, days);
        
        // Si AEMET falla, usar Open-Meteo como respaldo
        if (!forecast) {
          console.log('AEMET falló, usando Open-Meteo como respaldo');
          forecast = await this.getOpenMeteoForecast(coordinates, days);
        }
      } else {
        // Usar Open-Meteo por defecto
        forecast = await this.getOpenMeteoForecast(coordinates, days);
      }

      if (forecast) {
        // Guardar en cache
        this.cache.set(cacheKey, {
          data: forecast,
          timestamp: Date.now()
        });
      }

      return forecast;

    } catch (error) {
      console.error('Error obteniendo datos meteorológicos:', error);
      return null;
    }
  }

  /**
   * Obtiene datos meteorológicos usando Open-Meteo (método original)
   */
  private async getOpenMeteoForecast(
    coordinates: { lat: number; lon: number },
    days: number
  ): Promise<WeatherForecast | null> {
    try {      // Construir URL para Open-Meteo API
      // La API de Open-Meteo devuelve automáticamente hasta 16 días de pronóstico
      // Corregidos los nombres de parámetros según la documentación oficial
      const params = new URLSearchParams({
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lon.toString(),
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max',
        current: 'temperature_2m,relative_humidity_2m,windspeed_10m,weathercode',
        timezone: 'auto'
      });

      const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
      console.log('🌦️ Petición a Open-Meteo:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🌦️ Error en API Open-Meteo:', response.status, errorText);
        throw new Error(`Error en API Open-Meteo: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🌦️ Respuesta de Open-Meteo exitosa:', data);      // Procesar datos
      const forecast: WeatherForecast = {
        location: {
          lat: coordinates.lat,
          lon: coordinates.lon,
          name: this.config.defaultLocation.name
        },
        current: data.current ? this.mapCurrentWeatherData(data.current) : undefined,
        daily: this.mapDailyWeatherData(data.daily, days)
      };

      console.log('🌦️ Pronóstico procesado exitosamente:', forecast);
      return forecast;

    } catch (error) {
      console.error('Error obteniendo datos de Open-Meteo:', error);
      return null;
    }
  }
  /**
   * Mapea datos actuales de Open-Meteo a nuestro formato interno
   */
  private mapCurrentWeatherData(data: any): WeatherData {
    const condition = this.mapWeatherCodeToCondition(data.weathercode);
    const description = this.getWeatherDescription(data.weathercode);

    return {
      date: new Date().toISOString().split('T')[0],
      temperature: {
        min: data.temperature_2m,
        max: data.temperature_2m,
        current: data.temperature_2m
      },
      description,
      icon: this.getWeatherIcon(data.weathercode),
      humidity: data.relative_humidity_2m || 0,
      windSpeed: data.windspeed_10m || 0,
      precipitation: 0, // Los datos actuales no incluyen precipitación
      condition
    };
  }

  /**
   * Mapea datos diarios de Open-Meteo a nuestro formato interno
   */
  private mapDailyWeatherData(data: any, days: number): WeatherData[] {
    const dailyData: WeatherData[] = [];
    
    for (let i = 0; i < Math.min(days, data.time.length); i++) {
      const condition = this.mapWeatherCodeToCondition(data.weathercode[i]);
      const description = this.getWeatherDescription(data.weathercode[i]);

      dailyData.push({
        date: data.time[i],
        temperature: {
          min: data.temperature_2m_min[i],
          max: data.temperature_2m_max[i]
        },
        description,
        icon: this.getWeatherIcon(data.weathercode[i]),
        humidity: 0, // Sin datos de humedad diaria en esta petición simplificada
        windSpeed: data.windspeed_10m_max[i] || 0,
        precipitation: data.precipitation_sum[i] || 0,
        condition
      });
    }

    return dailyData;
  }

  /**
   * Mapea códigos de clima de Open-Meteo a nuestras condiciones simplificadas
   */
  private mapWeatherCodeToCondition(code: number): WeatherData['condition'] {
    if (code === 0) return 'clear';
    if (code >= 1 && code <= 3) return 'clouds';
    if (code >= 45 && code <= 48) return 'mist';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 86) return 'snow';
    if (code >= 95 && code <= 99) return 'thunderstorm';
    return 'unknown';
  }

  /**
   * Obtiene descripción textual basada en el código de clima de Open-Meteo
   */
  private getWeatherDescription(code: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Despejado',
      1: 'Mayormente despejado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Niebla',
      48: 'Niebla con escarcha',
      51: 'Llovizna ligera',
      53: 'Llovizna moderada',
      55: 'Llovizna intensa',
      56: 'Llovizna helada ligera',
      57: 'Llovizna helada intensa',
      61: 'Lluvia ligera',
      63: 'Lluvia moderada',
      65: 'Lluvia intensa',
      66: 'Lluvia helada ligera',
      67: 'Lluvia helada intensa',
      71: 'Nieve ligera',
      73: 'Nieve moderada',
      75: 'Nieve intensa',
      77: 'Granizo',
      80: 'Chubascos ligeros',
      81: 'Chubascos moderados',
      82: 'Chubascos intensos',
      85: 'Chubascos de nieve ligeros',
      86: 'Chubascos de nieve intensos',
      95: 'Tormenta',
      96: 'Tormenta con granizo ligero',
      99: 'Tormenta con granizo intenso'
    };

    return descriptions[code] || 'Desconocido';
  }

  /**
   * Obtiene icono basado en el código de clima de Open-Meteo
   */
  private getWeatherIcon(code: number): string {
    // Mapeo de códigos WMO a iconos meteorológicos estándar
    const iconMap: { [key: number]: string } = {
      0: '01d', // Despejado
      1: '02d', // Mayormente despejado
      2: '03d', // Parcialmente nublado
      3: '04d', // Nublado
      45: '50d', // Niebla
      48: '50d', // Niebla con escarcha
      51: '09d', // Llovizna ligera
      53: '09d', // Llovizna moderada
      55: '09d', // Llovizna intensa
      61: '10d', // Lluvia ligera
      63: '10d', // Lluvia moderada
      65: '10d', // Lluvia intensa
      71: '13d', // Nieve ligera
      73: '13d', // Nieve moderada
      75: '13d', // Nieve intensa
      80: '09d', // Chubascos
      95: '11d', // Tormenta
      96: '11d', // Tormenta con granizo
      99: '11d'  // Tormenta con granizo intenso
    };

    return iconMap[code] || '01d';
  }
  /**
   * Obtiene el pronóstico para las fechas específicas de una actividad
   */
  async getWeatherForActivity(
    activityStartDate: Date | Timestamp,
    activityEndDate?: Date | Timestamp,
    location?: string
  ): Promise<WeatherData[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const startDate = activityStartDate instanceof Timestamp 
        ? activityStartDate.toDate() 
        : activityStartDate;

      const endDate = activityEndDate 
        ? (activityEndDate instanceof Timestamp ? activityEndDate.toDate() : activityEndDate)
        : startDate;

      // Calcular días desde hoy hasta la fecha de la actividad
      const today = new Date();
      const daysUntilActivity = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Open-Meteo proporciona pronósticos para los próximos 16 días (gratis)
      if (daysUntilActivity > 15) {
        return [];
      }

      const forecast = await this.getWeatherForecast(location, 16);
      if (!forecast) {
        return [];
      }

      // Filtrar días relevantes para la actividad
      const activityDays: WeatherData[] = [];
      const activityStartDateStr = startDate.toISOString().split('T')[0];
      const activityEndDateStr = endDate.toISOString().split('T')[0];

      for (const dailyWeather of forecast.daily) {
        if (dailyWeather.date >= activityStartDateStr && dailyWeather.date <= activityEndDateStr) {
          activityDays.push(dailyWeather);
        }
      }

      return activityDays;

    } catch (error) {
      console.error('Error obteniendo pronóstico para actividad:', error);
      return [];
    }
  }

  /**
   * Obtiene el pronóstico para las fechas específicas de una actividad usando coordenadas exactas
   */  async getWeatherForActivityWithCoordinates(
    activityStartDate: Date | Timestamp,
    lat: number,
    lon: number,
    activityEndDate?: Date | Timestamp,
    locationName?: string
  ): Promise<WeatherData[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const startDate = activityStartDate instanceof Timestamp 
        ? activityStartDate.toDate() 
        : activityStartDate;

      const endDate = activityEndDate 
        ? (activityEndDate instanceof Timestamp ? activityEndDate.toDate() : activityEndDate)
        : startDate;

      // Calcular días desde hoy hasta la fecha de la actividad
      const today = new Date();
      const daysUntilActivity = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Open-Meteo y AEMET proporcionan pronósticos para los próximos 15-16 días
      if (daysUntilActivity > 15) {
        return [];
      }

      // Usar coordenadas directamente sin geocodificación
      const forecast = await this.getWeatherForecast({ lat, lon }, 16);
      if (!forecast) {
        return [];
      }

      // Filtrar días relevantes para la actividad
      const activityDays: WeatherData[] = [];
      const activityStartDateStr = startDate.toISOString().split('T')[0];
      const activityEndDateStr = endDate.toISOString().split('T')[0];

      for (const dailyWeather of forecast.daily) {
        if (dailyWeather.date >= activityStartDateStr && dailyWeather.date <= activityEndDateStr) {
          activityDays.push(dailyWeather);
        }
      }

      return activityDays;

    } catch (error) {
      console.error('Error obteniendo pronóstico para actividad con coordenadas:', error);
      return [];
    }
  }

  /**
   * Limpia el cache
   */  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Verifica si una ubicación está en España
   */
  private isLocationInSpain(lat: number, lon: number): boolean {
    // Coordenadas aproximadas de España peninsular e islas
    const spainBounds = {
      north: 43.9,
      south: 35.2,
      east: 4.5,
      west: -9.5
    };

    const balearicBounds = {
      north: 40.1,
      south: 38.6,
      east: 4.4,
      west: 1.1
    };

    const canaryBounds = {
      north: 29.5,
      south: 27.6,
      east: -13.4,
      west: -18.2
    };

    // Verificar España peninsular
    const inPeninsula = lat >= spainBounds.south && lat <= spainBounds.north &&
                       lon >= spainBounds.west && lon <= spainBounds.east;

    // Verificar Baleares
    const inBaleares = lat >= balearicBounds.south && lat <= balearicBounds.north &&
                      lon >= balearicBounds.west && lon <= balearicBounds.east;

    // Verificar Canarias
    const inCanarias = lat >= canaryBounds.south && lat <= canaryBounds.north &&
                      lon >= canaryBounds.west && lon <= canaryBounds.east;

    return inPeninsula || inBaleares || inCanarias;
  }

  /**
   * Obtiene datos meteorológicos de AEMET para ubicaciones en España
   */
  private async getAemetForecast(
    lat: number,
    lon: number,
    days: number = 5
  ): Promise<WeatherForecast | null> {
    if (!this.config.aemet.enabled || !this.config.aemet.apiKey) {
      return null;
    }

    try {
      // AEMET requiere obtener el municipio más cercano primero
      const municipality = await this.getAemetMunicipality(lat, lon);
      if (!municipality) {
        return null;
      }

      // Obtener predicción específica para el municipio
      const forecastUrl = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${municipality}`;
      
      const response = await fetch(forecastUrl, {
        headers: {
          'api_key': this.config.aemet.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Error AEMET API: ${response.status}`);
      }

      const result = await response.json();
      
      // AEMET devuelve una URL con los datos reales
      if (result.estado !== 200 || !result.datos) {
        throw new Error('AEMET: No se obtuvieron datos');
      }

      const dataResponse = await fetch(result.datos);
      if (!dataResponse.ok) {
        throw new Error('AEMET: Error obteniendo datos meteorológicos');
      }

      const weatherData = await dataResponse.json();
      
      return this.mapAemetData(weatherData[0], lat, lon, days);

    } catch (error) {
      console.error('Error obteniendo datos de AEMET:', error);
      return null;
    }
  }

  /**
   * Obtiene el código de municipio AEMET más cercano a las coordenadas
   */
  private async getAemetMunicipality(lat: number, lon: number): Promise<string | null> {
    try {
      // Usar API de municipios de AEMET
      const response = await fetch('https://opendata.aemet.es/opendata/api/maestro/municipios', {
        headers: {
          'api_key': this.config.aemet.apiKey
        }
      });

      if (!response.ok) return null;

      const result = await response.json();
      if (result.estado !== 200 || !result.datos) return null;

      const dataResponse = await fetch(result.datos);
      const municipalities = await dataResponse.json();

      // Encontrar el municipio más cercano
      let closestMunicipality = null;
      let minDistance = Infinity;

      for (const municipality of municipalities) {
        if (municipality.latitud_dec && municipality.longitud_dec) {
          const distance = this.calculateDistance(
            lat, lon,
            parseFloat(municipality.latitud_dec),
            parseFloat(municipality.longitud_dec)
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestMunicipality = municipality.id;
          }
        }
      }

      return closestMunicipality;
    } catch (error) {
      console.error('Error obteniendo municipio AEMET:', error);
      return null;
    }
  }

  /**
   * Calcula distancia entre dos puntos usando fórmula de Haversine
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Mapea datos de AEMET a nuestro formato interno
   */
  private mapAemetData(
    data: any,
    lat: number,
    lon: number,
    days: number
  ): WeatherForecast {
    const forecast: WeatherForecast = {
      location: { lat, lon, name: data.nombre || 'España' },
      daily: []
    };

    // Procesar predicción diaria
    if (data.prediccion && data.prediccion.dia) {
      const dailyForecasts = data.prediccion.dia.slice(0, days);
      
      forecast.daily = dailyForecasts.map((day: any) => {
        // AEMET tiene estructura compleja, extraer datos principales
        const temperatura = day.temperatura || {};
        const precipitacion = day.precipitacion || [];
        const viento = day.viento || [];
        const estadoCielo = day.estadoCielo || [];

        return {
          date: day.fecha,
          temperature: {
            min: temperatura.minima || temperatura.min || 0,
            max: temperatura.maxima || temperatura.max || 0
          },
          description: this.getAemetDescription(estadoCielo[0]?.value || ''),
          icon: this.getAemetIcon(estadoCielo[0]?.value || ''),
          humidity: day.humedadRelativa?.maxima || 0,
          windSpeed: viento[0]?.velocidad || 0,
          precipitation: precipitacion[0]?.value || 0,
          condition: this.mapAemetCondition(estadoCielo[0]?.value || '')
        };
      });
    }

    return forecast;
  }

  /**
   * Mapea códigos de estado del cielo de AEMET a descripciones
   */
  private getAemetDescription(codigo: string): string {
    const descripciones: { [key: string]: string } = {
      '11': 'Despejado',
      '12': 'Poco nuboso',
      '13': 'Intervalos nubosos',
      '14': 'Nuboso',
      '15': 'Muy nuboso',
      '16': 'Cubierto',
      '17': 'Nubes altas',
      '23': 'Intervalos nubosos con lluvia escasa',
      '24': 'Nuboso con lluvia escasa',
      '25': 'Muy nuboso con lluvia escasa',
      '26': 'Cubierto con lluvia escasa',
      '33': 'Intervalos nubosos con lluvia',
      '34': 'Nuboso con lluvia',
      '35': 'Muy nuboso con lluvia',
      '36': 'Cubierto con lluvia',
      '43': 'Intervalos nubosos con nieve escasa',
      '44': 'Nuboso con nieve escasa',
      '45': 'Muy nuboso con nieve escasa',
      '46': 'Cubierto con nieve escasa',
      '51': 'Intervalos nubosos con tormenta',
      '52': 'Nuboso con tormenta',
      '53': 'Muy nuboso con tormenta',
      '54': 'Cubierto con tormenta'
    };

    return descripciones[codigo] || 'Condiciones variables';
  }

  /**
   * Mapea códigos de AEMET a iconos
   */
  private getAemetIcon(codigo: string): string {
    const iconos: { [key: string]: string } = {
      '11': '01d', // Despejado
      '12': '02d', // Poco nuboso
      '13': '03d', // Intervalos nubosos
      '14': '04d', // Nuboso
      '15': '04d', // Muy nuboso
      '16': '04d', // Cubierto
      '17': '02d', // Nubes altas
      '23': '09d', // Intervalos nubosos con lluvia escasa
      '24': '09d', // Nuboso con lluvia escasa
      '25': '09d', // Muy nuboso con lluvia escasa
      '26': '09d', // Cubierto con lluvia escasa
      '33': '10d', // Intervalos nubosos con lluvia
      '34': '10d', // Nuboso con lluvia
      '35': '10d', // Muy nuboso con lluvia
      '36': '10d', // Cubierto con lluvia
      '43': '13d', // Nieve escasa
      '44': '13d',
      '45': '13d',
      '46': '13d',
      '51': '11d', // Tormenta
      '52': '11d',
      '53': '11d',
      '54': '11d'
    };

    return iconos[codigo] || '01d';
  }

  /**
   * Mapea códigos de AEMET a nuestras condiciones simplificadas
   */
  private mapAemetCondition(codigo: string): WeatherData['condition'] {
    if (['11'].includes(codigo)) return 'clear';
    if (['12', '13', '14', '15', '16', '17'].includes(codigo)) return 'clouds';
    if (['23', '24', '25', '26', '33', '34', '35', '36'].includes(codigo)) return 'rain';
    if (['43', '44', '45', '46'].includes(codigo)) return 'snow';
    if (['51', '52', '53', '54'].includes(codigo)) return 'thunderstorm';
    return 'unknown';
  }
  /**
   * Obtiene el pronóstico de 7 días para una actividad (para vista compacta en tarjetas)
   */
  async get7DayForecastForActivity(
    activityStartDate: Date | Timestamp,
    location?: string,
    activityEndDate?: Date | Timestamp
  ): Promise<WeatherData[]> {
    console.log('[weatherService] get7DayForecastForActivity MODO DEBUG iniciando...');
    
    if (!this.isEnabled()) {
      console.log('[weatherService] Servicio deshabilitado');
      return [];
    }

    try {
      const startDate = activityStartDate instanceof Timestamp 
        ? activityStartDate.toDate() 
        : activityStartDate;

      const endDate = activityEndDate 
        ? (activityEndDate instanceof Timestamp ? activityEndDate.toDate() : activityEndDate)
        : startDate;

      console.log('[weatherService] Fechas de actividad:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location
      });

      // MODO DEBUG: Temporalmente comentar restricciones de fecha
      /*
      // Calcular días desde hoy hasta la fecha de inicio de la actividad
      const today = new Date();
      const daysUntilActivity = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calcular días desde el fin de la actividad
      const daysSinceEnd = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Si la actividad es muy lejana o ya terminó hace más de 1 día, no mostrar pronóstico
      if (daysUntilActivity > 15 || daysSinceEnd > 1) {
        console.log('[weatherService] Actividad fuera de rango de fechas:', { daysUntilActivity, daysSinceEnd });
        return [];
      }
      */

      console.log('[weatherService] Obteniendo pronóstico para ubicación:', location);

      // Obtener pronóstico completo
      const forecast = await this.getWeatherForecast(location, 7);
      console.log('[weatherService] Pronóstico obtenido:', {
        hasData: !!forecast,
        hasDaily: !!(forecast?.daily),
        dailyLength: forecast?.daily?.length || 0
      });

      if (!forecast || !forecast.daily) {
        console.log('[weatherService] No hay datos de pronóstico disponibles');
        return [];
      }

      // Retornar los próximos 7 días
      const result = forecast.daily.slice(0, 7);
      console.log('[weatherService] Retornando', result.length, 'días de pronóstico');
      return result;

    } catch (error) {
      console.error('Error obteniendo pronóstico de 7 días:', error);
      return [];
    }
  }

  /**
   * Obtiene datos meteorológicos históricos de Open-Meteo
   */
  async getHistoricalWeather(
    location: string | { lat: number; lon: number },
    startDate: Date,
    endDate: Date
  ): Promise<WeatherData[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      let coordinates: { lat: number; lon: number };
      
      if (typeof location === 'string') {
        const coords = await this.getCoordinatesFromLocation(location);
        if (!coords) return [];
        coordinates = coords;
      } else {
        coordinates = location;
      }

      // Formatear fechas para la API (YYYY-MM-DD)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Parámetros para la API de datos históricos de Open-Meteo
      const params = new URLSearchParams({
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lon.toString(),
        start_date: startDateStr,
        end_date: endDateStr,
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'temperature_2m_mean',
          'precipitation_sum',
          'windspeed_10m_max',
          'winddirection_10m_dominant',
          'weathercode',
          'relative_humidity_2m_max'
        ].join(','),
        timezone: 'auto'
      });

      const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
      console.log('🕰️ Petición datos históricos:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error en API histórica: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.daily) {
        return [];
      }

      // Procesar datos históricos
      const historicalData: WeatherData[] = [];
      
      for (let i = 0; i < data.daily.time.length; i++) {
        const weatherCode = data.daily.weathercode[i] || 0;
        
        historicalData.push({
          date: data.daily.time[i],
          temperature: {
            min: Math.round(data.daily.temperature_2m_min[i] || 0),
            max: Math.round(data.daily.temperature_2m_max[i] || 0),
            current: Math.round(data.daily.temperature_2m_mean[i] || 0)
          },
          description: this.getWeatherDescription(weatherCode),
          icon: this.getWeatherIcon(weatherCode),
          humidity: Math.round(data.daily.relative_humidity_2m_max[i] || 0),
          windSpeed: Math.round(data.daily.windspeed_10m_max[i] || 0),
          precipitation: Math.round((data.daily.precipitation_sum[i] || 0) * 10) / 10,
          condition: this.mapWeatherCodeToCondition(weatherCode)
        });
      }

      console.log('✅ Datos históricos obtenidos:', historicalData.length, 'días');
      return historicalData;

    } catch (error) {
      console.error('Error obteniendo datos históricos:', error);
      return [];
    }
  }

  /**
   * Obtiene datos históricos para los días anteriores a una actividad
   */
  async getHistoricalWeatherForActivity(
    activityStartDate: Date | Timestamp,
    location?: string,
    daysBack: number = 7
  ): Promise<WeatherData[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const startDate = activityStartDate instanceof Timestamp 
        ? activityStartDate.toDate() 
        : activityStartDate;

      // Calcular el rango de fechas históricas
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() - 1); // Un día antes del inicio de la actividad
      
      const historyStartDate = new Date(startDate);
      historyStartDate.setDate(historyStartDate.getDate() - daysBack); // 'daysBack' días antes

      // Determinar ubicación
      let locationToUse: string | { lat: number; lon: number };
      if (location) {
        locationToUse = location;
      } else {
        locationToUse = this.config.defaultLocation;
      }

      return await this.getHistoricalWeather(locationToUse, historyStartDate, endDate);

    } catch (error) {
      console.error('Error obteniendo datos históricos para actividad:', error);
      return [];
    }
  }

  // ...existing code...
}

// Instancia singleton
export const weatherService = new WeatherService();
export default weatherService;
