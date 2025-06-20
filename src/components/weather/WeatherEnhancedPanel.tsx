import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Button,
  Select,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { FiRefreshCw, FiSettings, FiTrendingUp, FiClock, FiCalendar } from 'react-icons/fi';
import { weatherService, WeatherData } from '../../services/weatherService';
import WeatherCard from './WeatherCard';
import WeatherHistoryPanel from './WeatherHistoryPanel';
import { Actividad } from '../../types/actividad';

interface WeatherEnhancedPanelProps {
  actividad: Actividad;
  initialWeatherData: WeatherData[];
}

const WeatherEnhancedPanel: React.FC<WeatherEnhancedPanelProps> = ({
  actividad,
  initialWeatherData
}) => {  // Función para filtrar días relevantes para la actividad
  const filterRelevantWeatherDays = (weatherData: WeatherData[]) => {
    if (!actividad.fechaInicio || !actividad.fechaFin || !weatherData.length) {
      return weatherData;
    }

    let startDate: Date;
    let endDate: Date;
    
    // Manejar tanto Date como Timestamp de Firebase
    if (actividad.fechaInicio instanceof Date) {
      startDate = new Date(actividad.fechaInicio);
    } else {
      startDate = actividad.fechaInicio.toDate();
    }
    
    if (actividad.fechaFin instanceof Date) {
      endDate = new Date(actividad.fechaFin);
    } else {
      endDate = actividad.fechaFin.toDate();
    }

    // Calcular rango relevante: 3 días antes del inicio hasta el final de la actividad
    const rangeStart = new Date(startDate);
    rangeStart.setDate(rangeStart.getDate() - 3); // 3 días antes del inicio
    
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999); // Final del último día

    // Filtrar datos meteorológicos que estén en el rango relevante
    const filteredData = weatherData.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= rangeStart && dayDate <= rangeEnd;
    });

    console.log('🗓️ Filtro meteorológico:', {
      actividadInicio: startDate.toISOString().split('T')[0],
      actividadFin: endDate.toISOString().split('T')[0],
      rangoInicio: rangeStart.toISOString().split('T')[0],
      rangoFin: rangeEnd.toISOString().split('T')[0],
      diasOriginales: weatherData.length,
      diasFiltrados: filteredData.length
    });

    return filteredData;
  };

  // Calcular días óptimos para la actividad (ahora solo para la API, no para el filtro)
  const calculateOptimalDays = () => {
    if (!actividad.fechaInicio || !actividad.fechaFin) return 5;
    
    let startDate: Date;
    let endDate: Date;
    
    // Manejar tanto Date como Timestamp de Firebase
    if (actividad.fechaInicio instanceof Date) {
      startDate = new Date(actividad.fechaInicio);
    } else {
      startDate = actividad.fechaInicio.toDate();
    }
    
    if (actividad.fechaFin instanceof Date) {
      endDate = new Date(actividad.fechaFin);
    } else {
      endDate = actividad.fechaFin.toDate();
    }
    
    // Calcular días de duración de la actividad
    const activityDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Solicitar días de actividad + 3 anteriores + 2 buffer, máximo 10
    return Math.min(activityDays + 5, 10);
  };
  
  const [rawWeatherData, setRawWeatherData] = useState<WeatherData[]>(initialWeatherData);
  // Datos filtrados para mostrar
  const weatherData = filterRelevantWeatherDays(rawWeatherData);
  const [selectedDays, setSelectedDays] = useState<number>(calculateOptimalDays());
  const [preferredSource, setPreferredSource] = useState<'auto' | 'aemet' | 'open-meteo'>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAemetAvailable, setIsAemetAvailable] = useState(false);
  const [actualSource, setActualSource] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [historicalRain, setHistoricalRain] = useState<number | null>(null);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  // Función para obtener precipitación histórica de los 7 días anteriores
  const fetchHistoricalRain = async () => {
    if (!actividad.fechaInicio || (!actividad.lugar && !actividad.ubicacionLat)) {
      return;
    }

    setLoadingHistorical(true);
      try {
      // Calcular fechas: 7 días antes del inicio de la actividad
      let startDate: Date;
      
      // Manejar tanto Date como Timestamp de Firebase
      if (actividad.fechaInicio instanceof Date) {
        startDate = new Date(actividad.fechaInicio);
      } else {
        // Es un Timestamp de Firebase
        startDate = actividad.fechaInicio.toDate();
      }
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() - 1); // Un día antes del inicio
      startDate.setDate(startDate.getDate() - 7); // 7 días antes del inicio

      // Determinar ubicación
      let location: { lat: number; lon: number };
      if (actividad.ubicacionLat && actividad.ubicacionLon) {
        location = { lat: actividad.ubicacionLat, lon: actividad.ubicacionLon };
      } else if (actividad.lugar) {
        // Obtener coordenadas desde el nombre de ubicación
        const coords = await weatherService.getCoordinatesFromLocation(actividad.lugar);
        if (!coords) {
          console.warn('No se pudieron obtener coordenadas para:', actividad.lugar);
          return;
        }
        location = coords;
      } else {
        return;
      }

      // Formatear fechas para la API (YYYY-MM-DD)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Llamar a la API de datos históricos de Open-Meteo
      const params = new URLSearchParams({
        latitude: location.lat.toString(),
        longitude: location.lon.toString(),
        start_date: startDateStr,
        end_date: endDateStr,
        daily: 'precipitation_sum',
        timezone: 'auto'
      });

      const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
      console.log('🌦️ Petición datos históricos:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error en API histórica: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.daily && data.daily.precipitation_sum) {
        // Calcular precipitación total de los 7 días anteriores
        const totalRain = data.daily.precipitation_sum.reduce((sum: number, rain: number | null) => {
          return sum + (rain || 0);
        }, 0);
        
        setHistoricalRain(totalRain);
        console.log('🌧️ Precipitación histórica 7 días previos:', totalRain, 'mm');
      }
    } catch (error) {
      console.error('Error obteniendo precipitación histórica:', error);
      setHistoricalRain(null);
    } finally {
      setLoadingHistorical(false);
    }
  };

  // Verificar disponibilidad de AEMET al cargar
  useEffect(() => {
    const checkAemetAvailability = () => {
      const isEnabled = weatherService.isAemetEnabled();
      setIsAemetAvailable(isEnabled);
    };

    checkAemetAvailability();
    
    // Obtener precipitación histórica al cargar el componente
    fetchHistoricalRain();
  }, []);

  // Función para obtener datos meteorológicos con configuración específica
  const fetchWeatherData = async () => {
    if (!actividad.lugar && !actividad.ubicacionLat) {
      setError('No hay ubicación disponible para obtener datos meteorológicos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtener configuración actual
      const currentConfig = weatherService.getConfig();
      
      // Determinar ubicación
      let location: string | { lat: number; lon: number };
      if (actividad.ubicacionLat && actividad.ubicacionLon) {
        location = { lat: actividad.ubicacionLat, lon: actividad.ubicacionLon };
      } else {
        location = actividad.lugar || '';
      }

      // Configurar fuente preferida temporalmente
      const tempConfig = { ...currentConfig };
      
      if (preferredSource === 'aemet') {
        tempConfig.aemet.enabled = isAemetAvailable;
        tempConfig.aemet.useForSpain = true;
        setActualSource('AEMET');
      } else if (preferredSource === 'open-meteo') {
        tempConfig.aemet.enabled = false;
        tempConfig.aemet.useForSpain = false;
        setActualSource('Open-Meteo');
      } else {
        // Auto: usar configuración actual
        setActualSource('Automático');
      }

      // Aplicar configuración temporal
      await weatherService.configure(tempConfig);      // Obtener datos
      const forecast = await weatherService.getWeatherForecast(location, selectedDays);      if (forecast && forecast.daily) {
        setRawWeatherData(forecast.daily);
        
        // Determinar fuente real utilizada basándose en la configuración y ubicación
        if (preferredSource === 'auto') {
          // Intentar detectar si es España para mostrar información más precisa
          const locationName = actividad.lugar?.toLowerCase() || '';
          const isSpainish = locationName.includes('españa') || 
                           locationName.includes('spain') || 
                           locationName.includes('madrid') || 
                           locationName.includes('barcelona') ||
                           locationName.includes('sevilla') ||
                           locationName.includes('valencia');
          
          if (isSpainish && isAemetAvailable && currentConfig.aemet.useForSpain) {
            setActualSource('AEMET (automático)');
          } else {
            setActualSource('Open-Meteo (automático)');
          }
        }
      } else {
        setError('No se pudieron obtener datos meteorológicos');
      }

      // Restaurar configuración original
      await weatherService.configure(currentConfig);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo datos meteorológicos');
      console.error('Error en WeatherEnhancedPanel:', err);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar datos cuando cambian los parámetros
  useEffect(() => {
    if (selectedDays !== 5 || preferredSource !== 'auto') {
      fetchWeatherData();
    }
  }, [selectedDays, preferredSource]);

  const handleRefresh = () => {
    // Limpiar caché para forzar actualización
    weatherService.clearCache();
    fetchWeatherData();
  };
  return (
    <VStack align="stretch" spacing={4}>
      {/* Encabezado con controles */}
      <Box>
        <HStack justify="space-between" align="center" mb={3}>
          <Text fontWeight="semibold" fontSize="sm" color="gray.600">
            Información meteorológica
          </Text>
          
          <HStack spacing={2}>
            {actualSource && (
              <Badge
                colorScheme={
                  actualSource.includes('AEMET') ? 'blue' : 
                  actualSource.includes('Open-Meteo') ? 'green' : 'gray'
                }
                size="sm"
              >
                {actualSource}
              </Badge>
            )}
              <Tooltip label="Actualizar datos">
              <IconButton
                aria-label="Actualizar"
                icon={<FiRefreshCw />}
                size="xs"
                variant="outline"
                onClick={handleRefresh}
                isLoading={loading}
              />
            </Tooltip>

            <Tooltip label="Opciones avanzadas">
              <IconButton
                aria-label="Configuración avanzada"
                icon={<FiSettings />}
                size="xs"
                variant={showAdvanced ? "solid" : "outline"}
                colorScheme={showAdvanced ? "blue" : "gray"}
                onClick={() => setShowAdvanced(!showAdvanced)}
              />
            </Tooltip>          </HStack>
        </HStack>

        {/* Panel de configuración avanzada */}
        {showAdvanced && (
          <Box bg="gray.50" p={3} borderRadius="md" mb={3}>
            <Text fontSize="sm" fontWeight="semibold" mb={3}>
              ⚙️ Configuración avanzada
            </Text>
            
            <VStack spacing={3} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="enable-comparison" mb="0" fontSize="sm">
                  Mostrar comparación de fuentes
                </FormLabel>
                <Switch 
                  id="enable-comparison" 
                  size="sm"
                  isChecked={false}
                  isDisabled={!isAemetAvailable}
                />
              </FormControl>

              {isAemetAvailable && (
                <Box bg="blue.50" p={2} borderRadius="md">
                  <Text fontSize="xs" color="blue.700">
                    💡 Con AEMET disponible, puedes comparar las predicciones de ambas fuentes 
                    para ubicaciones en España.
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        )}        {/* Controles de configuración */}
        <HStack spacing={3} mb={3} wrap="wrap">
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>Días de pronóstico</Text>
            <Select
              size="sm"
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              width="110px"
            >
              <option value={3}>3 días</option>
              <option value={5}>5 días</option>
              <option value={7}>7 días</option>
              {/* Solo mostrar opciones largas en pantallas grandes */}
              <option value={10}>10 días</option>
            </Select>
          </Box>

          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>Fuente de datos</Text>
            <Select
              size="sm"
              value={preferredSource}
              onChange={(e) => setPreferredSource(e.target.value as 'auto' | 'aemet' | 'open-meteo')}
              width="140px"
            >
              <option value="auto">Automático</option>
              {isAemetAvailable && <option value="aemet">AEMET</option>}
              <option value="open-meteo">Open-Meteo</option>
            </Select>
          </Box>
        </HStack>        {/* Información sobre las fuentes */}
        <Box bg="gray.50" p={3} borderRadius="md" mb={3}>
          <Text fontSize="xs" color="gray.600" mb={2}>
            <strong>📡 Fuentes meteorológicas disponibles:</strong>
          </Text>
          <VStack align="start" spacing={2}>
            <HStack spacing={2}>
              <Badge colorScheme="blue" size="sm">AEMET</Badge>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="gray.600">
                  Agencia Estatal de Meteorología española
                  {!isAemetAvailable && ' - No disponible'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  • Datos oficiales • Solo España • Alta precisión local
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Badge colorScheme="green" size="sm">Open-Meteo</Badge>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="gray.600">
                  API meteorológica de código abierto
                </Text>
                <Text fontSize="xs" color="gray.500">
                  • Cobertura global • Gratuito • Modelos europeos
                </Text>
              </VStack>
            </HStack>
          </VStack>
          
          {preferredSource === 'auto' && (
            <Box mt={2} p={2} bg="blue.50" borderRadius="md">
              <Text fontSize="xs" color="blue.700">
                🤖 <strong>Modo automático:</strong> Se usa AEMET para España cuando está disponible, 
                Open-Meteo para el resto del mundo.
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Pestañas principales */}
      <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
        <TabList mb={4}>
          <Tab fontSize="xs">
            <HStack spacing={1}>
              <FiCalendar size={12} />
              <Text>Pronóstico</Text>
            </HStack>
          </Tab>
          <Tab fontSize="xs">
            <HStack spacing={1}>
              <FiClock size={12} />
              <Text>Historial</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Pestaña de Pronóstico */}
          <TabPanel px={0} py={0}>
            {/* Indicador de rango de días mostrados */}
            {weatherData.length > 0 && (
              <Box bg="blue.50" p={2} borderRadius="md" mb={3}>
                <Text fontSize="xs" color="blue.700">
                  📅 Mostrando: <strong>3 días antes</strong> + <strong>días de la actividad</strong> 
                  {weatherData.length > 0 && ` (${weatherData.length} días total)`}
                </Text>
              </Box>
            )}

            {/* Contenido meteorológico */}
            {loading ? (
              <Box textAlign="center" py={6}>
                <Spinner size="md" />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Obteniendo datos meteorológicos...
                </Text>
              </Box>
            ) : error ? (
              <Alert status="error" size="sm">
                <AlertIcon />
                <Text fontSize="sm">{error}</Text>
              </Alert>      ) : (
              <WeatherCard 
                weatherData={weatherData} 
                compact={false}
                showDates={true}
                activityStartDate={
                  actividad.fechaInicio instanceof Date 
                    ? actividad.fechaInicio 
                    : actividad.fechaInicio?.toDate()
                }
                activityEndDate={
                  actividad.fechaFin instanceof Date 
                    ? actividad.fechaFin 
                    : actividad.fechaFin?.toDate()
                }
              />
            )}      {/* Información adicional y estadísticas */}
            {weatherData.length > 0 && !loading && !error && (
              <VStack spacing={3} mt={4}>
                {/* Información básica */}
                <Box bg="blue.50" p={3} borderRadius="md" width="100%">
                  <Text fontSize="xs" color="blue.700">
                    <strong>ℹ️ Información:</strong> Se muestran {weatherData.length} días de pronóstico 
                    {actividad.lugar && ` para ${actividad.lugar}`}. 
                    Los datos se actualizan automáticamente cada 10 minutos.
                  </Text>
                </Box>          {/* Estadísticas del pronóstico */}
                {weatherData.length >= 3 && (
                  <Box bg="gray.50" p={3} borderRadius="md" width="100%">
                    <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={2}>
                      📊 Resumen del periodo:
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="gray.600" wrap="wrap">
                      <VStack spacing={0} align="start">
                        <Text><strong>Temp. máxima:</strong></Text>
                        <Text color="red.600">
                          {Math.max(...weatherData.map(d => d.temperature.max))}°C
                        </Text>
                      </VStack>
                      <VStack spacing={0} align="start">
                        <Text><strong>Temp. mínima:</strong></Text>
                        <Text color="blue.600">
                          {Math.min(...weatherData.map(d => d.temperature.min))}°C
                        </Text>
                      </VStack>
                      <VStack spacing={0} align="start">
                        <Text><strong>Precipitación total:</strong></Text>
                        <Text color="blue.500">
                          {weatherData.reduce((sum, d) => sum + (d.precipitation || 0), 0).toFixed(1)} mm
                        </Text>
                      </VStack>
                      <VStack spacing={0} align="start">
                        <Text><strong>Viento máximo:</strong></Text>
                        <Text color="gray.600">
                          {Math.max(...weatherData.map(d => d.windSpeed))} km/h
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {/* Precipitación de los 7 días anteriores */}
                    <Box mt={3} pt={2} borderTop="1px solid" borderColor="gray.200">
                      <HStack spacing={2} align="center" mb={1}>
                        <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                          🌧️ Lluvia 7 días previos al inicio:
                        </Text>
                        {loadingHistorical && <Spinner size="xs" />}
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        {loadingHistorical 
                          ? 'Obteniendo datos históricos...' 
                          : historicalRain !== null 
                            ? `${historicalRain.toFixed(1)} mm acumulados`
                            : 'No disponible'
                        }
                      </Text>                {historicalRain !== null && historicalRain > 0 && (
                        <Text fontSize="xs" color="blue.600" mt={1}>
                          💡 Terreno podría estar húmedo al inicio de la actividad
                        </Text>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Alertas meteorológicas */}
                {(() => {
                  const alerts = [];
                  const maxTemp = Math.max(...weatherData.map(d => d.temperature.max));
                  const totalRain = weatherData.reduce((sum, d) => sum + (d.precipitation || 0), 0);
                  const maxWind = Math.max(...weatherData.map(d => d.windSpeed));
                  
                  if (maxTemp > 35) alerts.push('🌡️ Temperaturas muy altas esperadas');
                  if (maxTemp < 0) alerts.push('🧊 Temperaturas bajo cero');
                  if (totalRain > 20) alerts.push('🌧️ Lluvia significativa esperada');
                  if (maxWind > 50) alerts.push('💨 Vientos fuertes previstos');
                  
                  return alerts.length > 0 && (
                    <Alert status="warning" size="sm">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" fontWeight="semibold">Avisos meteorológicos:</Text>
                        {alerts.map((alert, index) => (
                          <Text key={index} fontSize="xs">{alert}</Text>
                        ))}
                      </VStack>
                    </Alert>
                  );
                })()}
              </VStack>
            )}
          </TabPanel>

          {/* Pestaña de Historial */}
          <TabPanel px={0} py={0}>
            <WeatherHistoryPanel actividad={actividad} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default WeatherEnhancedPanel;
