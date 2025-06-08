import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Tooltip,
  Link,
  Image,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  FormControl,
  Divider,
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiEdit3,
  FiTrash2,
  FiCornerUpLeft,
  FiCopy,
  FiExternalLink,
  FiDownload,
  FiFile,
  FiImage,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mensaje, TipoMensaje } from '../../types/mensaje';
import { useMensajeria } from '../../contexts/MensajeriaContext';
import { useAuth } from '../../contexts/AuthContext';

interface MessageBubbleProps {
  mensaje: Mensaje;
  mostrarAvatar?: boolean;
  mostrarFecha?: boolean;
  esConsecutivo?: boolean;
  onResponder?: (mensaje: Mensaje) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  mensaje,
  mostrarAvatar = true,
  mostrarFecha = true,
  esConsecutivo = false,
  onResponder
}) => {
  const { userProfile } = useAuth();
  const { editarMensajeExistente, eliminarMensajeExistente } = useMensajeria();
  
  // Estados
  const [editando, setEditando] = useState(false);
  const [contenidoEditado, setContenidoEditado] = useState(mensaje.contenido);
  const { isOpen: isImageModalOpen, onOpen: onImageModalOpen, onClose: onImageModalClose } = useDisclosure();
    // Colores del tema
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const timeColor = useColorModeValue('gray.500', 'gray.400');
  const editedColor = useColorModeValue('gray.400', 'gray.500');
  const bubbleBgOther = useColorModeValue('gray.100', 'gray.600');
  const bubbleColorOther = useColorModeValue('gray.800', 'white');
  
  // Verificar si es mensaje propio
  const esMensajePropio = userProfile?.uid === mensaje.remitenteId;
  
  // Colores del bubble según el tipo de usuario
  const bubbleColors = useMemo(() => {
    if (esMensajePropio) {
      return {
        bg: 'brand.500',
        color: 'white',
        borderRadius: '18px 18px 4px 18px'
      };
    } else {
      return {
        bg: bubbleBgOther,
        color: bubbleColorOther,
        borderRadius: '18px 18px 18px 4px'
      };
    }
  }, [esMensajePropio, bubbleBgOther, bubbleColorOther]);
  // Formatear fecha
  const fechaFormateada = useMemo(() => {
    const fecha = mensaje.fechaEnvio instanceof Date ? mensaje.fechaEnvio : mensaje.fechaEnvio.toDate();
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    
    if (diff < 60000) { // Menos de 1 minuto
      return 'Ahora';
    } else if (diff < 3600000) { // Menos de 1 hora
      return format(fecha, 'HH:mm');
    } else if (diff < 86400000) { // Menos de 1 día
      return format(fecha, 'HH:mm');
    } else {
      return format(fecha, 'dd/MM/yyyy HH:mm', { locale: es });
    }
  }, [mensaje.fechaEnvio]);
  // Manejar edición
  const handleGuardarEdicion = async () => {
    if (contenidoEditado.trim() !== mensaje.contenido) {
      try {
        await editarMensajeExistente(mensaje.id, contenidoEditado.trim());
        setEditando(false);
      } catch (error) {
        console.error('Error al editar mensaje:', error);
      }
    } else {
      setEditando(false);
    }
  };

  const handleCancelarEdicion = () => {
    setContenidoEditado(mensaje.contenido);
    setEditando(false);
  };

  // Manejar eliminación
  const handleEliminar = async () => {
    try {
      await eliminarMensajeExistente(mensaje.id);
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
    }
  };

  // Renderizar contenido según el tipo
  const renderContenido = () => {
    if (editando) {
      return (
        <VStack spacing={2} align="stretch">
          <Textarea
            value={contenidoEditado}
            onChange={(e) => setContenidoEditado(e.target.value)}
            size="sm"
            resize="none"
            bg={esMensajePropio ? 'whiteAlpha.200' : 'whiteAlpha.100'}
            border="none"
            color="inherit"
            _focus={{ boxShadow: 'none' }}
          />
          <HStack spacing={2} justify="flex-end">
            <Button
              size="xs"
              variant="ghost"
              color="inherit"
              onClick={handleCancelarEdicion}
            >
              Cancelar
            </Button>
            <Button
              size="xs"
              variant="solid"
              bg={esMensajePropio ? 'whiteAlpha.300' : 'brand.500'}
              color={esMensajePropio ? 'white' : 'white'}
              onClick={handleGuardarEdicion}
            >
              Guardar
            </Button>
          </HStack>
        </VStack>
      );
    }

    switch (mensaje.tipo) {
      case 'texto':
        return (
          <Text
            fontSize="sm"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            {mensaje.contenido}
          </Text>
        );      case 'enlace':
        return (
          <VStack align="stretch" spacing={2}>
            <Link
              href={mensaje.contenido}
              isExternal
              display="flex"
              alignItems="center"
              p={2}
              bg={esMensajePropio ? 'whiteAlpha.200' : 'blackAlpha.100'}
              borderRadius="md"
              _hover={{ bg: esMensajePropio ? 'whiteAlpha.300' : 'blackAlpha.200' }}
            >
              <FiExternalLink style={{ marginRight: '8px' }} />
              <Text fontSize="sm" textDecoration="underline">
                {mensaje.contenido}
              </Text>
            </Link>
          </VStack>
        );case 'imagen':
        return (
          <VStack align="stretch" spacing={2}>
            {mensaje.contenido && (
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {mensaje.contenido}
              </Text>
            )}
            {mensaje.archivoUrl && mensaje.tipo === 'imagen' && (
              <Box>
                <Image
                  src={mensaje.archivoUrl}
                  alt={mensaje.archivoNombre || 'Imagen'}
                  maxW="200px"
                  maxH="200px"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={onImageModalOpen}
                />
              </Box>
            )}
          </VStack>
        );

      case 'archivo':
        return (
          <VStack align="stretch" spacing={2}>
            {mensaje.contenido && (
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {mensaje.contenido}
              </Text>            )}
            {mensaje.archivoUrl && mensaje.tipo === 'archivo' && (
              <HStack
                p={2}
                bg={esMensajePropio ? 'whiteAlpha.200' : 'blackAlpha.100'}
                borderRadius="md"
                spacing={2}
              >
                <FiFile />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    {mensaje.archivoNombre || 'Archivo'}
                  </Text>
                  <Text fontSize="xs" opacity={0.8}>
                    {mensaje.archivoTipo || 'Archivo'}
                  </Text>
                </VStack>
                <IconButton
                  icon={<FiDownload />}
                  size="sm"
                  variant="ghost"
                  color="inherit"
                  as="a"
                  href={mensaje.archivoUrl}
                  download={mensaje.archivoNombre}
                  aria-label="Descargar archivo"
                />
              </HStack>
            )}
          </VStack>
        );

      default:
        return (
          <Text fontSize="sm" whiteSpace="pre-wrap">
            {mensaje.contenido}
          </Text>
        );
    }
  };

  return (
    <HStack
      align="flex-start"
      spacing={2}
      justify={esMensajePropio ? 'flex-end' : 'flex-start'}
      px={4}
      py={esConsecutivo ? 1 : 2}
    >      {/* Avatar (solo para mensajes de otros usuarios y no consecutivos) */}
      {!esMensajePropio && mostrarAvatar && !esConsecutivo && (
        <Avatar
          size="sm"
          name={mensaje.remitenteNombre}
          src="" // TODO: Agregar avatarUrl al usuario si es necesario
        />
      )}
      
      {/* Espaciador para mensajes consecutivos */}
      {!esMensajePropio && (!mostrarAvatar || esConsecutivo) && (
        <Box w="32px" /> 
      )}

      {/* Contenido del mensaje */}
      <VStack
        align={esMensajePropio ? 'flex-end' : 'flex-start'}
        spacing={1}
        maxW="70%"
      >        {/* Nombre del autor (solo para mensajes de otros y no consecutivos) */}
        {!esMensajePropio && !esConsecutivo && (
          <Text fontSize="xs" color={timeColor} ml={2}>
            {mensaje.remitenteNombre}
          </Text>
        )}

        {/* Bubble del mensaje */}
        <HStack spacing={1} align="flex-end">
          <Box
            bg={bubbleColors.bg}
            color={bubbleColors.color}
            px={3}
            py={2}
            borderRadius={bubbleColors.borderRadius}
            position="relative"
            minW="60px"
            maxW="100%"
          >
            {renderContenido()}

            {/* Indicador de mensaje editado */}
            {mensaje.editado && (
              <Text
                fontSize="xs"
                color={editedColor}
                fontStyle="italic"
                mt={1}
              >
                editado
              </Text>
            )}
          </Box>

          {/* Menú de opciones */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              size="xs"
              variant="ghost"
              color={timeColor}
              opacity={0.7}
              _hover={{ opacity: 1 }}
            />
            <MenuList>
              {onResponder && (                <MenuItem icon={<FiCornerUpLeft />} onClick={() => onResponder(mensaje)}>
                  Responder
                </MenuItem>
              )}
              <MenuItem
                icon={<FiCopy />}
                onClick={() => navigator.clipboard.writeText(mensaje.contenido)}
              >
                Copiar texto
              </MenuItem>
              {esMensajePropio && (
                <>
                  <MenuItem
                    icon={<FiEdit3 />}
                    onClick={() => setEditando(true)}
                  >
                    Editar
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    icon={<FiTrash2 />}
                    color="red.500"
                    onClick={handleEliminar}
                  >
                    Eliminar
                  </MenuItem>
                </>
              )}
            </MenuList>
          </Menu>
        </HStack>

        {/* Fecha y estado (solo si se debe mostrar) */}
        {mostrarFecha && (
          <Text fontSize="xs" color={timeColor} alignSelf={esMensajePropio ? 'flex-end' : 'flex-start'}>
            {fechaFormateada}
          </Text>
        )}
      </VStack>

      {/* Modal para ver imagen completa */}      <Modal isOpen={isImageModalOpen} onClose={onImageModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{mensaje.archivoNombre || 'Imagen'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {mensaje.archivoUrl && mensaje.tipo === 'imagen' && (
              <Image
                src={mensaje.archivoUrl}
                alt={mensaje.archivoNombre || 'Imagen'}
                maxW="100%"
                maxH="500px"
                objectFit="contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </HStack>
  );
};

export default MessageBubble;
