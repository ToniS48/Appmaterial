# 🌤️ Sistema Meteorológico - AppMaterial

Este documento consolida toda la información sobre la integración meteorológica y funcionalidades relacionadas con el clima.

## 🎯 Funcionalidades del Sistema Meteorológico

### 1. **Integración con Open-Meteo API**
- **Datos meteorológicos actuales** en tiempo real
- **Pronósticos de 7 días** para planificación
- **Historial meteorológico** para análisis
- **Múltiples variables meteorológicas** (temperatura, precipitación, viento, etc.)

### 2. **Predicción para Actividades**
- **Consulta automática** al crear/editar actividades
- **Alertas meteorológicas** para condiciones adversas
- **Recomendaciones** basadas en el tipo de actividad
- **Integración con calendario** de actividades

### 3. **Historial y Análisis**
- **Almacenamiento de datos históricos** en Firebase
- **Análisis de patrones meteorológicos**
- **Estadísticas por ubicación y época**
- **Reportes de condiciones pasadas**

## 🌐 API Open-Meteo

### Configuración de la API
```typescript
// src/services/weather/openMeteoConfig.ts
export const OPEN_METEO_CONFIG = {
  baseUrl: 'https://api.open-meteo.com/v1',
  endpoints: {
    forecast: '/forecast',
    historical: '/archive'
  },
  defaultParams: {
    timezone: 'Europe/Madrid',
    forecast_days: 7,
    daily: [
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'windspeed_10m_max',
      'winddirection_10m_dominant'
    ],
    hourly: [
      'temperature_2m',
      'precipitation',
      'weathercode',
      'windspeed_10m'
    ]
  }
};
```

### Servicio de Weather
```typescript
// src/services/weather/weatherService.ts
export class WeatherService {
  private apiKey: string | null = null; // Open-Meteo es gratuito
  
  async getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
    const url = new URL(OPEN_METEO_CONFIG.baseUrl + OPEN_METEO_CONFIG.endpoints.forecast);
    
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lon.toString());
    url.searchParams.append('current_weather', 'true');
    url.searchParams.append('timezone', OPEN_METEO_CONFIG.defaultParams.timezone);
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseCurrentWeather(data);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw new WeatherServiceError('Failed to fetch current weather');
    }
  }
  
  async getForecast(lat: number, lon: number, days: number = 7): Promise<WeatherForecast> {
    const url = new URL(OPEN_METEO_CONFIG.baseUrl + OPEN_METEO_CONFIG.endpoints.forecast);
    
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lon.toString());
    url.searchParams.append('forecast_days', days.toString());
    url.searchParams.append('daily', OPEN_METEO_CONFIG.defaultParams.daily.join(','));
    url.searchParams.append('hourly', OPEN_METEO_CONFIG.defaultParams.hourly.join(','));
    url.searchParams.append('timezone', OPEN_METEO_CONFIG.defaultParams.timezone);
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseForecast(data);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw new WeatherServiceError('Failed to fetch forecast');
    }
  }
  
  async getHistoricalWeather(
    lat: number, 
    lon: number, 
    startDate: string, 
    endDate: string
  ): Promise<HistoricalWeather> {
    const url = new URL(OPEN_METEO_CONFIG.baseUrl + OPEN_METEO_CONFIG.endpoints.historical);
    
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lon.toString());
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    url.searchParams.append('daily', OPEN_METEO_CONFIG.defaultParams.daily.join(','));
    url.searchParams.append('timezone', OPEN_METEO_CONFIG.defaultParams.timezone);
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Historical API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseHistoricalWeather(data);
    } catch (error) {
      console.error('Error fetching historical weather:', error);
      throw new WeatherServiceError('Failed to fetch historical weather');
    }
  }
  
  private parseCurrentWeather(data: any): CurrentWeather {
    return {
      temperature: data.current_weather.temperature,
      windspeed: data.current_weather.windspeed,
      winddirection: data.current_weather.winddirection,
      weathercode: data.current_weather.weathercode,
      time: new Date(data.current_weather.time),
      description: this.getWeatherDescription(data.current_weather.weathercode)
    };
  }
  
  private parseForecast(data: any): WeatherForecast {
    const daily = data.daily;
    const hourly = data.hourly;
    
    return {
      daily: daily.time.map((date: string, index: number) => ({
        date: new Date(date),
        temperatureMax: daily.temperature_2m_max[index],
        temperatureMin: daily.temperature_2m_min[index],
        precipitation: daily.precipitation_sum[index],
        precipitationProbability: daily.precipitation_probability_max[index],
        windspeed: daily.windspeed_10m_max[index],
        winddirection: daily.winddirection_10m_dominant[index],
        weathercode: daily.weathercode[index],
        description: this.getWeatherDescription(daily.weathercode[index])
      })),
      hourly: hourly.time.map((time: string, index: number) => ({
        time: new Date(time),
        temperature: hourly.temperature_2m[index],
        precipitation: hourly.precipitation[index],
        windspeed: hourly.windspeed_10m[index],
        weathercode: hourly.weathercode[index]
      }))
    };
  }
  
  private getWeatherDescription(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: 'Cielo despejado',
      1: 'Principalmente despejado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Niebla',
      48: 'Niebla con escarcha',
      51: 'Llovizna ligera',
      53: 'Llovizna moderada',
      55: 'Llovizna intensa',
      61: 'Lluvia ligera',
      63: 'Lluvia moderada',
      65: 'Lluvia intensa',
      71: 'Nieve ligera',
      73: 'Nieve moderada',
      75: 'Nieve intensa',
      95: 'Tormenta',
      96: 'Tormenta con granizo ligero',
      99: 'Tormenta con granizo intenso'
    };
    
    return weatherCodes[code] || 'Condición desconocida';
  }
}
```

## 🗂️ Tipos de Datos Meteorológicos

```typescript
// src/types/weather.ts
export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  time: Date;
  description: string;
}

export interface DailyForecast {
  date: Date;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  precipitationProbability: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  description: string;
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  precipitation: number;
  windspeed: number;
  weathercode: number;
}

export interface WeatherForecast {
  daily: DailyForecast[];
  hourly: HourlyForecast[];
}

export interface HistoricalWeather {
  daily: DailyForecast[];
  location: {
    latitude: number;
    longitude: number;
  };
  period: {
    start: Date;
    end: Date;
  };
}

export interface WeatherAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  conditions: string[];
  activityTypes?: string[];
}

export interface LocationWeather {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  current?: CurrentWeather;
  forecast?: WeatherForecast;
  lastUpdated: Date;
}
```

## 🧩 Componentes Meteorológicos

### 1. WeatherWidget
**Propósito**: Widget meteorológico completo para dashboard

```typescript
// src/components/weather/WeatherWidget.tsx
interface WeatherWidgetProps {
  location: string;
  coordinates: { lat: number; lon: number };
  showForecast?: boolean;
  compact?: boolean;
  onLocationChange?: (location: string) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  location,
  coordinates,
  showForecast = true,
  compact = false,
  onLocationChange
}) => {
  const { 
    currentWeather, 
    forecast, 
    loading, 
    error, 
    refreshWeather 
  } = useWeather(coordinates.lat, coordinates.lon);
  
  if (loading) return <WeatherSkeleton />;
  if (error) return <WeatherError onRetry={refreshWeather} />;
  
  return (
    <Box p={4} bg="white" borderRadius="lg" shadow="md">
      <Flex justify="space-between" align="center" mb={4}>
        <VStack align="start" spacing={1}>
          <Text fontSize="lg" fontWeight="bold">{location}</Text>
          <Text fontSize="sm" color="gray.500">
            {formatTime(currentWeather?.time)}
          </Text>
        </VStack>
        <IconButton
          aria-label="Actualizar clima"
          icon={<RefreshIcon />}
          onClick={refreshWeather}
          size="sm"
          variant="ghost"
        />
      </Flex>
      
      {currentWeather && (
        <CurrentWeatherDisplay weather={currentWeather} compact={compact} />
      )}
      
      {showForecast && forecast && (
        <ForecastDisplay forecast={forecast.daily.slice(0, compact ? 3 : 7)} />
      )}
    </Box>
  );
};
```

### 2. ActivityWeatherCheck
**Propósito**: Verificación meteorológica para actividades

```typescript
// src/components/weather/ActivityWeatherCheck.tsx
interface ActivityWeatherCheckProps {
  actividad: Actividad;
  onWeatherAlert?: (alerts: WeatherAlert[]) => void;
}

export const ActivityWeatherCheck: React.FC<ActivityWeatherCheckProps> = ({
  actividad,
  onWeatherAlert
}) => {
  const { forecast, loading } = useWeather(
    actividad.ubicacion.lat,
    actividad.ubicacion.lon
  );
  
  const weatherAlerts = useMemo(() => {
    if (!forecast || !actividad.fechaInicio) return [];
    
    const activityDate = new Date(actividad.fechaInicio);
    const relevantForecast = forecast.daily.find(day => 
      isSameDay(day.date, activityDate)
    );
    
    if (!relevantForecast) return [];
    
    const alerts: WeatherAlert[] = [];
    
    // Verificar precipitación alta
    if (relevantForecast.precipitationProbability > 70) {
      alerts.push({
        type: 'warning',
        message: `Alta probabilidad de lluvia (${relevantForecast.precipitationProbability}%)`,
        conditions: ['lluvia', 'precipitación'],
        activityTypes: ['escalada', 'senderismo']
      });
    }
    
    // Verificar viento fuerte
    if (relevantForecast.windspeed > 30) {
      alerts.push({
        type: 'danger',
        message: `Viento fuerte esperado (${relevantForecast.windspeed} km/h)`,
        conditions: ['viento'],
        activityTypes: ['escalada']
      });
    }
    
    // Verificar temperaturas extremas
    if (relevantForecast.temperatureMax > 35) {
      alerts.push({
        type: 'warning',
        message: `Temperatura muy alta (${relevantForecast.temperatureMax}°C)`,
        conditions: ['calor'],
        activityTypes: ['escalada', 'senderismo']
      });
    }
    
    if (relevantForecast.temperatureMin < 0) {
      alerts.push({
        type: 'warning',
        message: `Riesgo de heladas (${relevantForecast.temperatureMin}°C)`,
        conditions: ['frío', 'hielo'],
        activityTypes: ['escalada', 'senderismo']
      });
    }
    
    return alerts;
  }, [forecast, actividad]);
  
  useEffect(() => {
    if (weatherAlerts.length > 0 && onWeatherAlert) {
      onWeatherAlert(weatherAlerts);
    }
  }, [weatherAlerts, onWeatherAlert]);
  
  if (loading) return <Spinner size="sm" />;
  
  return (
    <VStack align="stretch" spacing={3}>
      {weatherAlerts.map((alert, index) => (
        <Alert key={index} status={alert.type}>
          <AlertIcon />
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
      
      {forecast && (
        <WeatherSummary
          forecast={forecast.daily[0]}
          activityType={actividad.tipo}
        />
      )}
    </VStack>
  );
};
```

### 3. WeatherHistory
**Propósito**: Visualización de historial meteorológico

```typescript
// src/components/weather/WeatherHistory.tsx
interface WeatherHistoryProps {
  location: string;
  coordinates: { lat: number; lon: number };
  dateRange: { start: Date; end: Date };
  showCharts?: boolean;
}

export const WeatherHistory: React.FC<WeatherHistoryProps> = ({
  location,
  coordinates,
  dateRange,
  showCharts = true
}) => {
  const { 
    historicalData, 
    loading, 
    error 
  } = useHistoricalWeather(coordinates, dateRange);
  
  const weatherStats = useMemo(() => {
    if (!historicalData) return null;
    
    const temperatures = historicalData.daily.map(d => d.temperatureMax);
    const precipitations = historicalData.daily.map(d => d.precipitation);
    
    return {
      avgTemperature: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
      maxTemperature: Math.max(...temperatures),
      minTemperature: Math.min(...temperatures),
      totalPrecipitation: precipitations.reduce((a, b) => a + b, 0),
      rainyDays: precipitations.filter(p => p > 0).length
    };
  }, [historicalData]);
  
  if (loading) return <HistorySkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading size="md" mb={4}>
          Historial Meteorológico - {location}
        </Heading>
        <Text color="gray.500">
          Período: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </Text>
      </Box>
      
      {weatherStats && (
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <StatCard
            label="Temp. Media"
            value={`${weatherStats.avgTemperature.toFixed(1)}°C`}
            icon={<TemperatureIcon />}
          />
          <StatCard
            label="Temp. Máxima"
            value={`${weatherStats.maxTemperature}°C`}
            icon={<SunIcon />}
          />
          <StatCard
            label="Temp. Mínima"
            value={`${weatherStats.minTemperature}°C`}
            icon={<SnowIcon />}
          />
          <StatCard
            label="Precipitación"
            value={`${weatherStats.totalPrecipitation.toFixed(1)}mm`}
            icon={<RainIcon />}
          />
          <StatCard
            label="Días de lluvia"
            value={weatherStats.rainyDays.toString()}
            icon={<CloudIcon />}
          />
        </SimpleGrid>
      )}
      
      {showCharts && historicalData && (
        <Box>
          <Tabs>
            <TabList>
              <Tab>Temperatura</Tab>
              <Tab>Precipitación</Tab>
              <Tab>Condiciones</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <TemperatureChart data={historicalData.daily} />
              </TabPanel>
              <TabPanel>
                <PrecipitationChart data={historicalData.daily} />
              </TabPanel>
              <TabPanel>
                <WeatherConditionsChart data={historicalData.daily} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}
    </VStack>
  );
};
```

## 🎣 Custom Hooks Meteorológicos

### 1. useWeather
```typescript
// src/hooks/useWeather.ts
export const useWeather = (lat: number, lon: number) => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const weatherService = useMemo(() => new WeatherService(), []);
  
  const fetchWeather = useCallback(async () => {
    if (!lat || !lon) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [current, forecast] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon),
        weatherService.getForecast(lat, lon)
      ]);
      
      setCurrentWeather(current);
      setForecast(forecast);
      
      // Guardar en cache local
      const cacheKey = `weather-${lat}-${lon}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        current,
        forecast,
        timestamp: Date.now()
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Intentar cargar desde cache si hay error
      const cacheKey = `weather-${lat}-${lon}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { current, forecast, timestamp } = JSON.parse(cached);
        // Usar cache si es reciente (< 1 hora)
        if (Date.now() - timestamp < 3600000) {
          setCurrentWeather(current);
          setForecast(forecast);
          setError(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [lat, lon, weatherService]);
  
  const refreshWeather = useCallback(() => {
    fetchWeather();
  }, [fetchWeather]);
  
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);
  
  return {
    currentWeather,
    forecast,
    loading,
    error,
    refreshWeather
  };
};
```

### 2. useHistoricalWeather
```typescript
// src/hooks/useHistoricalWeather.ts
export const useHistoricalWeather = (
  coordinates: { lat: number; lon: number },
  dateRange: { start: Date; end: Date }
) => {
  const [historicalData, setHistoricalData] = useState<HistoricalWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const weatherService = useMemo(() => new WeatherService(), []);
  
  const fetchHistoricalData = useCallback(async () => {
    if (!coordinates.lat || !coordinates.lon) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startDate = format(dateRange.start, 'yyyy-MM-dd');
      const endDate = format(dateRange.end, 'yyyy-MM-dd');
      
      const data = await weatherService.getHistoricalWeather(
        coordinates.lat,
        coordinates.lon,
        startDate,
        endDate
      );
      
      setHistoricalData(data);
      
      // Guardar historial en Firebase para futuras consultas
      await saveHistoricalDataToFirestore(data, coordinates, dateRange);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Intentar cargar desde Firebase si hay error de API
      try {
        const cachedData = await loadHistoricalDataFromFirestore(coordinates, dateRange);
        if (cachedData) {
          setHistoricalData(cachedData);
          setError(null);
        }
      } catch (firestoreError) {
        console.error('Error loading from Firestore:', firestoreError);
      }
    } finally {
      setLoading(false);
    }
  }, [coordinates, dateRange, weatherService]);
  
  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);
  
  return {
    historicalData,
    loading,
    error,
    refetch: fetchHistoricalData
  };
};
```

## 💾 Almacenamiento de Datos Meteorológicos

### Estructura en Firebase
```typescript
// Colección: weatherHistory
interface WeatherHistoryDocument {
  id: string;
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  date: Date;
  data: {
    temperatureMax: number;
    temperatureMin: number;
    precipitation: number;
    precipitationProbability: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    description: string;
  };
  source: 'open-meteo' | 'manual';
  createdAt: Date;
}

// Funciones de almacenamiento
export const saveWeatherHistory = async (
  location: { lat: number; lon: number; name: string },
  weatherData: DailyForecast[]
): Promise<void> => {
  const batch = writeBatch(db);
  
  weatherData.forEach(day => {
    const docRef = doc(collection(db, 'weatherHistory'));
    batch.set(docRef, {
      location,
      date: day.date,
      data: {
        temperatureMax: day.temperatureMax,
        temperatureMin: day.temperatureMin,
        precipitation: day.precipitation,
        precipitationProbability: day.precipitationProbability,
        windspeed: day.windspeed,
        winddirection: day.winddirection,
        weathercode: day.weathercode,
        description: day.description
      },
      source: 'open-meteo',
      createdAt: new Date()
    });
  });
  
  await batch.commit();
};

export const loadWeatherHistory = async (
  location: { lat: number; lon: number },
  dateRange: { start: Date; end: Date }
): Promise<WeatherHistoryDocument[]> => {
  const q = query(
    collection(db, 'weatherHistory'),
    where('location.lat', '==', location.lat),
    where('location.lon', '==', location.lon),
    where('date', '>=', dateRange.start),
    where('date', '<=', dateRange.end),
    orderBy('date')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as WeatherHistoryDocument));
};
```

## 🚨 Sistema de Alertas Meteorológicas

### Configuración de Alertas
```typescript
// src/services/weather/alertService.ts
export class WeatherAlertService {
  private static alertRules: WeatherAlertRule[] = [
    {
      condition: 'precipitation_probability > 70',
      message: 'Alta probabilidad de lluvia',
      type: 'warning',
      activityTypes: ['escalada', 'senderismo', 'via-ferrata']
    },
    {
      condition: 'windspeed > 30',
      message: 'Viento fuerte',
      type: 'danger',
      activityTypes: ['escalada']
    },
    {
      condition: 'temperature_max > 35',
      message: 'Temperatura muy alta',
      type: 'warning',
      activityTypes: ['escalada', 'senderismo']
    },
    {
      condition: 'temperature_min < 0',
      message: 'Riesgo de heladas',
      type: 'warning',
      activityTypes: ['escalada', 'senderismo']
    }
  ];
  
  static evaluateAlerts(
    forecast: DailyForecast,
    activityType?: string
  ): WeatherAlert[] {
    return this.alertRules
      .filter(rule => 
        !activityType || 
        !rule.activityTypes || 
        rule.activityTypes.includes(activityType)
      )
      .filter(rule => this.evaluateCondition(rule.condition, forecast))
      .map(rule => ({
        type: rule.type,
        message: rule.message,
        conditions: [rule.condition],
        activityTypes: rule.activityTypes
      }));
  }
  
  private static evaluateCondition(condition: string, forecast: DailyForecast): boolean {
    // Evaluar condiciones como "precipitation_probability > 70"
    const parts = condition.split(' ');
    if (parts.length !== 3) return false;
    
    const [field, operator, valueStr] = parts;
    const value = parseFloat(valueStr);
    const forecastValue = this.getFieldValue(field, forecast);
    
    if (forecastValue === undefined) return false;
    
    switch (operator) {
      case '>': return forecastValue > value;
      case '<': return forecastValue < value;
      case '>=': return forecastValue >= value;
      case '<=': return forecastValue <= value;
      case '==': return forecastValue === value;
      default: return false;
    }
  }
  
  private static getFieldValue(field: string, forecast: DailyForecast): number | undefined {
    switch (field) {
      case 'precipitation_probability': return forecast.precipitationProbability;
      case 'windspeed': return forecast.windspeed;
      case 'temperature_max': return forecast.temperatureMax;
      case 'temperature_min': return forecast.temperatureMin;
      case 'precipitation': return forecast.precipitation;
      default: return undefined;
    }
  }
}

interface WeatherAlertRule {
  condition: string;
  message: string;
  type: 'warning' | 'danger' | 'info';
  activityTypes?: string[];
}
```

## 📊 Integración con Actividades

### Consulta Automática del Clima
```typescript
// src/hooks/useActivityWeather.ts
export const useActivityWeather = (actividad: Actividad) => {
  const { forecast } = useWeather(
    actividad.ubicacion?.lat || 0,
    actividad.ubicacion?.lon || 0
  );
  
  const activityWeather = useMemo(() => {
    if (!forecast || !actividad.fechaInicio) return null;
    
    const activityDate = new Date(actividad.fechaInicio);
    return forecast.daily.find(day => 
      isSameDay(day.date, activityDate)
    );
  }, [forecast, actividad.fechaInicio]);
  
  const weatherRecommendations = useMemo(() => {
    if (!activityWeather) return [];
    
    const recommendations: string[] = [];
    
    if (activityWeather.precipitationProbability > 30) {
      recommendations.push('Llevar ropa impermeable');
    }
    
    if (activityWeather.windspeed > 20) {
      recommendations.push('Considerar el viento para la escalada');
    }
    
    if (activityWeather.temperatureMax > 30) {
      recommendations.push('Llevar protección solar y abundante agua');
    }
    
    if (activityWeather.temperatureMin < 10) {
      recommendations.push('Llevar ropa de abrigo');
    }
    
    return recommendations;
  }, [activityWeather]);
  
  return {
    activityWeather,
    weatherRecommendations,
    hasWeatherWarnings: weatherRecommendations.length > 0
  };
};
```

## 🔧 Configuración y Optimización

### Cache de Datos Meteorológicos
```typescript
// src/services/weather/weatherCache.ts
export class WeatherCache {
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
  private static cache = new Map<string, CachedWeatherData>();
  
  static get(lat: number, lon: number): CachedWeatherData | null {
    const key = `${lat}-${lon}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }
  
  static set(lat: number, lon: number, data: WeatherData): void {
    const key = `${lat}-${lon}`;
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  static clear(): void {
    this.cache.clear();
  }
}

interface CachedWeatherData {
  data: WeatherData;
  timestamp: number;
}
```

### Rate Limiting
```typescript
// src/services/weather/rateLimiter.ts
export class WeatherRateLimiter {
  private static requests = new Map<string, number[]>();
  private static readonly MAX_REQUESTS_PER_HOUR = 1000; // Open-Meteo limit
  
  static canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    if (!this.requests.has(endpoint)) {
      this.requests.set(endpoint, []);
    }
    
    const requestTimes = this.requests.get(endpoint)!;
    
    // Limpiar requests antiguos
    const recentRequests = requestTimes.filter(time => time > hourAgo);
    this.requests.set(endpoint, recentRequests);
    
    return recentRequests.length < this.MAX_REQUESTS_PER_HOUR;
  }
  
  static recordRequest(endpoint: string): void {
    if (!this.requests.has(endpoint)) {
      this.requests.set(endpoint, []);
    }
    
    this.requests.get(endpoint)!.push(Date.now());
  }
}
```

---

**Responsable**: Equipo de Meteorología  
**Última Actualización**: 20 de junio de 2025
