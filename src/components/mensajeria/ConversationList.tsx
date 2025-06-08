import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Badge,
  Spinner,
  Center,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Tooltip,
  Divider,
  Alert,
  AlertIcon,
  Button,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiUsers,
  FiMessageCircle,
  FiSettings,
  FiMoreVertical,
  FiEye,
  FiEyeOff,
  FiUserX,
  FiPlus,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Conversacion, TipoConversacion } from '../../types/mensaje';
import { useMensajeria } from '../../contexts/MensajeriaContext';
import { useAuth } from '../../contexts/AuthContext';

interface ConversationListProps {
  onSeleccionarConversacion: (conversacion: Conversacion) => void;
  onCrearConversacion?: () => void;
  height?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSeleccionarConversacion,
  onCrearConversacion,
  height = "400px"
}) => {
  const { conversaciones, conversacionActual, cargandoConversaciones, salirConversacion, seleccionarConversacion } = useMensajeria();
  const { userProfile } = useAuth();
  
  // Estados
  const [filtro, setFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoConversacion | 'todas'>('todas');
    // Colores del tema
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverColor = useColorModeValue('gray.50', 'gray.700');
  const selectedColor = useColorModeValue('brand.50', 'brand.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const scrollbarThumbColor = useColorModeValue('#CBD5E0', '#4A5568');

  // Filtrar conversaciones
  const conversacionesFiltradas = useMemo(() => {
    return conversaciones.filter(conversacion => {
      const cumpleFiltroTexto = conversacion.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
                                conversacion.descripcion?.toLowerCase().includes(filtro.toLowerCase());
      
      const cumpleFiltroTipo = tipoFiltro === 'todas' || conversacion.tipo === tipoFiltro;
      
      return cumpleFiltroTexto && cumpleFiltroTipo;
    });
  }, [conversaciones, filtro, tipoFiltro]);

  // Obtener icono según el tipo de conversación
  const obtenerIconoTipo = (tipo: TipoConversacion) => {
    switch (tipo) {
      case 'privada':
        return FiMessageCircle;
      case 'grupo':
        return FiUsers;
      case 'actividad':
        return FiUsers;
      case 'general':
        return FiUsers;
      default:
        return FiMessageCircle;
    }
  };

  // Obtener color del badge según el tipo
  const obtenerColorTipo = (tipo: TipoConversacion) => {
    switch (tipo) {
      case 'privada':
        return 'blue';
      case 'grupo':
        return 'green';
      case 'actividad':
        return 'purple';
      case 'general':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Formatear última actividad
  const formatearUltimaActividad = (fecha: Date) => {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    
    if (diff < 60000) { // Menos de 1 minuto
      return 'Ahora';
    } else if (diff < 3600000) { // Menos de 1 hora
      return format(fecha, 'HH:mm');
    } else if (diff < 86400000) { // Menos de 1 día
      return format(fecha, 'HH:mm');
    } else if (diff < 604800000) { // Menos de 1 semana
      return format(fecha, 'EEEE', { locale: es });
    } else {
      return format(fecha, 'dd/MM', { locale: es });
    }
  };
  // Verificar si el usuario es participante de la conversación
  const esParticipante = (conversacion: Conversacion) => {
    return conversacion.participantes.includes(userProfile?.uid || '');
  };

  // Manejar salir de conversación
  const handleSalirConversacion = async (conversacionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await salirConversacion(conversacionId);
  };

  if (cargandoConversaciones) {
    return (
      <Center height={height} bg={bgColor}>
        <VStack spacing={3}>
          <Spinner size="lg" color="brand.500" />
          <Text color="gray.500">Cargando conversaciones...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box
      height={height}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      overflow="hidden"
    >
      <VStack spacing={0} height="100%">
        {/* Header con filtros */}
        <Box p={4} borderBottomWidth="1px" borderColor={borderColor} w="100%">
          <VStack spacing={3}>
            <HStack w="100%" justify="space-between">
              <Text fontWeight="bold" fontSize="lg">
                Conversaciones
              </Text>
              {onCrearConversacion && (
                <IconButton
                  icon={<FiPlus />}
                  size="sm"
                  colorScheme="brand"
                  variant="ghost"
                  onClick={onCrearConversacion}
                  aria-label="Nueva conversación"
                />
              )}
            </HStack>
            
            {/* Buscador */}
            <InputGroup size="sm">
              <InputLeftElement>
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Buscar conversaciones..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </InputGroup>
            
            {/* Filtros por tipo */}
            <HStack spacing={2} w="100%" overflowX="auto">
              {(['todas', 'privada', 'grupo', 'actividad', 'general'] as const).map(tipo => (
                <Button
                  key={tipo}
                  size="xs"
                  variant={tipoFiltro === tipo ? 'solid' : 'outline'}
                  colorScheme={tipoFiltro === tipo ? 'brand' : 'gray'}
                  onClick={() => setTipoFiltro(tipo)}
                  textTransform="capitalize"
                  flexShrink={0}
                >
                  {tipo === 'todas' ? 'Todas' : tipo}
                </Button>
              ))}
            </HStack>
          </VStack>
        </Box>

        {/* Lista de conversaciones */}        <Box
          flex={1}
          w="100%"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: scrollbarThumbColor,
              borderRadius: '3px',
            },
          }}
        >
          {conversacionesFiltradas.length === 0 ? (
            <Center h="200px">
              <VStack spacing={3}>
                <FiMessageCircle size="48px" color="gray.400" />
                <Text color="gray.500" textAlign="center">
                  {filtro ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align="stretch">              {conversacionesFiltradas.map(conversacion => {
                const esActiva = conversacionActual?.id === conversacion.id;
                const tieneNoLeidos = false; // TODO: Implementar lógica de mensajes no leídos
                const IconoTipo = obtenerIconoTipo(conversacion.tipo);
                
                return (
                  <Box
                    key={conversacion.id}
                    p={3}
                    cursor="pointer"
                    bg={esActiva ? selectedColor : 'transparent'}
                    _hover={{ bg: esActiva ? selectedColor : hoverColor }}
                    borderBottomWidth="1px"
                    borderColor={borderColor}
                    onClick={() => onSeleccionarConversacion(conversacion)}
                    position="relative"
                  >
                    <HStack spacing={3} align="start">
                      {/* Avatar o icono */}
                      <Box position="relative">
                        {conversacion.tipo === 'privada' ? (                          <Avatar
                            size="md"
                            name={conversacion.nombre}
                            src={conversacion.avatarUrl}
                          />
                        ) : (
                          <Box
                            w="48px"
                            h="48px"
                            borderRadius="full"
                            bg={`${obtenerColorTipo(conversacion.tipo)}.100`}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color={`${obtenerColorTipo(conversacion.tipo)}.600`}
                          >
                            <IconoTipo size="20px" />
                          </Box>
                        )}
                          {/* Indicador de mensajes no leídos */}
                        {tieneNoLeidos && (
                          <Badge
                            position="absolute"
                            top="-2px"
                            right="-2px"
                            bg="red.500"
                            color="white"
                            borderRadius="full"
                            minW="20px"
                            h="20px"
                            fontSize="xs"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            1
                          </Badge>
                        )}
                      </Box>

                      {/* Información de la conversación */}
                      <VStack align="start" spacing={1} flex={1} minW={0}>
                        <HStack w="100%" justify="space-between" align="start">
                          <VStack align="start" spacing={0} flex={1} minW={0}>
                            <Text
                              fontWeight={tieneNoLeidos ? "bold" : "medium"}
                              fontSize="sm"
                              noOfLines={1}
                            >
                              {conversacion.nombre}
                            </Text>
                            
                            {/* Tipo de conversación */}
                            <HStack spacing={2}>
                              <Badge
                                size="sm"
                                colorScheme={obtenerColorTipo(conversacion.tipo)}
                                textTransform="capitalize"
                              >
                                {conversacion.tipo}
                              </Badge>
                              {conversacion.publica && (
                                <Badge size="sm" colorScheme="gray">
                                  Pública
                                </Badge>
                              )}
                            </HStack>
                          </VStack>                          {/* Hora y menú */}
                          <VStack align="end" spacing={1}>
                            <Text fontSize="xs" color={textColor}>
                              {conversacion.fechaUltimoMensaje && 
                                formatearUltimaActividad(
                                  conversacion.fechaUltimoMensaje instanceof Date 
                                    ? conversacion.fechaUltimoMensaje 
                                    : conversacion.fechaUltimoMensaje.toDate()
                                )
                              }
                            </Text>
                            
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                size="xs"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <MenuList>
                                <MenuItem icon={<FiEye />}>
                                  Ver detalles
                                </MenuItem>
                                {conversacion.tipo !== 'privada' && (
                                  <MenuItem
                                    icon={<FiUserX />}
                                    color="red.500"
                                    onClick={(e) => handleSalirConversacion(conversacion.id, e)}
                                  >
                                    Salir de conversación
                                  </MenuItem>
                                )}
                              </MenuList>
                            </Menu>
                          </VStack>
                        </HStack>

                        {/* Descripción o último mensaje */}
                        {conversacion.descripcion && (
                          <Text
                            fontSize="xs"
                            color={textColor}
                            noOfLines={1}
                            mt={1}
                          >
                            {conversacion.descripcion}
                          </Text>
                        )}

                        {/* Número de participantes */}
                        {conversacion.tipo !== 'privada' && (
                          <Text fontSize="xs" color={textColor}>
                            {conversacion.participantes.length} participantes
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default ConversationList;
