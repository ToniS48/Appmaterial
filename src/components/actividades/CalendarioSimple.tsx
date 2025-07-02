import React, { useState, useEffect } from 'react';
import {
  Box, 
  SimpleGrid, 
  Text, 
  VStack, 
  Heading, 
  useColorModeValue, 
  Button, 
  Flex,
  HStack,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useToast,
  Badge,
  Switch,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Actividad, EstadoActividad, TipoActividad } from '../../types/actividad';
import { listarActividades } from '../../services/actividadService';
import { useGoogleServices } from '../../services/google';
import ActividadDetalle from './ActividadDetalle';
import messages from '../../constants/messages';
import { 
  safeISOString, 
  isSameDay, 
  toTimestamp,
  timestampToDate, 
  normalizarFecha 
} from '../../utils/dateUtils';

// Opciones de filtro
const estadosActividad: EstadoActividad[] = ['planificada', 'en_curso', 'finalizada', 'cancelada'];
const tiposActividad: TipoActividad[] = ['espeleologia', 'barranquismo', 'exterior'];

interface CalendarioSimpleProps {
  mes?: Date;
}

const CalendarioSimple: React.FC<CalendarioSimpleProps> = ({ mes = new Date() }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(mes);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<Actividad | null>(null);
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showGoogleEvents, setShowGoogleEvents] = useState<boolean>(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Google Services
  const { isConfigured, calendarService } = useGoogleServices();

  // Colores para los diferentes estados de actividades
  const colorEstado: Record<EstadoActividad, string> = {
    planificada: 'yellow.500',
    en_curso: 'green.500',
    finalizada: 'blue.500',
    cancelada: 'red.500'
  };  
  // Mover hooks useColorModeValue al nivel superior
  const activeBoxBgColor = useColorModeValue('white', 'gray.800');
  const inactiveBoxBgColor = useColorModeValue('gray.50', 'gray.900');
  const defaultBorderColor = useColorModeValue('gray.200', 'gray.700');
  const weekendBgColor = useColorModeValue('gray.100', 'gray.750'); // Este será para días pasados
  const weekendRedBgColor = useColorModeValue('red.100', 'red.700'); // Color rojo para fines de semana
  
  // Calcular los días del calendario
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Primer día del mes
    const firstDayOfMonth = new Date(year, month, 1);
    // Último día del mes
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Ajustar para que la semana comience en lunes (1) en lugar de domingo (0)
    let dayOfWeek = firstDayOfMonth.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir 0 (domingo) a 6, y restar 1 al resto
    
    // Calcular fecha de inicio del calendario (puede ser del mes anterior)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // Calcular fecha final del calendario
    const endDate = new Date(lastDayOfMonth);
    const daysToAdd = (6 - (lastDayOfMonth.getDay() === 0 ? 6 : lastDayOfMonth.getDay() - 1));
    endDate.setDate(endDate.getDate() + daysToAdd);
    
    // Crear array con todos los días a mostrar
    const days: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentMonth]);
  
  // Cargar actividades
  useEffect(() => {
    const fetchActividades = async () => {
      setLoading(true);
      try {
        // Aplicar filtros si están seleccionados
        const filtros: any = {};
        if (filtroEstado) filtros.estado = filtroEstado;
        if (filtroTipo) filtros.tipo = filtroTipo;
        
        const actividades = await listarActividades(filtros);
        setActividades(actividades);
      } catch (error) {
        console.error("Error al cargar actividades:", error);        toast({
          title: "Error",
          description: "No se pudieron cargar las actividades",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActividades();
  }, [currentMonth, filtroEstado, filtroTipo, toast]);

  // Cargar eventos de Google Calendar
  useEffect(() => {
    const fetchGoogleEvents = async () => {
      if (!isConfigured || !calendarService || !showGoogleEvents) {
        setGoogleEvents([]);
        return;
      }

      try {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const events = await calendarService.getEvents({
          timeMin: startOfMonth.toISOString(),
          timeMax: endOfMonth.toISOString(),
          maxResults: 50
        });
        
        setGoogleEvents(events || []);
      } catch (error) {
        console.error("Error al cargar eventos de Google Calendar:", error);
        // No mostrar error al usuario para no ser molesto
        setGoogleEvents([]);
      }
    };

    fetchGoogleEvents();
  }, [currentMonth, isConfigured, calendarService, showGoogleEvents]);
  
  // Navegar entre meses
  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };
  
  // Formatear fecha
  const formatMonth = (date: Date): string => {
    const monthName = date.toLocaleString('es-ES', { month: 'long' });
    const year = date.getFullYear();
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };
  
  // Verificar si un día está en el mes currentMonth
  const isCurrentMonth = (day: Date): boolean => {
    return day.getMonth() === currentMonth.getMonth();
  };
    // Verificar si un día es hoy
  const isToday = (day: Date): boolean => {
    const dayTimestamp = toTimestamp(day);
    const todayTimestamp = toTimestamp(new Date());
    return isSameDay(dayTimestamp, todayTimestamp);
  };

  // Verificar si un día es pasado
  const isPastDay = (day: Date): boolean => {
    const todayTs = normalizarFecha(toTimestamp(new Date()));
    const dateToCompareTs = normalizarFecha(toTimestamp(day));
    if (!todayTs || !dateToCompareTs) return false;
    
    const todayDate = timestampToDate(todayTs);
    const compareDate = timestampToDate(dateToCompareTs);
    if (!todayDate || !compareDate) return false;
    
    return compareDate.getTime() < todayDate.getTime();
  };
    // Obtener actividades para un día específico
  const getActividadesForDay = (day: Date): Actividad[] => {
    return actividades.filter(act => {
      const inicio = timestampToDate(toTimestamp(act.fechaInicio));
      const fin = timestampToDate(toTimestamp(act.fechaFin));
      if (!inicio || !fin) return false;
        const dayNormalizedTs = normalizarFecha(toTimestamp(day));
      const inicioNormalizedTs = normalizarFecha(toTimestamp(inicio));
      const finNormalizedTs = normalizarFecha(toTimestamp(fin));
      
      // Verificar que ninguno sea null antes de comparar
      if (!dayNormalizedTs || !inicioNormalizedTs || !finNormalizedTs) return false;
      
      // Convertir a Date para comparación
      const dayNormalized = timestampToDate(dayNormalizedTs);
      const inicioNormalized = timestampToDate(inicioNormalizedTs);
      const finNormalized = timestampToDate(finNormalizedTs);
      
      if (!dayNormalized || !inicioNormalized || !finNormalized) return false;
      
      // Comprobar si el día está dentro del rango de la actividad o coincide con el inicio/fin
      const diaEnRango = 
        dayNormalized.getTime() >= inicioNormalized.getTime() && 
        dayNormalized.getTime() <= finNormalized.getTime();
        
      const coincideInicio = dayNormalized.getTime() === inicioNormalized.getTime();
      const coincideFin = dayNormalized.getTime() === finNormalized.getTime();
      
      return diaEnRango || coincideInicio || coincideFin;
    });  };
  
  // Obtener eventos de Google Calendar para un día específico
  const getGoogleEventsForDay = (day: Date) => {
    if (!googleEvents || !showGoogleEvents) return [];
    
    return googleEvents.filter(event => {
      if (!event.start) return false;
      
      const eventDate = new Date(event.start.dateTime || event.start.date);
      const dayTime = day.getTime();
      const eventTime = eventDate.getTime();
      
      // Comprobar si es el mismo día
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000; // 24 horas después
      
      return eventTime >= dayStart && eventTime < dayEnd;
    });
  };

  return (
    <Box>
      {/* Controles de navegación */}
      <Flex 
        direction="column"
        mb={4}
        gap={4}
      >
        {/* Navegación mes/año - centrado en móvil */}
        <Flex 
          align="center" 
          gap={2} 
          justify="center"
          width="100%"
        >
          <Button 
            onClick={() => navigateMonth(-1)}
            size={{ base: "sm", md: "md" }}
            minW={{ base: "40px", md: "auto" }}
            aria-label="Mes anterior"
          >
            <ChevronLeftIcon boxSize={5} /> {/* Mostrar siempre el icono */}
          </Button>
          <Heading size={{ base: "sm", md: "md" }} textAlign="center" minW="140px">
            {formatMonth(currentMonth)}
          </Heading>
          <Button 
            onClick={() => navigateMonth(1)}
            size={{ base: "sm", md: "md" }}
            minW={{ base: "40px", md: "auto" }}
            aria-label="Mes siguiente"
          >
            <ChevronRightIcon boxSize={5} /> {/* Mostrar siempre el icono */}
          </Button>
        </Flex>

        {/* Filtros y botón de acción */}
        <Flex 
          direction={{ base: "column", md: "row" }}
          gap={2} // Espacio entre el grupo de filtros y el botón
          width="100%"
          justifyContent={{ base: "center", md: "space-between" }} // Centrado en móvil, espacio entre elementos en desktop
          alignItems="center" // Centrar elementos verticalmente en desktop y los grupos en móvil
        >
          {/* Grupo de Selects (filtros) */}
          <HStack
            spacing={2} // Espacio entre los selects
            width={{ base: "100%", md: "auto" }} // Ancho completo en móvil, auto en desktop para el grupo
            justifyContent={{ base: "center", md: "flex-start" }} // Centrar selects en móvil, alinear a la izquierda en desktop
            flexWrap="wrap" // Permitir que los selects se apilen en pantallas muy pequeñas si es necesario
          >            <Select 
              placeholder={messages.calendario.filtros.todosLosEstados}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              width={{ base: "100%", sm: "200px" }} // Ancho completo en 'base', 200px desde 'sm'
            >
              {estadosActividad.map(estado => (
                <option key={estado} value={estado}>
                  {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
                </option>
              ))}
            </Select>

            <Select 
              placeholder={messages.calendario.filtros.todosLosTipos}
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              width={{ base: "100%", sm: "200px" }} // Ancho completo en 'base', 200px desde 'sm'
            >
              {tiposActividad.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </Select>

            {/* Control para eventos de Google Calendar */}
            {isConfigured && (
              <FormControl display="flex" alignItems="center" width="auto">
                <FormLabel htmlFor="google-events" mb="0" fontSize="sm" whiteSpace="nowrap">
                  <Badge colorScheme="blue" mr={2}>Google</Badge>
                  Eventos
                </FormLabel>
                <Switch 
                  id="google-events"
                  isChecked={showGoogleEvents}
                  onChange={(e) => setShowGoogleEvents(e.target.checked)}
                  size="sm"
                />
              </FormControl>
            )}
          </HStack>
        </Flex>
      </Flex>

      {/* Vista móvil: formato lista para pantallas pequeñas */}
      <Box display={{ base: "block", md: "none" }}>
        {calendarDays.map((day, index) => {
          const isActive = isCurrentMonth(day);
          const dayActivities = getActividadesForDay(day);
          const dayGoogleEvents = getGoogleEventsForDay(day);
          if (!isActive && dayActivities.length === 0 && dayGoogleEvents.length === 0) return null;
          
          const dayOfWeek = day.getDay(); // 0 (Domingo) a 6 (Sábado)
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const pastDay = isPastDay(day) && !isToday(day);

          return (
            <Box 
              key={index}
              mb={2} 
              p={2} 
              bg={
                isWeekend ? weekendRedBgColor : 
                pastDay ? weekendBgColor : 
                (isActive ? activeBoxBgColor : inactiveBoxBgColor)
              }
              border="1px solid"
              borderColor={isToday(day) ? 'brand.500' : defaultBorderColor}
              borderRadius="md"
            >
              <Text 
                fontWeight={isToday(day) ? 'bold' : 'normal'}
                color={isToday(day) ? 'brand.500' : undefined}
                mb={1}
              >
                {day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
              </Text>
              
              {dayActivities.length > 0 ? (
                <VStack align="stretch" spacing={1}>
                  {dayActivities.map(activity => (
                    <Box 
                      key={activity.id}
                      p={2}
                      borderRadius="md"
                      bg={colorEstado[activity.estado] || 'gray.300'}
                      color="white"
                      cursor="pointer"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setSelectedGoogleEvent(null);
                        onOpen();
                      }}
                    >
                      {activity.nombre}
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.500">No hay actividades</Text>
              )}

              {/* Eventos de Google Calendar en vista móvil */}
              {dayGoogleEvents.length > 0 && (
                <VStack align="stretch" spacing={2} mt={3}>
                  <Text fontSize="sm" fontWeight="bold" color="blue.600">
                    Eventos de Google Calendar:
                  </Text>
                  {dayGoogleEvents.map(event => (
                    <Box 
                      key={event.id}
                      p={2}
                      borderRadius="md"
                      bg="blue.500"
                      color="white"
                      cursor="pointer"
                      onClick={() => {
                        setSelectedGoogleEvent(event);
                        setSelectedActivity(null);
                        onOpen();
                      }}
                    >
                      <Text fontWeight="bold">{event.summary}</Text>
                      {event.start && (
                        <Text fontSize="xs">
                          {event.start.dateTime 
                            ? new Date(event.start.dateTime).toLocaleString()
                            : event.start.date 
                            ? new Date(event.start.date).toLocaleDateString()
                            : 'Sin fecha'}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Vista escritorio: calendario en cuadrícula */}
      <SimpleGrid 
        columns={7} 
        spacing={1}
        display={{ base: "none", md: "grid" }}
      >
        {/* Días de la semana */}
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
          <Box 
            key={day} 
            textAlign="center" 
            fontWeight="bold" 
            p={2}
          >
            {day}
          </Box>
        ))}
        
        {/* Celdas del calendario */}
        {calendarDays.map((day, index) => {
          const dayActivities = getActividadesForDay(day);
          const dayGoogleEvents = getGoogleEventsForDay(day);
          const isActive = isCurrentMonth(day);
          
          const dayOfWeekForDesktop = day.getDay(); // 0 (Domingo) a 6 (Sábado)
          const isWeekendForDesktop = dayOfWeekForDesktop === 0 || dayOfWeekForDesktop === 6;
          const pastDayForDesktop = isPastDay(day) && !isToday(day);

          return (
            <Box 
              key={index} 
              height="120px"
              overflowY="auto"
              p={2} 
              bg={
                isWeekendForDesktop ? weekendRedBgColor :
                pastDayForDesktop ? weekendBgColor :
                (isActive ? activeBoxBgColor : inactiveBoxBgColor)
              }
              border="1px solid"
              borderColor={isToday(day) ? 'brand.500' : defaultBorderColor}
              opacity={isActive ? 1 : 0.6}
            >
              <Text 
                fontWeight={isToday(day) ? 'bold' : 'normal'}
                color={isToday(day) ? 'brand.500' : undefined}
              >
                {day.getDate()}
              </Text>
              
              <VStack align="stretch" spacing={1} mt={1}>
                {dayActivities.map(activity => (
                  <Box 
                    key={activity.id}
                    p={1}
                    borderRadius="md"
                    bg={colorEstado[activity.estado] || 'gray.300'}
                    color="white"
                    fontSize="xs"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedActivity(activity);
                      setSelectedGoogleEvent(null);
                      onOpen();
                    }}
                  >
                    <Text noOfLines={1}>{activity.nombre}</Text>
                  </Box>
                ))}
              </VStack>

              {/* Mostrar eventos de Google Calendar si hay */}
              {dayGoogleEvents.length > 0 && (
                <VStack align="stretch" spacing={1} mt={2}>
                  {dayGoogleEvents.map(event => (
                    <Box 
                      key={event.id}
                      p={1}
                      borderRadius="md"
                      bg="blue.500"
                      color="white"
                      fontSize="xs"
                      cursor="pointer"
                      onClick={() => {
                        setSelectedGoogleEvent(event);
                        setSelectedActivity(null);
                        onOpen();
                      }}
                    >
                      <Text noOfLines={1}>{event.summary}</Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          );
        })}
      </SimpleGrid>
      
      {/* Modal para ver detalle de actividad o evento de Google */}
      <Modal isOpen={isOpen} onClose={() => {
        onClose();
        setSelectedActivity(null);
        setSelectedGoogleEvent(null);
      }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedActivity 
              ? `Detalle ${selectedActivity.nombre}` 
              : selectedGoogleEvent
              ? `Evento: ${selectedGoogleEvent.summary}`
              : "Detalle de Actividad"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedActivity && (
              <ActividadDetalle 
                actividad={selectedActivity}
                onClose={onClose}
              />
            )}
            {selectedGoogleEvent && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" color="blue.600">Título</Text>
                  <Text>{selectedGoogleEvent.summary}</Text>
                </Box>
                
                {selectedGoogleEvent.description && (
                  <Box>
                    <Text fontWeight="bold" color="blue.600">Descripción</Text>
                    <Text>{selectedGoogleEvent.description}</Text>
                  </Box>
                )}
                
                <Box>
                  <Text fontWeight="bold" color="blue.600">Fecha y Hora</Text>
                  <Text>
                    {selectedGoogleEvent.start?.dateTime 
                      ? new Date(selectedGoogleEvent.start.dateTime).toLocaleString()
                      : selectedGoogleEvent.start?.date 
                      ? new Date(selectedGoogleEvent.start.date).toLocaleDateString()
                      : 'No especificada'}
                  </Text>
                  {selectedGoogleEvent.end && (
                    <Text fontSize="sm" color="gray.600">
                      Hasta: {selectedGoogleEvent.end?.dateTime 
                        ? new Date(selectedGoogleEvent.end.dateTime).toLocaleString()
                        : selectedGoogleEvent.end?.date 
                        ? new Date(selectedGoogleEvent.end.date).toLocaleDateString()
                        : 'No especificada'}
                    </Text>
                  )}
                </Box>
                
                {selectedGoogleEvent.location && (
                  <Box>
                    <Text fontWeight="bold" color="blue.600">Ubicación</Text>
                    <Text>{selectedGoogleEvent.location}</Text>
                  </Box>
                )}
                
                {selectedGoogleEvent.htmlLink && (
                  <Box>
                    <Button 
                      as="a"
                      href={selectedGoogleEvent.htmlLink}
                      target="_blank"
                      colorScheme="blue"
                      size="sm"
                    >
                      Ver en Google Calendar
                    </Button>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CalendarioSimple;
