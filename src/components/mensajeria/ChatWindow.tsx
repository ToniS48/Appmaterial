import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import {
  FiX,
  FiUsers,
  FiSettings,
  FiInfo,
  FiUserX,
  FiEye,
  FiEdit3,
  FiMoreVertical,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Conversacion, TipoConversacion } from '../../types/mensaje';
import { RolUsuario } from '../../types/usuario';
import { useMensajeria } from '../../contexts/MensajeriaContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  conversacion: Conversacion;
  onCerrar: () => void;
  height?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversacion,
  onCerrar,
  height = "600px"
}) => {
  const { salirConversacion } = useMensajeria();
  const { userProfile } = useAuth();
  
  // Modales
  const { isOpen: isInfoModalOpen, onOpen: onInfoModalOpen, onClose: onInfoModalClose } = useDisclosure();
  
  // Colores del tema
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  // Obtener información del participante actual
  const participanteActual = conversacion.participantes.find((participanteId: string) => participanteId === userProfile?.uid);
  
  // Verificar permisos
  const puedeEscribir = true; // Simplificado por ahora
  const esAdmin = conversacion.administradores.includes(userProfile?.uid || '');

  // Obtener icono según el tipo de conversación
  const obtenerIconoTipo = (tipo: TipoConversacion) => {
    switch (tipo) {
      case 'privada':
        return null; // Para conversaciones privadas usamos avatar
      case 'grupo':
        return FiUsers;
      case 'actividad':
        return FiUsers;
      case 'general':
        return FiUsers;
      default:
        return FiUsers;
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
  // Manejar salir de conversación
  const handleSalirConversacion = async () => {
    await salirConversacion(conversacion.id);
    onCerrar();
  };

  const IconoTipo = obtenerIconoTipo(conversacion.tipo);

  return (
    <Box
      height={height}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
        p={4}
      >
        <HStack justify="space-between">
          {/* Información de la conversación */}
          <HStack spacing={3}>            {/* Avatar o icono */}
            {conversacion.tipo === 'privada' ? (
              <Avatar
                size="md"
                name={conversacion.nombre}
                src={conversacion.avatarUrl}
              />
            ) : (
              IconoTipo && (
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
              )
            )}

            {/* Info */}
            <VStack align="start" spacing={0}>
              <HStack spacing={2}>
                <Text fontWeight="bold" fontSize="lg">
                  {conversacion.nombre}
                </Text>
                <Badge
                  colorScheme={obtenerColorTipo(conversacion.tipo)}
                  textTransform="capitalize"
                  size="sm"
                >                  {conversacion.tipo}
                </Badge>
                {conversacion.publica && (
                  <Badge colorScheme="gray" size="sm">
                    Pública
                  </Badge>
                )}
              </HStack>
              
              <Text fontSize="sm" color="gray.500">
                {conversacion.tipo === 'privada' 
                  ? 'Conversación privada'
                  : `${conversacion.participantes.length} participantes`
                }
              </Text>
            </VStack>
          </HStack>

          {/* Acciones */}
          <HStack spacing={2}>            {/* Botón de información */}
            <Tooltip label="Información de la conversación">
              <Box>
                <IconButton
                  icon={<FiInfo />}
                  variant="ghost"
                  size="sm"
                  onClick={onInfoModalOpen}
                  aria-label="Información"
                />
              </Box>
            </Tooltip>

            {/* Menú de opciones */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
              />
              <MenuList>
                <MenuItem icon={<FiInfo />} onClick={onInfoModalOpen}>
                  Información
                </MenuItem>
                {conversacion.tipo !== 'privada' && (
                  <>
                    <MenuItem icon={<FiUsers />}>
                      Ver participantes
                    </MenuItem>
                    {esAdmin && (
                      <MenuItem icon={<FiSettings />}>
                        Configuración
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem
                      icon={<FiUserX />}
                      color="red.500"
                      onClick={handleSalirConversacion}
                    >
                      Salir de conversación
                    </MenuItem>
                  </>
                )}
              </MenuList>
            </Menu>

            {/* Botón de cerrar */}
            <IconButton
              icon={<FiX />}
              variant="ghost"
              size="sm"
              onClick={onCerrar}
              aria-label="Cerrar"
            />
          </HStack>
        </HStack>
      </Box>

      {/* Lista de mensajes */}
      <Box flex={1} overflow="hidden">
        <MessageList
          conversacionId={conversacion.id}
          height="100%"
        />
      </Box>

      {/* Input de mensaje */}
      {puedeEscribir ? (
        <MessageInput
          conversacionId={conversacion.id}
          placeholder={`Escribir en ${conversacion.nombre}...`}
        />
      ) : (
        <Box
          p={4}
          bg={headerBg}
          borderTopWidth="1px"
          borderColor={borderColor}
          textAlign="center"
        >
          <Text color="gray.500" fontSize="sm">
            No tienes permisos para escribir en esta conversación
          </Text>
        </Box>
      )}

      {/* Modal de información */}
      <Modal isOpen={isInfoModalOpen} onClose={onInfoModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Información de la conversación</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {/* Información básica */}
              <Box>
                <Text fontWeight="bold" mb={2}>Información básica</Text>
                <VStack align="start" spacing={2} pl={4}>
                  <HStack>
                    <Text fontWeight="medium" w="100px">Nombre:</Text>
                    <Text>{conversacion.nombre}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="medium" w="100px">Tipo:</Text>
                    <Badge colorScheme={obtenerColorTipo(conversacion.tipo)} textTransform="capitalize">
                      {conversacion.tipo}
                    </Badge>
                  </HStack>
                  {conversacion.descripcion && (
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Descripción:</Text>
                      <Text fontSize="sm" color="gray.600" pl={4}>
                        {conversacion.descripcion}
                      </Text>
                    </VStack>
                  )}                  <HStack>
                    <Text fontWeight="medium" w="100px">Creado:</Text>
                    <Text fontSize="sm">
                      {format(
                        conversacion.fechaCreacion instanceof Date 
                          ? conversacion.fechaCreacion 
                          : conversacion.fechaCreacion.toDate(), 
                        "dd 'de' MMMM 'de' yyyy", 
                        { locale: es }
                      )}
                    </Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="medium" w="100px">Participantes:</Text>
                    <Text>{conversacion.participantes.length}</Text>
                  </HStack>
                </VStack>
              </Box>

              <Divider />

              {/* Configuración */}
              <Box>
                <Text fontWeight="bold" mb={2}>Configuración</Text>
                <VStack align="start" spacing={2} pl={4}>                  <HStack>
                    <Text fontWeight="medium" w="120px">Pública:</Text>
                    <Badge colorScheme={conversacion.publica ? 'green' : 'red'}>
                      {conversacion.publica ? 'Sí' : 'No'}
                    </Badge>
                  </HStack>
                  {conversacion.rolesPermitidos && (
                    <VStack align="start" spacing={1}><Text fontWeight="medium">Roles permitidos:</Text>
                      <HStack wrap="wrap" pl={4}>
                        {conversacion.rolesPermitidos.map((rol: RolUsuario) => (
                          <Badge key={rol} colorScheme="blue" textTransform="capitalize">
                            {rol}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              </Box>

              <Divider />              {/* Participantes */}
              <Box>
                <Text fontWeight="bold" mb={2}>Participantes</Text>
                <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                  {conversacion.participantes.map((participanteId: string) => (
                    <HStack key={participanteId} justify="space-between" p={2} bg={headerBg} borderRadius="md">
                      <HStack>
                        <Avatar size="sm" name={participanteId} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium" fontSize="sm">
                            {participanteId}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Participante
                          </Text>
                        </VStack>                      </HStack>
                      <HStack spacing={1}>
                        {conversacion.administradores.includes(participanteId) && (
                          <Badge colorScheme="purple" size="sm">Admin</Badge>
                        )}
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ChatWindow;
