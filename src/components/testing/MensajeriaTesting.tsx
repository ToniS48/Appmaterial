import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Divider,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid
} from '@chakra-ui/react';
import { useMensajeria } from '../../contexts/MensajeriaContext';
import { useAuth } from '../../contexts/AuthContext';
import { TipoConversacion } from '../../types/mensaje';

/**
 * Componente de prueba para el sistema de mensajería
 * Solo para desarrollo - no incluir en producción
 */
const MensajeriaTesting: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const {
    conversaciones,
    conversacionActual,
    mensajes,
    cargandoConversaciones,
    cargandoMensajes,
    error,
    crearNuevaConversacion,
    seleccionarConversacion,
    enviarNuevoMensaje,
    cargarConversaciones,
    limpiarError
  } = useMensajeria();

  const toast = useToast();

  // Estados para el formulario de prueba
  const [nombreConversacion, setNombreConversacion] = useState('');
  const [tipoConversacion, setTipoConversacion] = useState<TipoConversacion>('privada');
  const [participanteId, setParticipanteId] = useState('');
  const [mensajePrueba, setMensajePrueba] = useState('');

  // Cargar conversaciones al montar
  useEffect(() => {
    if (currentUser) {
      cargarConversaciones();
    }
  }, [currentUser, cargarConversaciones]);

  const handleCrearConversacion = async () => {
    if (!nombreConversacion.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la conversación es requerido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const participantes = participanteId.trim() ? [participanteId.trim()] : [];
        await crearNuevaConversacion({
        nombre: nombreConversacion,
        tipo: tipoConversacion,
        descripcion: `Conversación de prueba creada el ${new Date().toLocaleString()}`,
        participantes,
        publica: tipoConversacion === 'general',
        rolesPermitidos: ['admin', 'vocal', 'socio'],
        configuracion: {
          permiteArchivos: true,
          permiteImagenes: true,
          permiteEnlaces: true,
          soloAdministradores: false,
          notificacionesActivas: true,
          limiteTamaño: 10,
          moderada: false
        }
      });

      // Limpiar formulario
      setNombreConversacion('');
      setParticipanteId('');
      
      toast({
        title: 'Conversación creada',
        description: 'La conversación se ha creado exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al crear conversación:', error);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!conversacionActual || !mensajePrueba.trim()) {
      toast({
        title: 'Error',
        description: 'Selecciona una conversación y escribe un mensaje',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await enviarNuevoMensaje({
        conversacionId: conversacionActual.id,
        tipo: 'texto',
        contenido: mensajePrueba
      });

      setMensajePrueba('');
      
      toast({
        title: 'Mensaje enviado',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleLimpiarError = () => {
    limpiarError();
  };

  if (!currentUser || !userProfile) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>Acceso requerido</AlertTitle>
        <AlertDescription>
          Necesitas estar autenticado para usar esta página de pruebas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Heading mb={6} size="lg" color="brand.500">
        🧪 Panel de Pruebas - Sistema de Mensajería
      </Heading>

      <Text mb={4} color="gray.600">
        Panel de desarrollo para probar las funcionalidades del sistema de mensajería.
        Usuario actual: <Badge colorScheme="blue">{userProfile.nombre} ({userProfile.rol})</Badge>
      </Text>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Error:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button ml="auto" size="sm" onClick={handleLimpiarError}>
            Limpiar
          </Button>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Panel de crear conversación */}
        <Card>
          <CardHeader>
            <Heading size="md">Crear Nueva Conversación</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Input
                placeholder="Nombre de la conversación"
                value={nombreConversacion}
                onChange={(e) => setNombreConversacion(e.target.value)}
              />
              
              <Select
                value={tipoConversacion}
                onChange={(e) => setTipoConversacion(e.target.value as TipoConversacion)}
              >
                <option value="privada">Privada</option>
                <option value="grupo">Grupo</option>
                <option value="actividad">Actividad</option>
                <option value="general">General</option>
              </Select>              <Input
                placeholder="ID del participante (opcional)"
                value={participanteId}
                onChange={(e) => setParticipanteId(e.target.value)}
              />
              <Text fontSize="sm" color="gray.600">
                Deja vacío para conversación solo contigo
              </Text>

              <Button
                colorScheme="blue"
                onClick={handleCrearConversacion}
                isLoading={cargandoConversaciones}
                w="full"
              >
                Crear Conversación
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Panel de estado */}
        <Card>
          <CardHeader>
            <Heading size="md">Estado del Sistema</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text>Conversaciones:</Text>
                <Badge colorScheme="green">{conversaciones.length}</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Conversación actual:</Text>
                <Badge colorScheme={conversacionActual ? "blue" : "gray"}>
                  {conversacionActual ? conversacionActual.nombre : "Ninguna"}
                </Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Mensajes cargados:</Text>
                <Badge colorScheme="purple">{mensajes.length}</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Cargando conversaciones:</Text>
                <Badge colorScheme={cargandoConversaciones ? "yellow" : "green"}>
                  {cargandoConversaciones ? "Sí" : "No"}
                </Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Cargando mensajes:</Text>
                <Badge colorScheme={cargandoMensajes ? "yellow" : "green"}>
                  {cargandoMensajes ? "Sí" : "No"}
                </Badge>
              </HStack>

              <Divider />
              
              <Button
                size="sm"
                variant="outline"
                onClick={cargarConversaciones}
                isLoading={cargandoConversaciones}
              >
                Recargar Conversaciones
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Lista de conversaciones */}
      <Card mt={6}>
        <CardHeader>
          <Heading size="md">Conversaciones Disponibles</Heading>
        </CardHeader>
        <CardBody>
          {conversaciones.length === 0 ? (
            <Text color="gray.500">No hay conversaciones disponibles</Text>
          ) : (
            <VStack spacing={2} align="stretch">
              {conversaciones.map((conv) => (
                <HStack
                  key={conv.id}
                  p={3}
                  borderWidth={1}
                  borderRadius="md"
                  bg={conversacionActual?.id === conv.id ? "blue.50" : "gray.50"}
                  cursor="pointer"
                  onClick={() => seleccionarConversacion(conv.id)}
                  _hover={{ bg: "blue.100" }}
                >
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold">{conv.nombre}</Text>
                    <Text fontSize="sm" color="gray.600">
                      Tipo: {conv.tipo} | Participantes: {conv.participantes.length}
                    </Text>
                  </VStack>
                  <Badge colorScheme="blue">{conv.tipo}</Badge>
                </HStack>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Panel de enviar mensaje */}
      {conversacionActual && (
        <Card mt={6}>
          <CardHeader>
            <Heading size="md">
              Enviar Mensaje - {conversacionActual.nombre}
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Textarea
                placeholder="Escribe tu mensaje aquí..."
                value={mensajePrueba}
                onChange={(e) => setMensajePrueba(e.target.value)}
                rows={3}
              />
              <Button
                colorScheme="green"
                onClick={handleEnviarMensaje}
                isDisabled={!mensajePrueba.trim()}
                w="full"
              >
                Enviar Mensaje
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Lista de mensajes */}
      {conversacionActual && (
        <Card mt={6}>
          <CardHeader>
            <Heading size="md">
              Mensajes - {conversacionActual.nombre}
            </Heading>
          </CardHeader>
          <CardBody>
            {cargandoMensajes ? (
              <Text>Cargando mensajes...</Text>
            ) : mensajes.length === 0 ? (
              <Text color="gray.500">No hay mensajes en esta conversación</Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {mensajes.map((mensaje) => (
                  <Box
                    key={mensaje.id}
                    p={3}
                    borderWidth={1}
                    borderRadius="md"
                    bg={mensaje.remitenteId === currentUser.uid ? "blue.50" : "gray.50"}
                  >
                    <HStack justify="space-between" mb={1}>
                      <Text fontWeight="bold" fontSize="sm">
                        {mensaje.remitenteNombre}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {mensaje.fechaEnvio instanceof Date 
                          ? mensaje.fechaEnvio.toLocaleString()
                          : new Date(mensaje.fechaEnvio.seconds * 1000).toLocaleString()
                        }
                      </Text>
                    </HStack>
                    <Text>{mensaje.contenido}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default MensajeriaTesting;
