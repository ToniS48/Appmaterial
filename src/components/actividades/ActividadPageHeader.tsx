import React from 'react';
import {
  Box, Button, Heading, Text, Flex, Badge, Card, CardBody, HStack, Icon
} from '@chakra-ui/react';
import { FiCalendar, FiMapPin, FiX } from 'react-icons/fi';
import { Actividad } from '../../types/actividad';

interface ActividadPageHeaderProps {
  actividad: Actividad;
  formatDate: (date: any) => string;
  getEstadoColor: (estado: string) => string;
  esResponsable: boolean;
  onCancelarActividad: () => void;
}

/**
 * Componente UI puro para mostrar el encabezado de la página de actividad
 * con información principal y botón de cancelar
 */
export const ActividadPageHeader: React.FC<ActividadPageHeaderProps> = ({
  actividad,
  formatDate,
  getEstadoColor,
  esResponsable,
  onCancelarActividad
}) => {
  return (
    <Card mb={6} borderLeft="8px solid" borderColor={`${getEstadoColor(actividad.estado)}.500`}>
      <CardBody>
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" wrap="wrap">
          <Box mb={{ base: 4, md: 0 }}>
            <Heading as="h1" size="lg">
              {actividad.nombre}
              {actividad.lugar && (
                <Text as="span" fontWeight="normal" fontSize="md" ml={1}>
                  ({actividad.lugar})
                </Text>
              )}
            </Heading>
            
            <Flex align="center" mt={2}>
              <FiCalendar style={{ marginRight: '8px' }} />
              <Text>
                {formatDate(actividad.fechaInicio)} - {formatDate(actividad.fechaFin)}
              </Text>
            </Flex>
            
            <Flex align="center" mt={1}>
              <FiMapPin style={{ marginRight: '8px' }} />
              <Text>{actividad.lugar}</Text>
            </Flex>
            
            <HStack mt={2} spacing={2}>
              {actividad.tipo?.map(tipo => (
                <Badge key={tipo} colorScheme="blue" fontSize="0.8em" borderRadius="full" px={2}>
                  {tipo}
                </Badge>
              ))}
              
              {actividad.subtipo?.map(subtipo => (
                <Badge key={subtipo} colorScheme="teal" fontSize="0.8em" borderRadius="full" px={2}>
                  {subtipo}
                </Badge>
              ))}
              
              {actividad.dificultad && (
                <Badge 
                  colorScheme={
                    actividad.dificultad === 'baja' ? 'green' :
                    actividad.dificultad === 'media' ? 'blue' :
                    'orange'
                  } 
                  fontSize="0.8em" 
                  borderRadius="full" 
                  px={2}
                >
                  Dificultad {actividad.dificultad}
                </Badge>
              )}
            </HStack>
            
            {esResponsable && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
              <Button 
                leftIcon={<Icon as={FiX} />}
                size="sm" 
                colorScheme="red" 
                variant="outline" 
                mt={3}
                onClick={onCancelarActividad}
              >
                Cancelar actividad
              </Button>
            )}
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};
