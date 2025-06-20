import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Select,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  IconButton,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { FiRefreshCw, FiClock } from 'react-icons/fi';
import WeatherCard from './WeatherCard';
import { Actividad } from '../../types/actividad';
import { useHistoricalWeather } from '../../hooks/useHistoricalWeather';

interface WeatherHistoryPanelProps {
  actividad: Actividad;
}

const WeatherHistoryPanel: React.FC<WeatherHistoryPanelProps> = ({
  actividad
}) => {  const [daysBack, setDaysBack] = useState<number>(7);

  const bgColor = useColorModeValue('orange.50', 'orange.900');
  const borderColor = useColorModeValue('orange.200', 'orange.700');

  // Usar el hook personalizado para datos históricos
  const {
    historicalData,
    loading,
    error,
    loadHistoricalData,
    clearError,
    isEnabled
  } = useHistoricalWeather(actividad, {
    loadOnMount: true,
    daysBack,
    debug: true
  });

  const handleRefresh = () => {
    clearError();
    loadHistoricalData();
  };

  const handleDaysBackChange = (newDaysBack: number) => {
    setDaysBack(newDaysBack);
    // El hook se recargará automáticamente cuando cambie daysBack
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* Encabezado */}
      <Box bg={bgColor} p={3} borderRadius="md" border="1px" borderColor={borderColor}>
        <HStack justify="space-between" align="center" mb={2}>
          <HStack spacing={2}>
            <FiClock />
            <Text fontWeight="semibold" fontSize="sm" color="orange.700">
              Historial Meteorológico
            </Text>
          </HStack>
          
          <HStack spacing={2}>
            <Tooltip label="Actualizar datos históricos">
              <IconButton
                aria-label="Actualizar"
                icon={<FiRefreshCw />}
                size="xs"
                variant="outline"
                colorScheme="orange"
                onClick={handleRefresh}
                isLoading={loading}
              />
            </Tooltip>
          </HStack>
        </HStack>

        <Text fontSize="xs" color="orange.600">
          📅 Datos meteorológicos de los días anteriores al inicio de la actividad
        </Text>
      </Box>

      {/* Controles */}
      <HStack spacing={3} wrap="wrap">
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>Días hacia atrás</Text>            <Select
              size="sm"
              value={daysBack}
              onChange={(e) => handleDaysBackChange(Number(e.target.value))}
              width="120px"
            >
            <option value={3}>3 días</option>
            <option value={5}>5 días</option>
            <option value={7}>7 días</option>
            <option value={10}>10 días</option>
            <option value={14}>14 días</option>
          </Select>
        </Box>

        <Badge colorScheme="orange" size="sm" alignSelf="end" mb={1}>
          Datos históricos
        </Badge>
      </HStack>

      <Divider />

      {/* Contenido */}
      {loading ? (
        <Box textAlign="center" py={6}>
          <Spinner size="md" color="orange.500" />
          <Text fontSize="sm" color="gray.500" mt={2}>
            Obteniendo datos históricos...
          </Text>
        </Box>
      ) : error ? (
        <Alert status="error" size="sm">
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      ) : historicalData.length > 0 ? (
        <>
          {/* Tarjetas de datos históricos */}
          <WeatherCard 
            weatherData={historicalData} 
            compact={false}
            showDates={true}
          />

          {/* Información adicional */}
          <VStack spacing={3}>
            {/* Información del periodo */}
            <Box bg="gray.50" p={3} borderRadius="md" width="100%">
              <Text fontSize="xs" color="gray.700" mb={2}>
                📊 <strong>Resumen del periodo histórico:</strong>
              </Text>
              <HStack spacing={4} fontSize="xs" color="gray.600" wrap="wrap">
                <VStack spacing={0} align="start">
                  <Text><strong>Temp. máxima:</strong></Text>
                  <Text color="red.600">
                    {Math.max(...historicalData.map(d => d.temperature.max))}°C
                  </Text>
                </VStack>
                <VStack spacing={0} align="start">
                  <Text><strong>Temp. mínima:</strong></Text>
                  <Text color="blue.600">
                    {Math.min(...historicalData.map(d => d.temperature.min))}°C
                  </Text>
                </VStack>
                <VStack spacing={0} align="start">
                  <Text><strong>Precipitación total:</strong></Text>
                  <Text color="blue.500">
                    {historicalData.reduce((sum, d) => sum + (d.precipitation || 0), 0).toFixed(1)} mm
                  </Text>
                </VStack>
                <VStack spacing={0} align="start">
                  <Text><strong>Días con lluvia:</strong></Text>
                  <Text color="blue.500">
                    {historicalData.filter(d => (d.precipitation || 0) > 0.1).length}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Alertas e insights */}
            {(() => {
              const insights = [];
              const avgTemp = historicalData.reduce((sum, d) => sum + (d.temperature.max + d.temperature.min) / 2, 0) / historicalData.length;
              const totalRain = historicalData.reduce((sum, d) => sum + (d.precipitation || 0), 0);
              const rainyDays = historicalData.filter(d => (d.precipitation || 0) > 0.1).length;
              
              if (totalRain > 20) {
                insights.push('🌧️ Ha llovido significativamente en los días previos - posible terreno húmedo');
              }
              if (rainyDays >= historicalData.length * 0.6) {
                insights.push('☔ Periodo muy lluvioso - considerar condiciones del terreno');
              }
              if (avgTemp < 5) {
                insights.push('🧊 Temperaturas frías recientes - posible hielo matutino');
              }
              if (avgTemp > 30) {
                insights.push('🌡️ Periodo muy cálido - terreno seco esperado');
              }
              
              return insights.length > 0 && (
                <Alert status="info" size="sm">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="semibold">💡 Insights del periodo histórico:</Text>
                    {insights.map((insight, index) => (
                      <Text key={index} fontSize="xs">{insight}</Text>
                    ))}
                  </VStack>
                </Alert>
              );
            })()}

            {/* Nota informativa */}
            <Box bg="orange.50" p={3} borderRadius="md" width="100%">
              <Text fontSize="xs" color="orange.700">
                <strong>ℹ️ Acerca de los datos históricos:</strong> Esta información proviene de 
                registros meteorológicos reales de Open-Meteo y puede ser útil para entender 
                las condiciones del terreno y clima previo a la actividad.
              </Text>
            </Box>
          </VStack>
        </>
      ) : (
        <Box textAlign="center" py={6}>
          <Text fontSize="sm" color="gray.500">
            No hay datos históricos disponibles para este periodo
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default WeatherHistoryPanel;
