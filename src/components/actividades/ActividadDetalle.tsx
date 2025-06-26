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
  Tooltip,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  Badge
} from '@chakra-ui/react';
import { CheckIcon, CalendarIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { listarUsuariosPorIds } from '../../services/usuarioService';
import { 
  FiPackage, FiStar, FiUser, FiUsers, FiCheckCircle, FiClock, 
  FiAlertCircle, FiXCircle, FiCheck, FiFileText, FiCloudRain, FiInfo
} from 'react-icons/fi';
import IconBadge from '../common/IconBadge';
import { Actividad } from '../../types/actividad';
import { Usuario } from '../../types/usuario';
import WeatherCard from '../weather/WeatherCard';
import WeatherEnhancedPanel from '../weather/WeatherEnhancedPanel';
import { useWeather } from '../../hooks/useWeather';

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

  // Hook para datos meteorológicos
  const { weatherData, loading: weatherLoading, error: weatherError } = useWeather(actividad, {
    enabled: actividad.estado !== 'finalizada' && actividad.estado !== 'cancelada',
    location: actividad.lugar
  });

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
  }, [actividad.participanteIds]);  return (
    <Box>
      {/* Pestañas principales */}
      <VStack align="stretch" spacing={4}>        {/* Pestañas principales */}
        <Tabs variant="enclosed" colorScheme="blue" size="sm">
          <TabList>
            <Tab>
              <HStack spacing={1}>
                <FiInfo size={14} />
                <Text>General</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={1}>
                <FiUsers size={14} />
                <Text>Participantes</Text>
                <Badge colorScheme="blue" size="sm">{participantes.length}</Badge>
              </HStack>
            </Tab>
            {weatherData.length > 0 && !weatherLoading && !weatherError && (
              <Tab>
                <HStack spacing={1}>
                  <FiCloudRain size={14} />
                  <Text>Meteorología</Text>
                </HStack>
              </Tab>
            )}
          </TabList>

          <TabPanels>
            {/* Pestaña General */}
            <TabPanel px={0} py={4}>
              <VStack align="stretch" spacing={4}>
                {/* Badges de tipo, subtipo, estado y dificultad */}
                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600" mb={2}>Estado y categorías</Text>
                  <Flex wrap="wrap" gap={2}>
                    {actividad.tipo?.map(tipo => (
                      <IconBadge 
                        key={tipo} 
                        icon={FiCheckCircle} 
                        label={tipo} 
                        color="blue" 
                        size={4}
                      />
                    ))}
                    
                    {actividad.subtipo?.map(subtipo => (
                      <IconBadge 
                        key={subtipo} 
                        icon={FiCheckCircle} 
                        label={subtipo} 
                        color="purple" 
                        size={4}
                      />
                    ))}
                    
                    <IconBadge 
                      icon={
                        actividad.estado === 'planificada' ? FiClock :
                        actividad.estado === 'en_curso' ? FiCheckCircle :
                        actividad.estado === 'finalizada' ? FiCheck :
                        FiXCircle
                      } 
                      label={actividad.estado} 
                      color={
                        actividad.estado === 'planificada' ? 'yellow' :
                        actividad.estado === 'en_curso' ? 'green' :
                        actividad.estado === 'finalizada' ? 'blue' :
                        'red'
                      }
                      size={4}
                    />
                    
                    {actividad.dificultad && (
                      <IconBadge 
                        icon={FiAlertCircle} 
                        label={`Dificultad: ${actividad.dificultad}`} 
                        color={
                          actividad.dificultad === 'baja' ? 'green' :
                          actividad.dificultad === 'media' ? 'orange' :
                          'red'
                        }
                        size={4}
                      />
                    )}
                  </Flex>
                </Box>

                <Divider />

                {/* Descripción */}
                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600" mb={2}>Descripción</Text>
                  <Text fontSize="sm">{actividad.descripcion || 'Sin descripción'}</Text>
                </Box>

                {/* Botón de calendario */}
                <Box pt={2}>
                  {!addedToCalendar ? (
                    <Button
                      leftIcon={<CalendarIcon />}
                      onClick={addToGoogleCalendar}
                      colorScheme="blue"
                      size="sm"
                      variant="outline"
                      width="full"
                    >
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
                        width="full"
                      >
                        Añadido a calendario
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </VStack>
            </TabPanel>

            {/* Pestaña Participantes */}
            <TabPanel px={0} py={4}>
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="semibold" fontSize="sm" color="gray.600" mb={1}>
                  Participantes ({participantes.length})
                </Text>
                
                {participantes.length > 0 ? (
                  <Stack spacing={3}>
                    {participantes.map((participante) => (
                      <Flex key={participante.uid} align="center" p={2} bg="gray.50" borderRadius="md">
                        <Avatar size="sm" name={`${participante.nombre} ${participante.apellidos}`} mr={3} />
                        <Box flex="1">
                          <Text fontWeight="medium" fontSize="sm">
                            {participante.nombre} {participante.apellidos}
                          </Text>
                          <HStack mt={1} spacing={1}>
                            {participante.uid === actividad.creadorId && (
                              <IconBadge icon={FiStar} label="Creador" color="purple" size={3} />
                            )}
                            {participante.uid === actividad.responsableActividadId && (
                              <IconBadge icon={FiUser} label="Responsable" color="blue" size={3} />
                            )}
                            {participante.uid === actividad.responsableMaterialId && (
                              <IconBadge icon={FiPackage} label="R. Material" color="cyan" size={3} />
                            )}
                            {!isResponsable(participante.uid) && (
                              <IconBadge icon={FiUsers} label="Participante" color="gray" size={3} />
                            )}
                          </HStack>
                        </Box>
                      </Flex>
                    ))}
                  </Stack>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Text fontSize="sm" color="gray.500">No hay participantes registrados</Text>
                  </Box>
                )}
              </VStack>
            </TabPanel>            {/* Pestaña Meteorología - solo si hay datos */}
            {weatherData.length > 0 && !weatherLoading && !weatherError && (
              <TabPanel px={0} py={4}>
                <WeatherEnhancedPanel 
                  actividad={actividad}
                  initialWeatherData={weatherData}
                />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>

        {/* Botón de acción - Alineado a la derecha */}
        <Flex justify="flex-end" mt={4} pt={4} borderTop="1px" borderColor="gray.200">
          <Button
            as={RouterLink}
            to={`/activities/${actividad.id}`}
            colorScheme="blue"
            variant="outline"
            size="sm"
          >
            Ver completo
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default ActividadDetalle;
