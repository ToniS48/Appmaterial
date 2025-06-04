import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Flex,
  Button,
  Text,
  Badge,
  Spinner,
  HStack,
  Select,
  Divider,
  Alert,
  AlertIcon,
  Icon,
  useToast
} from '@chakra-ui/react';
import { DeleteIcon, CheckIcon, InfoIcon } from '@chakra-ui/icons';
import { FaBoxOpen, FaCalendarAlt, FaTools } from 'react-icons/fa';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { obtenerNotificacionesUsuario, eliminarNotificacion, marcarNotificacionComoLeida, marcarTodasLeidas } from '../../services/notificacionService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Notificacion, TipoNotificacion } from '../../types/notificacion';
import messages from '../../constants/messages';

const NotificacionesPage: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [mostrarLeidas, setMostrarLeidas] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const toast = useToast();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Función para cargar notificaciones
  const cargarNotificaciones = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setCargando(true);
      const datos = await obtenerNotificacionesUsuario(
        userProfile.uid, 
        mostrarLeidas, 
        100
      );
      setNotificaciones(datos);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar todas las notificaciones',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCargando(false);
    }
  };

  // Cargar notificaciones con filtros
  useEffect(() => {
    cargarNotificaciones();
  }, [userProfile?.uid, mostrarLeidas]);

  // Aplicar filtros
  const notificacionesFiltradas = notificaciones.filter(n => {
    if (filtroTipo && n.tipo !== filtroTipo) return false;
    return true;
  });

  // Eliminar notificación
  const handleEliminarNotificacion = async (id: string) => {
    try {
      await eliminarNotificacion(id);
      setNotificaciones(notificaciones.filter(n => n.id !== id));
      toast({
        title: 'Notificación eliminada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Actualizar contexto
      cargarNotificaciones();
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Marcar notificación como leída
  const handleMarcarComoLeida = async (id: string) => {
    try {
      await marcarNotificacionComoLeida(id);
      
      // Actualizar la notificación en la lista local
      setNotificaciones(prevNotificaciones => 
        prevNotificaciones.map(n => 
          n.id === id ? { ...n, leida: true } : n
        )
      );
      
      toast({
        title: 'Notificación marcada como leída',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Actualizar el contexto global de notificaciones
      cargarNotificaciones();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      toast({
        title: 'Error',
        description: messages.notificaciones.marcarLeidaError,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Marcar todas las notificaciones como leídas
  const handleMarcarTodasComoLeidas = async () => {
    if (!userProfile?.uid) return;
    
    try {
      await marcarTodasLeidas(userProfile.uid);
      
      // Actualizar estado local
      setNotificaciones(prevNotificaciones => 
        prevNotificaciones.map(n => ({ ...n, leida: true }))
      );
      
      toast({
        title: 'Todas las notificaciones marcadas como leídas',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Actualizar contexto global
      cargarNotificaciones();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      toast({
        title: 'Error',
        description: messages.notificaciones.marcarTodasLeidasError,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Manejar clic en una notificación
  const handleNotificacionClick = (notificacion: Notificacion) => {
    // Marcar como leída si aún no lo está
    if (!notificacion.leida) {
      handleMarcarComoLeida(notificacion.id);
    }
    
    // Navegar al enlace si existe
    if (notificacion.enlace) {
      navigate(notificacion.enlace);
    }
  };

  // Obtener icono por tipo
  const getIconoTipo = (tipo: TipoNotificacion) => {
    switch (tipo) {
      case 'material':
        return <Icon as={FaBoxOpen as React.ElementType} color="brand.500" />;
      case 'actividad':
        return <Icon as={FaCalendarAlt as React.ElementType} color="blue.500" />;
      case 'prestamo':
      case 'devolucion':
        return <CheckIcon color="green.500" />;
      case 'incidencia':
        return <Icon as={FaTools as React.ElementType} color="orange.500" />;
      default:
        return <InfoIcon color="gray.500" />;
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha: Date | any) => {
    if (!fecha) return '';
    
    const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
    
    return fechaObj.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout title="Notificaciones">
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
        <Flex justify="space-between" align="center" mb={5}>
          <Heading size="md">{messages.notificaciones.todasLasNotificaciones}</Heading>
          <HStack spacing={4}>
            <Select 
              placeholder="Todos los tipos" 
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              size="sm"
              maxW="200px"
            >
              <option value="material">Material</option>
              <option value="actividad">Actividad</option>
              <option value="prestamo">Préstamo</option>
              <option value="devolucion">Devolución</option>
              <option value="incidencia">Incidencia</option>
              <option value="recordatorio">Recordatorio</option>
              <option value="sistema">Sistema</option>
            </Select>
            
            <Button 
              size="sm" 
              variant={mostrarLeidas ? "solid" : "outline"}
              colorScheme={mostrarLeidas ? "brand" : "gray"}
              onClick={() => setMostrarLeidas(!mostrarLeidas)}
            >
              {mostrarLeidas ? messages.notificaciones.ocultarLeidas : messages.notificaciones.mostrarLeidas}
            </Button>

            <Button
              size="sm"
              colorScheme="brand"
              leftIcon={<CheckIcon />}
              onClick={handleMarcarTodasComoLeidas}
              isDisabled={notificacionesFiltradas.every(n => n.leida) || notificacionesFiltradas.length === 0}
            >
              Marcar todas como leídas
            </Button>
          </HStack>
        </Flex>
        
        <Divider mb={5} />
        
        {cargando ? (
          <Flex justify="center" p={8}>
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : notificacionesFiltradas.length > 0 ? (
          <SimpleGrid spacing={4}>
            {notificacionesFiltradas.map(notificacion => (
              <Box 
                key={notificacion.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor={notificacion.leida ? "gray.200" : "brand.300"}
                bg={notificacion.leida ? "white" : "brand.50"}
                position="relative"
                onClick={() => handleNotificacionClick(notificacion)}
                cursor={notificacion.enlace ? "pointer" : "default"}
                _hover={{
                  bg: notificacion.enlace ? "gray.50" : undefined,
                }}
              >
                <Flex align="start" gap={4}>
                  <Box pt={1}>
                    {getIconoTipo(notificacion.tipo as TipoNotificacion)}
                  </Box>
                  <Box flex="1">
                    <HStack spacing={2} mb={1}>
                      <Badge colorScheme={getColorTipo(notificacion.tipo as TipoNotificacion)}>
                        {getLabelTipo(notificacion.tipo as TipoNotificacion)}
                      </Badge>
                      {!notificacion.leida && (
                        <Badge colorScheme="brand">Nueva</Badge>
                      )}
                    </HStack>
                    <Text fontSize="md">{notificacion.mensaje}</Text>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {formatearFecha(notificacion.fecha)}
                    </Text>
                  </Box>
                  <HStack>
                    {!notificacion.leida && (
                      <Button
                        size="sm"
                        colorScheme="brand"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarcarComoLeida(notificacion.id);
                        }}
                        aria-label="Marcar como leída"
                      >
                        <CheckIcon />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarNotificacion(notificacion.id);
                      }}
                      aria-label="Eliminar notificación"
                    >
                      <DeleteIcon />
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            {messages.notificaciones.notificacionNoEncontrada}
          </Alert>
        )}
      </Box>
    </DashboardLayout>
  );
};

// Funciones auxiliares
const getColorTipo = (tipo: TipoNotificacion): string => {
  switch (tipo) {
    case 'material': return 'brand';
    case 'actividad': return 'blue';
    case 'prestamo': return 'green';
    case 'devolucion': return 'teal';
    case 'incidencia': return 'orange';
    case 'recordatorio': return 'purple';
    case 'sistema': return 'gray';
    default: return 'gray';
  }
};

const getLabelTipo = (tipo: TipoNotificacion): string => {
  switch (tipo) {
    case 'material': return 'Material';
    case 'actividad': return 'Actividad';
    case 'prestamo': return 'Préstamo';
    case 'devolucion': return 'Devolución';
    case 'incidencia': return 'Incidencia';
    case 'recordatorio': return 'Recordatorio';
    case 'sistema': return 'Sistema';
    default: return tipo;
  }
};

export default NotificacionesPage;