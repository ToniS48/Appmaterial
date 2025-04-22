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
  useToast,
  Stack,
  Tooltip,
} from '@chakra-ui/react';
import { CalendarIcon, InfoIcon, CheckIcon } from '@chakra-ui/icons';
import { Actividad } from '../../types/actividad';
import PrestamoForm from '../prestamos/PrestamoForm';
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
  const [addedToCalendar, setAddedToCalendar] = useState<boolean>(false);
  const toast = useToast();
  const { userProfile } = useAuth();
  const [participantes, setParticipantes] = useState<Usuario[]>([]);
  
  // Comprobar si el usuario actual es responsable o creador
  const esResponsable = userProfile && 
    (actividad.responsableActividadId === userProfile.uid || 
     actividad.creadorId === userProfile.uid ||
     actividad.responsableMaterialId === userProfile.uid);
  
  const esParticipante = userProfile && actividad.participanteIds?.includes(userProfile.uid);

  // Añadir useEffect para verificar si ya se ha añadido al calendario
  useEffect(() => {
    if (actividad.id) {
      const addedActivities = localStorage.getItem('calendarActivities');
      if (addedActivities) {
        try {
          const activitiesArray = JSON.parse(addedActivities);
          setAddedToCalendar(activitiesArray.includes(actividad.id));
        } catch (e) {
          console.error('Error parsing calendar activities from localStorage', e);
        }
      }
    }
  }, [actividad.id]);

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
  const addToGoogleCalendar = () => {
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
    
    // Abrir la ventana
    window.open(url.toString(), '_blank');
    
    // Guardar en localStorage
    if (actividad.id) {
      try {
        const addedActivities = localStorage.getItem('calendarActivities') || '[]';
        const activitiesArray = JSON.parse(addedActivities);
        if (!activitiesArray.includes(actividad.id)) {
          activitiesArray.push(actividad.id);
          localStorage.setItem('calendarActivities', JSON.stringify(activitiesArray));
          setAddedToCalendar(true);
          
          toast({
            title: "Actividad añadida al calendario",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (e) {
        console.error('Error saving to localStorage', e);
      }
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
          
          {/* Botón de calendario con estado */}
          {!addedToCalendar ? (
            <Button
              leftIcon={<CalendarIcon />}
              onClick={addToGoogleCalendar}
              colorScheme="blue"
              size="sm">
              Añadir a Google Calendar
            </Button>
          ) : (
            <Tooltip label="Ya añadido al calendario">
              <Button
                leftIcon={<CheckIcon />}
                size="sm"
                colorScheme="green"
                variant="outline"
                isDisabled={true}
              >
                Añadido a calendario
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Botones de acción - Alineados a la derecha */}
      <Flex justify="flex-end" mt={4} alignItems="center">
        {/* Nuevo botón para ver en página completa */}
        <Button
          as={RouterLink}
          to={`/activities/${actividad.id}`}
          colorScheme="blue"
          variant="outline"
        >
          Ver completo
        </Button>
      </Flex>
    </Box>
  );
};

export default ActividadDetalle;