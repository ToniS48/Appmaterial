import React from 'react';
import {
  Box,
  Badge,
  Text,
  HStack,
  VStack,
  Icon,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { WarningIcon, TimeIcon } from '@chakra-ui/icons';
import { Actividad } from '../../types/actividad';
import { determinarEstadoActividad, toTimestamp } from '../../utils/dateUtils';

interface ActividadConRetrasoIndicadorProps {
  actividad: Actividad;
  showDetails?: boolean;
}

/**
 * Componente que muestra un indicador visual cuando una actividad tiene retraso
 * (está marcada como "en_curso" pero por fecha debería estar "finalizada")
 */
export const ActividadConRetrasoIndicador: React.FC<ActividadConRetrasoIndicadorProps> = ({
  actividad,
  showDetails = false
}) => {
  // Colores del tema
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningBorder = useColorModeValue('orange.200', 'orange.600');
  const warningText = useColorModeValue('orange.800', 'orange.200');
  
  // Verificar si la actividad tiene retraso
  const fechaFinTimestamp = toTimestamp(actividad.fechaFin);
  if (!fechaFinTimestamp) return null;
  
  const estadoEsperado = determinarEstadoActividad(
    toTimestamp(actividad.fechaInicio),
    fechaFinTimestamp,
    actividad.estado
  );
  
  // Solo mostrar si la actividad debería estar finalizada pero está en curso
  if (actividad.estado !== 'en_curso' || estadoEsperado !== 'finalizada') {
    return null;
  }
  
  // Calcular días de retraso
  const hoy = new Date();
  const fechaFin = fechaFinTimestamp.toDate();
  const diasRetraso = Math.floor((hoy.getTime() - fechaFin.getTime()) / (1000 * 60 * 60 * 24));
  
  if (showDetails) {
    return (
      <Box
        bg={warningBg}
        border="1px solid"
        borderColor={warningBorder}
        borderRadius="md"
        p={3}
        mb={2}
      >
        <HStack spacing={2} align="flex-start">
          <Icon as={WarningIcon} color="orange.500" mt={0.5} />
          <VStack align="flex-start" spacing={1} flex={1}>
            <Text fontSize="sm" fontWeight="medium" color={warningText}>
              Actividad con Retraso
            </Text>
            <Text fontSize="xs" color={warningText}>
              Esta actividad finalizó hace {diasRetraso} día{diasRetraso !== 1 ? 's' : ''} 
              pero sigue marcada como "en curso"
            </Text>
            {actividad.necesidadMaterial && (
              <Text fontSize="xs" color={warningText}>
                ⚠️ Puede tener material pendiente de devolución
              </Text>
            )}
          </VStack>
        </HStack>
      </Box>
    );
  }
    // Versión compacta (badge)
  return (
    <Tooltip 
      label={`Actividad con retraso: finalizó hace ${diasRetraso} día${diasRetraso !== 1 ? 's' : ''}`}
      placement="top"
    >
      <Badge
        colorScheme="red"
        variant="subtle"
        display="flex"
        alignItems="center"
        gap={1}
        px={2}
        py={1}
      >
        <Icon as={TimeIcon} boxSize={3} />
        <Text fontSize="xs">
          {diasRetraso}d
        </Text>
      </Badge>
    </Tooltip>
  );
};

/**
 * Hook para determinar si una actividad tiene retraso
 */
export const useActividadConRetraso = (actividad: Actividad) => {
  const fechaFinTimestamp = toTimestamp(actividad.fechaFin);
  if (!fechaFinTimestamp) return { tieneRetraso: false, diasRetraso: 0 };
  
  const estadoEsperado = determinarEstadoActividad(
    toTimestamp(actividad.fechaInicio),
    fechaFinTimestamp,
    actividad.estado
  );
  
  const tieneRetraso = actividad.estado === 'en_curso' && estadoEsperado === 'finalizada';
  
  let diasRetraso = 0;
  if (tieneRetraso) {
    const hoy = new Date();
    const fechaFin = fechaFinTimestamp.toDate();
    diasRetraso = Math.floor((hoy.getTime() - fechaFin.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return { tieneRetraso, diasRetraso };
};

export default ActividadConRetrasoIndicador;
