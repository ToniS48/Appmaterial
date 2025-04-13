import React, { useState, useEffect } from 'react';
import {
  Box, 
  Button,
  Heading,
  Text,
  Flex,
  Badge,
  Divider,
  List,
  ListItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  SimpleGrid,
  Tag,
  TagLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Stack,
} from '@chakra-ui/react';
import { CalendarIcon, InfoIcon } from '@chakra-ui/icons';
import { Actividad } from '../../types/actividad';
import PrestamoForm from '../prestamos/PrestamoForm';
import { cancelarActividad } from '../../services/actividadService';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';
import { listarUsuariosPorIds } from '../../services/usuarioService';
import { Usuario } from '../../types/usuario';
import { Link as RouterLink } from 'react-router-dom';

interface ActividadDetalleProps {
  actividad: Actividad;
  onClose?: () => void;
  onActividadUpdated?: () => void;  // Nueva función para notificar actualizaciones
}

const ActividadDetalle: React.FC<ActividadDetalleProps> = ({ actividad, onClose, onActividadUpdated }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { userProfile } = useAuth();
  const [participantes, setParticipantes] = useState<Usuario[]>([]);
  
  // Comprobar si el usuario actual es responsable o creador
  const esResponsable = userProfile && 
    (actividad.responsableActividadId === userProfile.uid || 
     actividad.creadorId === userProfile.uid ||
     actividad.responsableMaterialId === userProfile.uid);
  
  const esParticipante = userProfile && actividad.participanteIds?.includes(userProfile.uid);

  // Formatear fecha para mostrar
  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para crear URL de Google Calendar
  const addToGoogleCalendar = (actividad: Actividad) => {
    const inicio = actividad.fechaInicio instanceof Date 
      ? actividad.fechaInicio 
      : actividad.fechaInicio.toDate();
      
    const fin = actividad.fechaFin instanceof Date 
      ? actividad.fechaFin 
      : actividad.fechaFin.toDate();
      
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', actividad.nombre);
    url.searchParams.append('dates', 
      `${inicio.toISOString().replace(/-|:|\.\d+/g, '')}/
       ${fin.toISOString().replace(/-|:|\.\d+/g, '')}`);
    url.searchParams.append('details', actividad.descripcion || '');
    url.searchParams.append('location', actividad.lugar || '');
    
    window.open(url.toString(), '_blank');
  };

  // Función para cancelar actividad
  const handleCancelActividad = async () => {
    try {
      setIsCancelling(true);
      await cancelarActividad(actividad.id as string);
      
      toast({
        title: "Actividad cancelada",
        description: "La actividad ha sido cancelada correctamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Si se proporcionó función de actualización, ejecutarla
      if (onActividadUpdated) {
        onActividadUpdated();
      }
      
      // Cerrar diálogo y detalle
      setIsConfirmOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al cancelar actividad:", error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la actividad. Inténtalo de nuevo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Añadir esta función auxiliar
  const isResponsable = (userId: string) => {
    return userId === actividad.creadorId || 
           userId === actividad.responsableActividadId || 
           userId === actividad.responsableMaterialId;
  };

  // Cargar datos de los participantes al montar el componente
  useEffect(() => {
    const cargarParticipantes = async () => {
      if (!actividad.participanteIds?.length) return;
      
      try {
        const usuarios = await listarUsuariosPorIds(actividad.participanteIds);
        setParticipantes(usuarios);
      } catch (error) {
        console.error('Error al cargar los datos de los participantes:', error);
      }
    };
    
    cargarParticipantes();
  }, [actividad.participanteIds]);

  return (
    <Box>
      {/* Mantener la sección de badges */}
      <Flex wrap="wrap" gap={2} mb={3}>
        {actividad.tipo?.map(tipo => (
          <Badge key={tipo} colorScheme="blue">{tipo}</Badge>
        ))}
        {actividad.subtipo?.map(subtipo => (
          <Badge key={subtipo} colorScheme="purple" ml={1}>{subtipo}</Badge>
        ))}
        <Badge colorScheme={
          actividad.estado === 'planificada' ? 'yellow' : 
          actividad.estado === 'en_curso' ? 'green' : 
          actividad.estado === 'finalizada' ? 'blue' : 'red'
        }>
          {actividad.estado}
        </Badge>
        {actividad.dificultad && (
          <Badge colorScheme={
            actividad.dificultad === 'baja' ? 'green' : 
            actividad.dificultad === 'media' ? 'blue' : 'orange'
          }>
            Dificultad: {actividad.dificultad}
          </Badge>
        )}
      </Flex>
      
      <Divider my={3} />
      
      <Box mb={3}>
        <Text fontWeight="bold" mb={1}>Descripción:</Text>
        <Text>{actividad.descripcion}</Text>
      </Box>
      
      {actividad.necesidadMaterial && (esResponsable || esParticipante) ? (
        <Box mt={4}>
          <Heading size="sm" mb={2}>Material</Heading>
          {actividad.materiales && actividad.materiales.length > 0 ? (
            <List>
              {actividad.materiales.map((mat, index) => (
                <ListItem key={index}>
                  {mat.nombre} - Cantidad: {mat.cantidad}
                </ListItem>
              ))}
            </List>
          ) : (
            <Text fontSize="sm">No se ha especificado material</Text>
          )}
          
          {/* Solo mostrar botón de gestionar préstamo si es responsable */}
          {esResponsable && (
            <Button 
              size="sm" 
              colorScheme="brand" 
              mt={2}
            >
              Gestionar Préstamo
            </Button>
          )}
        </Box>
      ) : null}
      
      {/* En la sección que muestra los participantes */}
      <Box mt={4}>
        <Heading size="sm" mb={2}>Participantes</Heading>
        <Stack>
          {participantes.map((participante: Usuario) => (
            <Flex key={participante.uid} justify="space-between" align="center" p={2} bg="gray.50" borderRadius="md">
              <Text>{participante.nombre} {participante.apellidos}</Text>
              <Stack direction="row" spacing={1}>
                {participante.uid === actividad.creadorId && (
                  <Badge colorScheme="purple">Creador</Badge>
                )}
                {participante.uid === actividad.responsableActividadId && (
                  <Badge colorScheme="blue">Responsable</Badge>
                )}
                {participante.uid === actividad.responsableMaterialId && (
                  <Badge colorScheme="cyan">R. Material</Badge>
                )}
                {!isResponsable(participante.uid) && (
                  <Badge colorScheme="gray">Participante</Badge>
                )}
              </Stack>                
            </Flex>
          ))}
          {/* Botón de calendario a la derecha */}
          <Button
          leftIcon={<CalendarIcon />}
          onClick={() => addToGoogleCalendar(actividad)}
          colorScheme="blue"
          size="sm">
          Añadir a Google Calendar
        </Button>
        </Stack>
        
      </Box>

      {/* Botones de acción - Alineados a la derecha */}
      <Flex justify="flex-end" mt={4} alignItems="center">
        {/* Mostrar botón cancelar solo si no está ya cancelada o finalizada */}
        {esResponsable && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
          <Button 
            colorScheme="red"
            onClick={() => setIsConfirmOpen(true)} 
            mr={3}
          >
            Cancelar actividad
          </Button>
        )}

        {/* Nuevo botón para ver en página completa */}
        <Button
          as={RouterLink}
          to={`/activities/${actividad.id}`}
          colorScheme="blue"
          variant="outline"
          mr={3}
        >
          Ver completo
        </Button>

        {onClose && (
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        )}
      </Flex>

      {/* Diálogo de confirmación para cancelar actividad */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancelar actividad
            </AlertDialogHeader>

            <AlertDialogBody>
              ¿Estás seguro de que deseas cancelar esta actividad? 
              Esta acción no se puede deshacer.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                No, mantener
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCancelActividad} 
                ml={3}
                isLoading={isCancelling}
              >
                Sí, cancelar actividad
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ActividadDetalle;