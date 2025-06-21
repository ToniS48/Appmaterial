import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Input,
  Button,
  useColorModeValue,
  Flex,
  Badge,
  useDisclosure,
  Spacer,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { CreateConversationModal } from './CreateConversationModal';
import { SearchModal } from './SearchModal';
import { useMensajeria } from '../../contexts/MensajeriaContext';
import { useAuth } from '../../contexts/AuthContext';
import { Conversacion, Mensaje } from '../../types/mensaje';
import { Usuario } from '../../types/usuario';

interface MessagingInterfaceProps {
  usuarios?: Usuario[];
}

export const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  usuarios = [],
}) => {
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState<Conversacion | null>(null);
  const [filtroTexto, setFiltroTexto] = useState('');
    const { conversaciones, conversacionActual, marcarComoLeido, seleccionarConversacion } = useMensajeria();
  const { currentUser } = useAuth();
  
  const {
    isOpen: isCreateModalOpen,
    onOpen: onCreateModalOpen,
    onClose: onCreateModalClose,
  } = useDisclosure();
  
  const {
    isOpen: isSearchModalOpen,
    onOpen: onSearchModalOpen,
    onClose: onSearchModalClose,
  } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const emptyBgColor = useColorModeValue('gray.50', 'gray.900');  const handleConversacionSelect = (conversacion: Conversacion) => {
    console.log('🎯 [MESSAGING-INTERFACE] Seleccionando conversación:', conversacion.id, conversacion.nombre);
    
    setConversacionSeleccionada(conversacion);
    
    // Activar el listener de mensajes en tiempo real a través del contexto
    seleccionarConversacion(conversacion.id);
    
    // Marcar como leída
    marcarComoLeido(conversacion.id);
  };

  const handleMessageSelect = (mensaje: Mensaje, conversacion: Conversacion) => {
    setConversacionSeleccionada(conversacion);
    // Aquí podrías agregar lógica para hacer scroll al mensaje específico
  };

  const conversacionesFiltradas = conversaciones.filter(conv => {
    if (!filtroTexto) return true;
    return conv.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
           conv.descripcion?.toLowerCase().includes(filtroTexto.toLowerCase());  });

  // Simplificado por ahora - sin cálculo de mensajes no leídos específicos
  const totalMensajesNoLeidos = 0;
  // Verificar si el usuario puede crear conversaciones  
  const puedeCrearConversaciones = true; // Simplificado por ahora
  return (
    <Box h="full" display="flex" flexDirection="column">
      {/* Header de acciones (sin título duplicado) */}
      <Box
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        p={4}
      >
        <HStack justify="space-between">
          <HStack>
            {totalMensajesNoLeidos > 0 && (
              <Badge colorScheme="red" borderRadius="full">
                {totalMensajesNoLeidos} mensajes no leídos
              </Badge>
            )}
          </HStack>
          
          <HStack>
            <IconButton
              aria-label="Buscar mensajes"
              icon={<SearchIcon />}
              onClick={onSearchModalOpen}
              size="sm"
            />
            {puedeCrearConversaciones && (
              <Button
                leftIcon={<AddIcon />}
                onClick={onCreateModalOpen}
                size="sm"
                colorScheme="blue"
              >
                Nueva Conversación
              </Button>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Main Content */}
      <Flex flex={1} overflow="hidden" minH="0">
        {/* Sidebar - Lista de Conversaciones */}
        <Box
          w="350px"
          bg={bgColor}
          borderRight="1px"
          borderColor={borderColor}
          display="flex"
          flexDirection="column"
        >
          {/* Filtro de búsqueda */}
          <Box p={3} borderBottom="1px" borderColor={borderColor}>
            <Input
              placeholder="Buscar conversaciones..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              size="sm"
            />
          </Box>          {/* Lista de conversaciones */}
          <Box flex={1} overflow="hidden">
            <ConversationList
              onSeleccionarConversacion={handleConversacionSelect}
              onCrearConversacion={onCreateModalOpen}
            />
          </Box>
        </Box>        {/* Main Chat Area */}
        <Box flex={1} bg={bgColor}>
          {conversacionActual ? (
            <VStack h="full" spacing={0}>
              <MessageList conversacionId={conversacionActual.id} />
              <MessageInput conversacionId={conversacionActual.id} />
            </VStack>) : (
            <Flex
              h="full"
              align="center"
              justify="center"
              bg={emptyBgColor}
            >
              <VStack spacing={4} textAlign="center">
                <Text fontSize="lg" color="gray.500">
                  Selecciona una conversación para comenzar
                </Text>
                {puedeCrearConversaciones && (
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={onCreateModalOpen}
                    colorScheme="blue"
                  >
                    Crear Nueva Conversación
                  </Button>
                )}
              </VStack>
            </Flex>
          )}
        </Box>
      </Flex>

      {/* Modales */}
      <CreateConversationModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        usuarios={usuarios}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={onSearchModalClose}
        onMessageSelect={handleMessageSelect}
      />
    </Box>
  );
};
