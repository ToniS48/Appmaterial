import React from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  Badge,
  Tooltip,
  useColorModeValue,
  VStack,
  HStack,
  Icon
} from '@chakra-ui/react';
import { 
  FiDroplet, 
  FiWind, 
  FiThermometer,
  FiCloud,
  FiSun,
  FiCloudRain,
  FiCloudSnow,
  FiZap,
  FiEye
} from 'react-icons/fi';
import { WeatherData } from '../../services/weatherService';

interface WeatherCardProps {
  weatherData: WeatherData[];
  compact?: boolean;
  showDates?: boolean;
}

interface WeatherIconProps {
  condition: WeatherData['condition'];
  size?: number;
}

/**
 * Componente para mostrar icono según condición meteorológica
 */
const WeatherIcon: React.FC<WeatherIconProps> = ({ condition, size = 20 }) => {
  const iconMap = {
    clear: FiSun,
    clouds: FiCloud,
    rain: FiCloudRain,
    snow: FiCloudSnow,
    thunderstorm: FiZap,
    mist: FiEye,
    unknown: FiCloud
  };

  const colorMap = {
    clear: 'yellow.500',
    clouds: 'gray.500',
    rain: 'blue.500',
    snow: 'blue.200',
    thunderstorm: 'purple.500',
    mist: 'gray.400',
    unknown: 'gray.500'
  };

  const IconComponent = iconMap[condition];
  const iconColor = colorMap[condition];

  return <Icon as={IconComponent} color={iconColor} boxSize={size} />;
};

/**
 * Componente principal para mostrar información meteorológica
 */
const WeatherCard: React.FC<WeatherCardProps> = ({ 
  weatherData, 
  compact = false,
  showDates = true 
}) => {
  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  
  // Pre-calcular valores de color para evitar hooks en callbacks
  const dayCardBg = useColorModeValue('white', 'gray.800');
  const dayCardBorder = useColorModeValue('gray.200', 'gray.600');

  if (!weatherData || weatherData.length === 0) {
    return null;
  }

  // Modo compacto para cards de actividad
  if (compact) {
    const firstDay = weatherData[0];
    
    return (
      <Tooltip 
        label={`${firstDay.description} - ${Math.round(firstDay.temperature.min)}°/${Math.round(firstDay.temperature.max)}°C`}
        placement="top"
      >
        <Flex 
          align="center" 
          gap={1}
          p={1}
          borderRadius="md"
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          cursor="help"
        >
          <WeatherIcon condition={firstDay.condition} size={16} />
          <Text fontSize="xs" color={textColor} fontWeight="medium">
            {Math.round(firstDay.temperature.min)}°-{Math.round(firstDay.temperature.max)}°C
          </Text>          {firstDay.precipitation && firstDay.precipitation > 0 && (
            <Icon as={FiDroplet} color="blue.500" boxSize={3} />
          )}
        </Flex>
      </Tooltip>
    );
  }

  // Modo completo para vista detallada
  return (
    <Box
      p={4}
      borderRadius="lg"
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      width="100%"
    >
      <Flex align="center" gap={2} mb={3}>
        <Icon as={FiCloud} color="blue.500" boxSize={5} />
        <Text fontWeight="bold" color={textColor}>
          Pronóstico del tiempo
        </Text>
      </Flex>

      <VStack spacing={3} align="stretch">
        {weatherData.map((day, index) => (            <Box
            key={day.date}
            p={3}
            borderRadius="md"
            bg={dayCardBg}
            border="1px"
            borderColor={dayCardBorder}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
              {/* Fecha y condición */}
              <Flex align="center" gap={3} flex={1}>
                <WeatherIcon condition={day.condition} size={24} />
                <VStack align="start" spacing={0}>
                  {showDates && (
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {index === 0 ? 'Hoy' : 
                       index === 1 ? 'Mañana' : 
                       new Date(day.date).toLocaleDateString('es-ES', { 
                         weekday: 'short', 
                         day: 'numeric', 
                         month: 'short' 
                       })
                      }
                    </Text>
                  )}
                  <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                    {day.description}
                  </Text>
                </VStack>
              </Flex>

              {/* Temperatura */}
              <Flex align="center" gap={1}>
                <Icon as={FiThermometer} color="red.500" boxSize={4} />
                <Text fontWeight="bold" color={textColor}>
                  {Math.round(day.temperature.min)}° / {Math.round(day.temperature.max)}°C
                </Text>
              </Flex>

              {/* Detalles adicionales */}
              <HStack spacing={3} flexWrap="wrap">
                {/* Humedad */}                <Tooltip label="Humedad">
                  <Flex align="center" gap={1}>
                    <Icon as={FiDroplet} color="blue.400" boxSize={3} />
                    <Text fontSize="xs" color={textColor}>
                      {day.humidity}%
                    </Text>
                  </Flex>
                </Tooltip>

                {/* Viento */}
                <Tooltip label="Velocidad del viento">
                  <Flex align="center" gap={1}>
                    <Icon as={FiWind} color="gray.500" boxSize={3} />
                    <Text fontSize="xs" color={textColor}>
                      {Math.round(day.windSpeed)} km/h
                    </Text>
                  </Flex>
                </Tooltip>

                {/* Precipitación */}
                {day.precipitation && day.precipitation > 0 && (
                  <Badge colorScheme="blue" fontSize="xs">
                    {day.precipitation.toFixed(1)}mm
                  </Badge>
                )}
              </HStack>
            </Flex>
          </Box>
        ))}
      </VStack>      {/* Nota informativa */}
      <Text fontSize="xs" color="gray.500" mt={3} textAlign="center">
        Pronóstico proporcionado por Open-Meteo
      </Text>
    </Box>
  );
};

export default WeatherCard;
