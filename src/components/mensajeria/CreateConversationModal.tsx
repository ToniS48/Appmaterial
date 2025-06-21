import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Box,
  Text,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { Usuario, RolUsuario } from '../../types/usuario';
import { TipoConversacion } from '../../types/mensaje';
import { useMensajeria } from '../../contexts/MensajeriaContext';
import { useAuth } from '../../contexts/AuthContext';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarios?: Usuario[];
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  isOpen,
  onClose,
  usuarios = [],
}) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoConversacion>('privada');
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { crearNuevaConversacion } = useMensajeria();
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();  // Filtrar usuarios según el rol del usuario actual (menos restrictivo)
  const usuariosFiltrados = usuarios.filter((usuario) => {
    if (!userProfile) return false;
    
    // Admin puede crear conversaciones con cualquiera
    if (userProfile.rol === 'admin') return true;
    
    // Vocal puede crear con todos
    if (userProfile.rol === 'vocal') {
      return true;
    }

    // Socio puede crear con TODOS (incluyendo invitados)
    if (userProfile.rol === 'socio') {
      return true;
    }
    
    // Invitado puede crear conversaciones con todos excepto otros invitados
    if (userProfile.rol === 'invitado') {
      return ['admin', 'vocal', 'socio'].includes(usuario.rol);
    }
    
    // Por defecto, permitir
    return true;
  });  // Log simple para confirmar funcionamiento
  console.log('✅ Modal conversación:', usuariosFiltrados.length, 'usuarios disponibles');

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setTipo('privada');
    setParticipantesSeleccionados([]);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (tipo === 'privada' && participantesSeleccionados.length !== 1) {
      newErrors.participantes = 'Selecciona exactamente un participante para conversación privada';
    }

    if (tipo === 'grupo' && participantesSeleccionados.length < 2) {
      newErrors.participantes = 'Selecciona al menos 2 participantes para grupo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };  const handleSubmit = async () => {
    if (!validateForm() || !currentUser) return;

    console.log('🚀 Iniciando creación de conversación:', {
      titulo,
      tipo,
      participantesSeleccionados,
      usuarioActual: currentUser?.uid
    });

    setLoading(true);
    try {
      const datosConversacion = {
        nombre: titulo,
        descripcion: descripcion || undefined,
        tipo,
        participantes: [...participantesSeleccionados, currentUser?.uid || ''],        publica: tipo === 'general',
        rolesPermitidos: tipo === 'general' ? ['admin', 'vocal', 'socio'] as RolUsuario[] : [],
        configuracion: {
          permiteArchivos: true,
          permiteImagenes: true,
          permiteEnlaces: true,
          notificacionesActivas: true,
          limiteTamaño: 10
        }
      };

      console.log('📝 Datos de conversación a crear:', datosConversacion);

      await crearNuevaConversacion(datosConversacion);

      console.log('✅ Conversación creada exitosamente');

      toast({
        title: 'Conversación creada',
        description: 'La conversación se ha creado exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      resetForm();    } catch (error: any) {
      console.error('❌ Error detallado creando conversación:', error);
      console.error('❌ Stack trace:', error?.stack);
      console.error('❌ Mensaje de error:', error?.message);
      
      toast({
        title: 'Error',
        description: `Error al crear conversación: ${error?.message || 'Error desconocido'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nueva Conversación</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.titulo}>
              <FormLabel>Título</FormLabel>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título de la conversación"
              />
              <FormErrorMessage>{errors.titulo}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Descripción (opcional)</FormLabel>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción de la conversación"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Tipo</FormLabel>
              <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoConversacion)}>                <option value="privada">Privada</option>
                <option value="grupo">Grupo</option>
                {userProfile?.rol === 'admin' && <option value="actividad">Actividad</option>}
                {userProfile?.rol === 'admin' && <option value="general">General</option>}
              </Select>
            </FormControl>

            <FormControl isInvalid={!!errors.participantes}>
              <FormLabel>
                Participantes 
                {tipo === 'privada' && ' (selecciona 1)'}
                {tipo === 'grupo' && ' (selecciona 2 o más)'}
              </FormLabel>
              <CheckboxGroup
                value={participantesSeleccionados}
                onChange={(values) => setParticipantesSeleccionados(values as string[])}
              >
                <SimpleGrid columns={2} spacing={2} maxH="200px" overflowY="auto">
                  {usuariosFiltrados.map((usuario) => (
                    <Box key={usuario.uid} p={2}>
                      <Checkbox value={usuario.uid} isDisabled={
                        tipo === 'privada' && 
                        participantesSeleccionados.length >= 1 && 
                        !participantesSeleccionados.includes(usuario.uid)
                      }>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            {usuario.nombre} {usuario.apellidos}
                          </Text>
                          <Badge size="xs" colorScheme={
                            usuario.rol === 'admin' ? 'red' :
                            usuario.rol === 'vocal' ? 'blue' :
                            usuario.rol === 'socio' ? 'green' : 'gray'
                          }>
                            {usuario.rol.toUpperCase()}
                          </Badge>
                        </VStack>
                      </Checkbox>
                    </Box>
                  ))}
                </SimpleGrid>
              </CheckboxGroup>
              <FormErrorMessage>{errors.participantes}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Creando..."
          >
            Crear Conversación
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
