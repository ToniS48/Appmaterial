import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  IconButton,
  Textarea,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Tooltip,
  Divider,
  FormControl,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Select,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiSend,
  FiPaperclip,
  FiImage,
  FiLink,
  FiSmile,
  FiMoreVertical,
  FiEdit3,
  FiTrash2,
} from 'react-icons/fi';
import { useMensajeria } from '../../contexts/MensajeriaContext';
import { TipoMensaje } from '../../types/mensaje';

interface MessageInputProps {
  conversacionId: string;
  onEnviarMensaje?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  conversacionId,
  onEnviarMensaje,
  placeholder = "Escribe un mensaje...",
  disabled = false
}) => {
  const { enviarNuevoMensaje, cargandoMensajes } = useMensajeria();
  const toast = useToast();
  
  // Estados
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<TipoMensaje>('texto');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [enlace, setEnlace] = useState('');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  
  // Modal para enlaces
  const { isOpen: isLinkModalOpen, onOpen: onLinkModalOpen, onClose: onLinkModalClose } = useDisclosure();
  
  // Referencias
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Colores del tema
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.800');

  // Manejar envío del mensaje
  const handleEnviarMensaje = async () => {
    if (!mensaje.trim() && archivos.length === 0 && !enlace.trim()) {
      return;
    }

    try {
      const data = {
        conversacionId,
        contenido: mensaje.trim(),
        tipo: tipoMensaje,
        archivos: archivos.length > 0 ? archivos : undefined,
        enlace: enlace.trim() || undefined,
      };

      await enviarNuevoMensaje(data);
      
      // Limpiar formulario
      setMensaje('');
      setArchivos([]);
      setEnlace('');
      setTipoMensaje('texto');
      setMostrarOpciones(false);
      
      // Enfocar textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      
      // Callback opcional
      if (onEnviarMensaje) {
        onEnviarMensaje();
      }
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  // Manejar teclas
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje();
    }
  };

  // Manejar selección de archivos
  const handleFileSelect = (files: FileList | null, tipo: TipoMensaje) => {
    if (!files) return;
    
    const archivosArray = Array.from(files);
    
    // Validar tamaño de archivos (10MB máximo)
    const archivosValidos = archivosArray.filter(archivo => archivo.size <= 10 * 1024 * 1024);
    
    if (archivosValidos.length !== archivosArray.length) {
      toast({
        title: "Archivos demasiado grandes",
        description: "Algunos archivos superan el límite de 10MB",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
    
    setArchivos(archivosValidos);
    setTipoMensaje(tipo);
    setMostrarOpciones(false);
  };

  // Manejar enlace
  const handleAgregarEnlace = () => {
    if (!enlace.trim()) return;
    
    setTipoMensaje('enlace');
    setMensaje(enlace);
    onLinkModalClose();
    setMostrarOpciones(false);
  };

  // Auto-resize del textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [mensaje]);

  return (
    <Box
      borderTopWidth="1px"
      borderColor={borderColor}
      bg={bgColor}
      p={4}
    >
      <VStack spacing={3}>
        {/* Área principal de entrada */}
        <HStack width="100%" spacing={2}>
          {/* Botón de opciones */}
          <Menu isOpen={mostrarOpciones} onClose={() => setMostrarOpciones(false)}>
            <MenuButton
              as={IconButton}
              icon={<FiPaperclip />}
              variant="ghost"
              colorScheme="brand"              onClick={() => setMostrarOpciones(!mostrarOpciones)}
              isDisabled={disabled || cargandoMensajes}
            />
            <MenuList>
              <MenuItem
                icon={<FiPaperclip />}
                onClick={() => fileInputRef.current?.click()}
              >
                Adjuntar archivo
              </MenuItem>
              <MenuItem
                icon={<FiImage />}
                onClick={() => imageInputRef.current?.click()}
              >
                Adjuntar imagen
              </MenuItem>
              <MenuItem
                icon={<FiLink />}
                onClick={onLinkModalOpen}
              >
                Agregar enlace
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Área de texto */}
          <Box flex={1}>
            <Textarea
              ref={textareaRef}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              resize="none"
              minHeight="40px"
              maxHeight="120px"
              bg={inputBg}
              border="1px solid"              borderColor={borderColor}
              borderRadius="md"
              isDisabled={disabled || cargandoMensajes}
              _focus={{
                borderColor: "brand.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
              }}
            />
          </Box>

          {/* Botón de enviar */}
          <Tooltip label="Enviar mensaje (Enter)">            <IconButton
              icon={<FiSend />}
              colorScheme="brand"
              onClick={handleEnviarMensaje}
              isDisabled={disabled || cargandoMensajes || (!mensaje.trim() && archivos.length === 0)}
              isLoading={cargandoMensajes}
              aria-label="Enviar mensaje"
            />
          </Tooltip>
        </HStack>

        {/* Mostrar archivos seleccionados */}
        {archivos.length > 0 && (
          <HStack width="100%" wrap="wrap" spacing={2}>
            {archivos.map((archivo, index) => (
              <Box
                key={index}
                px={3}
                py={1}
                bg={inputBg}
                borderRadius="md"
                fontSize="sm"
              >
                <Text>{archivo.name}</Text>
              </Box>
            ))}
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={() => setArchivos([])}
            >
              Limpiar
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Inputs ocultos para archivos */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        onChange={(e) => handleFileSelect(e.target.files, 'archivo')}
      />
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: 'none' }}
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files, 'imagen')}
      />

      {/* Modal para agregar enlace */}
      <Modal isOpen={isLinkModalOpen} onClose={onLinkModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agregar enlace</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <Input
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                placeholder="https://ejemplo.com"
                type="url"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLinkModalClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleAgregarEnlace}
              isDisabled={!enlace.trim()}
            >
              Agregar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MessageInput;
