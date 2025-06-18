import React from 'react';
import {
  Box,
  Text,
  Icon,
  Tooltip,
  useColorModeValue,
  HStack
} from '@chakra-ui/react';
import { 
  FiCloud,
  FiSun,
  FiCloudRain,
  FiCloudSnow,
  FiZap,
  FiEye
} from 'react-icons/fi';
import { WeatherData } from '../../services/weatherService';

interface WeatherCompactPreviewProps {
  weatherData: WeatherData[];
  maxDays?: number;
}

/**
 * Componente ultra-compacto para mostrar pronóstico de 7 días
 * Diseñado para integrarse con IconBadge en tarjetas de actividades
 */
const WeatherCompactPreview: React.FC<WeatherCompactPreviewProps> = ({ 
  weatherData, 
  maxDays = 7 
}) => {
  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  if (!weatherData || weatherData.length === 0) {
    return null;
  }

  // Obtener icono según condición meteorológica
  const getWeatherIcon = (condition: WeatherData['condition']) => {
    const iconMap = {
      clear: FiSun,
      clouds: FiCloud,
      rain: FiCloudRain,
      snow: FiCloudSnow,
      thunderstorm: FiZap,
      mist: FiEye,
      unknown: FiCloud
    };
    return iconMap[condition] || FiCloud;
  };

  // Obtener color según condición
  const getWeatherColor = (condition: WeatherData['condition']) => {
    const colorMap = {
      clear: 'orange.400',
      clouds: 'gray.400',
      rain: 'blue.400',
      snow: 'blue.200',
      thunderstorm: 'purple.400',
      mist: 'gray.300',
      unknown: 'gray.400'
    };
    return colorMap[condition] || 'gray.400';
  };

  // Limitar a los días solicitados
  const displayData = weatherData.slice(0, maxDays);

  return (
    <HStack spacing={1} align="center">
      {displayData.map((day, index) => {
        const IconComponent = getWeatherIcon(day.condition);
        const iconColor = getWeatherColor(day.condition);
        
        // Formatear fecha para tooltip
        const dateStr = typeof day.date === 'string' 
          ? new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
          : 'N/A';
        
        const tooltipLabel = [
          `📅 ${dateStr}`,
          `🌤️ ${day.description}`,
          `🌡️ ${Math.round(day.temperature.min)}° - ${Math.round(day.temperature.max)}°C`,
          (day.precipitation && day.precipitation > 0) ? `💧 ${Math.round(day.precipitation)}mm lluvia` : '☀️ Sin lluvia',
          day.windSpeed > 0 ? `💨 ${Math.round(day.windSpeed)}km/h viento` : ''
        ].filter(Boolean).join('\n');

        // Renderizar cada badge individual
        const weatherBadge = (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            p={1}
            borderRadius="md"
            bg={index === 0 ? bgColor : 'transparent'}
            border={index === 0 ? '1px' : 'none'}
            borderColor={index === 0 ? borderColor : 'transparent'}
            cursor="help"
            minW="24px"
            minH="40px"
            maxH="40px"
            _hover={{
              bg: bgColor,
              border: '1px',
              borderColor: borderColor
            }}
          >
            <Icon 
              as={IconComponent} 
              color={iconColor} 
              boxSize="14px"
              mb={0.5}
            />
            <Text fontSize="9px" color={textColor} fontWeight="medium" lineHeight={1}>
              {Math.round(day.temperature.max)}°
            </Text>
            <Text fontSize="8px" color="gray.500" lineHeight={1}>
              {(day.precipitation && day.precipitation > 0) 
                ? `💧${Math.round(day.precipitation)}mm`
                : `${Math.round(day.temperature.min)}°`
              }
            </Text>
          </Box>
        );

        return (
          <Tooltip key={`weather-day-${index}`} label={tooltipLabel} placement="top" fontSize="xs">
            {weatherBadge}
          </Tooltip>
        );
      })}
    </HStack>
  );
};

export default WeatherCompactPreview;
