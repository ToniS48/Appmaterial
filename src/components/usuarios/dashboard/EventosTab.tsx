/**
 * EventosTab - Componente para mostrar eventos recientes de usuarios
 */
import React from 'react';
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Alert,
  AlertIcon,
  VStack
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventoUsuario, TipoEventoUsuario } from '../../../types/usuarioHistorial';

interface EventosTabProps {
  eventos: EventoUsuario[];
  cargando: boolean;
}

const EventosTab: React.FC<EventosTabProps> = ({ eventos, cargando }) => {  const getBadgeColor = (tipo: TipoEventoUsuario) => {
    switch (tipo) {
      case TipoEventoUsuario.ACTIVACION:
        return 'green';
      case TipoEventoUsuario.DESACTIVACION:
        return 'red';
      case TipoEventoUsuario.APROBACION:
        return 'blue';
      case TipoEventoUsuario.RECHAZO:
        return 'orange';
      case TipoEventoUsuario.REGISTRO:
        return 'purple';
      case TipoEventoUsuario.SUSPENSION:
        return 'red';
      case TipoEventoUsuario.REACTIVACION:
        return 'green';
      case TipoEventoUsuario.CAMBIO_ROL:
        return 'cyan';
      default:
        return 'gray';
    }
  };

  const formatearFecha = (timestamp: any) => {
    if (!timestamp) return 'Sin fecha';
    try {
      const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(fecha, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (cargando) {
    return (
      <Box textAlign="center" py={8}>
        <Text>Cargando eventos...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="lg" fontWeight="bold">
        Eventos Recientes de Usuarios
      </Text>
      
      {eventos.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No hay eventos recientes para mostrar
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Usuario</Th>
                <Th>Evento</Th>
                <Th>Fecha</Th>
                <Th>Detalles</Th>
              </Tr>
            </Thead>
            <Tbody>
              {eventos.map((evento, index) => (
                <Tr key={index}>
                  <Td>{evento.nombreUsuario || evento.usuarioId}</Td>
                  <Td>                    <Badge colorScheme={getBadgeColor(evento.tipoEvento)}>
                      {evento.tipoEvento}
                    </Badge>
                  </Td>
                  <Td>{formatearFecha(evento.fecha)}</Td>
                  <Td>{evento.descripcion || '-'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </VStack>
  );
};

export default EventosTab;
