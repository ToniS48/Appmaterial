import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Text,
  Heading,
  Flex,
  Button,
  Stack,
  Divider,
  Avatar,
  HStack,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { CheckIcon, CalendarIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { listarUsuariosPorIds } from '../../services/usuarioService';
import { 
  FiPackage, FiStar, FiUser, FiUsers, FiCheckCircle, FiClock, 
  FiAlertCircle, FiXCircle 
} from 'react-icons/fi';
import IconBadge from '../common/IconBadge';
import { Actividad } from '../../types/actividad';
import { Usuario } from '../../types/usuario';

interface ActividadDetalleProps {
  actividad: Actividad;
  onClose?: () => void;
  onActividadUpdated?: () => void;  // Nueva función para notificar actualizaciones
}

const ActividadDetalle: React.FC<ActividadDetalleProps> = ({ actividad, onClose, onActividadUpdated }) => {
  const [addedToCalendar, setAddedToCalendar] = useState<boolean>(false);
  const toast = useToast();  const { userProfile } = useAuth();
  const [participantes, setParticipantes] = useState<Usuario[]>([]);

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
    }  }, [actividad.id]);

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
          <IconBadge 
            key={tipo} 
            icon={FiCheckCircle} 
            label={tipo} 
            color="blue" 
          />
        ))}
        
        {actividad.subtipo?.map(subtipo => (
          <IconBadge 
            key={subtipo} 
            icon={FiCheckCircle} 
            label={subtipo} 
            color="purple" 
          />
        ))}
        
        <IconBadge 
          icon={
            actividad.estado === 'planificada' ? FiClock :
            actividad.estado === 'en_curso' ? FiCheckCircle :
            actividad.estado === 'finalizada' ? FiCheckCircle :
            FiXCircle
          } 
          label={actividad.estado} 
          color={
            actividad.estado === 'planificada' ? 'yellow' :
            actividad.estado === 'en_curso' ? 'green' :
            actividad.estado === 'finalizada' ? 'blue' :
            'red'
          } 
        />
        
        {actividad.dificultad && (
          <IconBadge 
            icon={
              actividad.dificultad === 'baja' ? FiCheckCircle :
              actividad.dificultad === 'media' ? FiClock :
              FiAlertCircle
            } 
            label={`Dificultad: ${actividad.dificultad}`} 
            color={
              actividad.dificultad === 'baja' ? 'green' :
              actividad.dificultad === 'media' ? 'blue' :
              'orange'
            } 
          />
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
          {participantes.map((participante) => (
            <Flex key={participante.uid} align="center" mb={2}>
              <Avatar size="sm" name={`${participante.nombre} ${participante.apellidos}`} mr={2} />
              <Box>
                <Text fontWeight="medium">
                  {participante.nombre} {participante.apellidos}
                </Text>
                <HStack mt={1}>
                  {participante.uid === actividad.creadorId && (
                    <IconBadge icon={FiStar} label="Creador" color="purple" size={4} />
                  )}
                  {participante.uid === actividad.responsableActividadId && (
                    <IconBadge icon={FiUser} label="Responsable" color="blue" size={4} />
                  )}
                  {participante.uid === actividad.responsableMaterialId && (
                    <IconBadge icon={FiPackage} label="R. Material" color="cyan" size={4} />
                  )}
                  {!isResponsable(participante.uid) && (
                    <IconBadge icon={FiUsers} label="Participante" color="gray" size={4} />
                  )}
                </HStack>
              </Box>
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