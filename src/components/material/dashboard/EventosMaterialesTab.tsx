import React from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Progress,
  Alert,
  AlertIcon,
  Spinner
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSend,
  FiRotateCw,
  FiTool,
  FiTrash2,
  FiEye
} from 'react-icons/fi';
import { EventoMaterial } from './types';

interface EventosMaterialesTabProps {
  eventos: EventoMaterial[];
  cargando: boolean;
}

const EventosMaterialesTab: React.FC<EventosMaterialesTabProps> = ({
  eventos,
  cargando
}) => {
  const getIconoEvento = (tipo: EventoMaterial['tipo']) => {
    switch (tipo) {
      case 'creacion': return <FiPlus />;
      case 'prestamo': return <FiSend />;
      case 'devolucion': return <FiRotateCw />;
      case 'mantenimiento': return <FiTool />;
      case 'baja': return <FiTrash2 />;
      case 'revision': return <FiEye />;
      default: return <FiPlus />;
    }
  };

  const getColorEvento = (tipo: EventoMaterial['tipo']) => {
    switch (tipo) {
      case 'creacion': return 'green';
      case 'prestamo': return 'blue';
      case 'devolucion': return 'cyan';
      case 'mantenimiento': return 'orange';
      case 'baja': return 'red';
      case 'revision': return 'purple';
      default: return 'gray';
    }
  };

  const getNombreEvento = (tipo: EventoMaterial['tipo']) => {
    switch (tipo) {
      case 'creacion': return 'Creación';
      case 'prestamo': return 'Préstamo';
      case 'devolucion': return 'Devolución';
      case 'mantenimiento': return 'Mantenimiento';
      case 'baja': return 'Baja';
      case 'revision': return 'Revisión';
      default: return 'Evento';
    }
  };

  if (cargando) {
    return (
      <Box p={6}>
        <VStack spacing={4}>
          <Spinner />
          <Text>Cargando eventos recientes...</Text>
        </VStack>
      </Box>
    );
  }

  if (eventos.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">No hay eventos recientes</Text>
          <Text>No se encontraron eventos de materiales en el período seleccionado.</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          📅 Eventos Recientes de Materiales
        </Text>
        <Text fontSize="sm" color="gray.600">
          Últimas actividades registradas en el sistema de materiales
        </Text>
      </Box>

      {/* Lista de eventos */}
      <VStack spacing={4} align="stretch">
        {eventos.map((evento) => (
          <Card key={evento.id} variant="outline">
            <CardBody>
              <HStack spacing={4} align="start">
                {/* Icono del evento */}
                <Box
                  p={2}
                  borderRadius="full"
                  bg={`${getColorEvento(evento.tipo)}.100`}
                  color={`${getColorEvento(evento.tipo)}.600`}
                >
                  {getIconoEvento(evento.tipo)}
                </Box>

                {/* Contenido del evento */}
                <VStack align="start" spacing={2} flex={1}>
                  <HStack justify="space-between" w="full">
                    <HStack spacing={2}>
                      <Badge colorScheme={getColorEvento(evento.tipo)}>
                        {getNombreEvento(evento.tipo)}
                      </Badge>
                      <Text fontWeight="medium">
                        {evento.materialNombre}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {evento.fecha.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </HStack>

                  <Text fontSize="sm" color="gray.600">
                    {evento.descripcion}
                  </Text>

                  {/* Información del usuario si está disponible */}
                  {evento.usuarioNombre && (
                    <HStack spacing={2}>
                      <Avatar size="xs" name={evento.usuarioNombre} />
                      <Text fontSize="xs" color="gray.500">
                        por {evento.usuarioNombre}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </VStack>

      {/* Resumen de tipos de eventos */}
      <Card>
        <CardBody>
          <Text fontSize="md" fontWeight="bold" mb={4}>
            📊 Resumen de Actividad
          </Text>
          <VStack spacing={3}>
            {Object.entries(
              eventos.reduce((acc, evento) => {
                acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([tipo, cantidad]) => (
              <HStack key={tipo} justify="space-between" w="full">
                <HStack>
                  <Box color={`${getColorEvento(tipo as EventoMaterial['tipo'])}.500`}>
                    {getIconoEvento(tipo as EventoMaterial['tipo'])}
                  </Box>
                  <Text>{getNombreEvento(tipo as EventoMaterial['tipo'])}</Text>
                </HStack>
                <Badge colorScheme={getColorEvento(tipo as EventoMaterial['tipo'])}>
                  {cantidad}
                </Badge>
              </HStack>
            ))}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default EventosMaterialesTab;
