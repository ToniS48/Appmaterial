import React, { useState, useEffect } from 'react';
import {
  Box, 
  SimpleGrid, 
  Text, 
  VStack, 
  Heading, 
  Badge, 
  useColorModeValue, 
  Button, 
  Spinner, 
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
  useToast
} from '@chakra-ui/react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Actividad, EstadoActividad, TipoActividad } from '../../types/actividad';
import { listarActividades } from '../../services/actividadService';
import ActividadDetalle from './ActividadDetalle';
import messages from '../../constants/messages';
import { safeISOString } from '../../utils/dateUtils';

// Días de la semana
const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Opciones de filtro
const estados: EstadoActividad[] = ['planificada', 'en_curso', 'finalizada', 'cancelada'];
const tipos: TipoActividad[] = ['espeleologia', 'barranquismo', 'exterior'];

interface CalendarioSimpleProps {
  mes?: Date;
}

const CalendarioSimple: React.FC<CalendarioSimpleProps> = ({ mes = new Date() }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(mes);
  const [currentMonth, setCurrentMonth] = useState<Date>(mes);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<Actividad | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Colores para los diferentes estados de actividades
  const colorEstado: Record<EstadoActividad, string> = {
    planificada: 'yellow.500',
    en_curso: 'green.500',
    finalizada: 'blue.500',
    cancelada: 'red.500'
  };
  
  // Mover hooks useColorModeValue al nivel superior
  const headerBgColor = useColorModeValue('gray.100', 'gray.700');
  const activeBoxBgColor = useColorModeValue('white', 'gray.800');
  const inactiveBoxBgColor = useColorModeValue('gray.50', 'gray.900');
  const defaultBorderColor = useColorModeValue('gray.200', 'gray.700');
  
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
        console.error("Error al cargar actividades:", error);
        toast({
          title: messages.calendario.toast.error.titulo,
          description: messages.calendario.toast.error.descripcion,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActividades();
  }, [filtroEstado, filtroTipo, toast]);
  
  // Navegar entre meses
  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };
  
  // Formatear fecha
  const formatMonth = (date: Date): string => {
    return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  };
  
  // Verificar si un día está en el mes actual
  const isCurrentMonth = (day: Date): boolean => {
    return day.getMonth() === currentMonth.getMonth();
  };
  
  // Verificar si un día es hoy
  const isToday = (day: Date): boolean => {
    const today = new Date();
    return day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear();
  };
  
  // Obtener actividades para un día específico
  const getActividadesForDay = (day: Date): Actividad[] => {
    return actividades.filter(act => {
      const inicio = act.fechaInicio instanceof Date ? act.fechaInicio : act.fechaInicio.toDate();
      const fin = act.fechaFin instanceof Date ? act.fechaFin : act.fechaFin.toDate();
      
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Comprobar si la actividad está en este día
      return (inicio <= dayEnd && fin >= dayStart);
    });
  };

  // Función para añadir varias actividades a Google Calendar
  const addAllToGoogleCalendar = () => {
    // Obtener actividades visibles (aplicando filtros actuales)
    const actividadesVisibles = actividades.filter(actividad => {
      const matchesEstado = !filtroEstado || actividad.estado === filtroEstado;
      const matchesTipo = !filtroTipo || actividad.tipo.includes(filtroTipo as TipoActividad);
      return matchesEstado && matchesTipo;
    });
  
    if (actividadesVisibles.length === 0) {
      toast({
        title: messages.calendario.toast.sinActividades.titulo,
        description: messages.calendario.toast.sinActividades.descripcion,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    // Preguntar al usuario si está seguro
    const confirmMessage = messages.calendario.confirmacion.añadirGoogleCalendar
      .replace(/{count}/g, actividadesVisibles.length.toString());
      
    if (window.confirm(confirmMessage)) {
      // Añadir cada actividad a Google Calendar
      actividadesVisibles.forEach(actividad => {
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
          `${safeISOString(inicio).replace(/-|:|\.\d+/g, '')}/
           ${safeISOString(fin).replace(/-|:|\.\d+/g, '')}`);
        url.searchParams.append('details', actividad.descripcion || '');
        url.searchParams.append('location', actividad.lugar || '');
        
        window.open(url.toString(), '_blank');
      });
      
      toast({
        title: messages.calendario.toast.exportacion.titulo,
        description: messages.calendario.toast.exportacion.descripcion
          .replace('{count}', actividadesVisibles.length.toString()),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
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
            <Box display={{ base: 'block', md: 'none' }}>
              <ChevronLeftIcon boxSize={5} />
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              Mes anterior
            </Box>
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
            <Box display={{ base: 'block', md: 'none' }}>
              <ChevronRightIcon boxSize={5} />
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              Mes siguiente
            </Box>
          </Button>
        </Flex>

        {/* Filtros - centrados en móvil, alineados a la derecha en desktop */}
        <Flex 
          gap={2} 
          flexWrap="wrap"
          width="100%"
          justifyContent={{ base: "center", md: "flex-end" }}
        >
          <Select 
            placeholder={messages.calendario.filtros.todosLosEstados}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            width={{ base: "100%", sm: "48%", md: "200px" }}
            maxW="200px"
          >
            {estados.map(estado => (
              <option key={estado} value={estado}>
                {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
              </option>
            ))}
          </Select>

          <Select 
            placeholder={messages.calendario.filtros.todosLosTipos}
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            width={{ base: "100%", sm: "48%", md: "200px" }}
            maxW="200px"
          >
            {tipos.map(tipo => (
              <option key={tipo} value={tipo}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </option>
            ))}
          </Select>
          
          <Button 
            leftIcon={<CalendarIcon />}
            onClick={addAllToGoogleCalendar}
            size="sm"
            colorScheme="blue"
            width={{ base: "100%", sm: "auto" }}
            title={messages.calendario.botones.añadirTodasTitle}
          >
            {messages.calendario.botones.añadirTodas}
          </Button>
        </Flex>
      </Flex>

      {/* Vista móvil: formato lista para pantallas pequeñas */}
      <Box display={{ base: "block", md: "none" }}>
        {calendarDays.map((day, index) => {
          const isActive = isCurrentMonth(day);
          const dayActivities = getActividadesForDay(day);
          if (!isActive && dayActivities.length === 0) return null;
          
          return (
            <Box 
              key={index}
              mb={2} 
              p={2} 
              bg={isActive ? "white" : "gray.50"}
              border="1px solid"
              borderColor={isToday(day) ? 'brand.500' : 'gray.200'}
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
          const isActive = isCurrentMonth(day);
          
          return (
            <Box 
              key={index} 
              height="120px"
              overflowY="auto"
              p={2} 
              bg={isActive ? activeBoxBgColor : inactiveBoxBgColor}
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
                      onOpen();
                    }}
                  >
                    <Text noOfLines={1}>{activity.nombre}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>
      
      {/* Modal para ver detalle de actividad */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedActivity ? `Detalle ${selectedActivity.nombre}` : "Detalle de Actividad"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedActivity && (
              <ActividadDetalle 
                actividad={selectedActivity}
                onClose={onClose}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CalendarioSimple;