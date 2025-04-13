import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Flex,
  Button,
  Divider,
  Badge,
  Spinner,
  useColorModeValue,
  Alert,
  AlertIcon,
  Icon
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { InfoIcon, CheckIcon, WarningIcon, TimeIcon } from '@chakra-ui/icons';
import { FaTools, FaCalendarAlt, FaBoxOpen } from 'react-icons/fa';
import { useNotificaciones } from '../../contexts/NotificacionContext';
import { Notificacion } from '../../types/notificacion';
import messages from '../../constants/messages';

const NotificacionPanel: React.FC = () => {
  const { 
    notificaciones, 
    cargando, 
    error, 
    marcarComoLeida, 
    marcarTodasComoLeidas 
  } = useNotificaciones();
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Determinar el icono según el tipo de notificación
  const getNotificacionIcon = (tipo: string) => {
    switch (tipo) {
      case 'material':
        return <Icon as={FaBoxOpen as React.ElementType} color="brand.500" />;
      case 'actividad':
        return <Icon as={FaCalendarAlt as React.ElementType} color="blue.500" />;
      case 'prestamo':
      case 'devolucion':
        return <CheckIcon color="green.500" />;
      case 'incidencia':
        return <WarningIcon color="orange.500" />;
      case 'recordatorio':
        return <TimeIcon color="purple.500" />;
      case 'sistema':
      default:
        return <InfoIcon color="gray.500" />;
    }
  };

  // Formatear fecha de la notificación
  const formatearFecha = (fecha: Date | any) => {
    if (!fecha) return '';
    
    const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
    
    // Si es hoy, mostrar solo la hora
    const hoy = new Date();
    if (fechaObj.toDateString() === hoy.toDateString()) {
      return messages.notificaciones.formatoFecha.hoy.replace(
        '{hora}', 
        fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }
    
    // Si es ayer
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (fechaObj.toDateString() === ayer.toDateString()) {
      return messages.notificaciones.formatoFecha.ayer.replace(
        '{hora}',
        fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }
    
    // Otro día
    return fechaObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Manejar clic en una notificación
  const handleNotificacionClick = (notificacion: Notificacion) => {
    marcarComoLeida(notificacion.id);
    
    // Navegar a la página correspondiente si hay un enlace
    if (notificacion.enlace) {
      navigate(notificacion.enlace);
    }
  };

  // Renderizar una notificación individual
  const renderNotificacion = (notificacion: Notificacion) => (
    <Box
      key={notificacion.id}
      p={3}
      borderRadius="md"
      borderWidth="1px"
      borderColor={notificacion.leida ? borderColor : 'brand.300'}
      bg={notificacion.leida ? bgColor : 'brand.50'}
      _hover={{ bg: hoverBg, cursor: 'pointer' }}
      onClick={() => handleNotificacionClick(notificacion)}
      opacity={notificacion.leida ? 0.8 : 1}
      width="100%"
      position="relative"
    >
      <Flex align="start" gap={3}>
        <Box pt={1}>
          {getNotificacionIcon(notificacion.tipo)}
        </Box>
        <Box flex="1">
          <Text fontSize="sm">
            {notificacion.mensaje}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {formatearFecha(notificacion.fecha)}
          </Text>
        </Box>
        {!notificacion.leida && (
          <Badge colorScheme="brand" fontSize="xs">
            {messages.notificaciones.nueva}
          </Badge>
        )}
      </Flex>
    </Box>
  );

  return (
    <Box width="100%" maxW="400px" bg={bgColor} borderRadius="md" boxShadow="md" overflow="hidden">
      <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="sm">{messages.notificaciones.titulo}</Heading>
          <Button 
            size="xs" 
            onClick={marcarTodasComoLeidas}
            variant="outline"
            isDisabled={cargando || notificaciones.every(n => n.leida)}
          >
            {messages.notificaciones.marcarComoLeidas}
          </Button>
        </Flex>
      </Box>
      
      <Box maxHeight="60vh" overflowY="auto" p={4}>
        {cargando ? (
          <Flex justify="center" p={4}>
            <Spinner size="md" color="brand.500" />
          </Flex>
        ) : error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        ) : notificaciones.length > 0 ? (
          <VStack spacing={3} align="stretch">
            {notificaciones.map(renderNotificacion)}
          </VStack>
        ) : (
          <Flex direction="column" align="center" justify="center" py={6}>
            <Icon as={InfoIcon} boxSize={10} color="gray.400" />
            <Text mt={2} color="gray.500">
              {messages.notificaciones.noHayNotificaciones}
            </Text>
          </Flex>
        )}
      </Box>
      
      <Divider />
      
      <Box p={3} textAlign="center">
        <Button 
          size="sm" 
          variant="ghost" 
          colorScheme="brand"
          onClick={() => navigate('/notificaciones')}
        >
          {messages.notificaciones.verTodas}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificacionPanel;