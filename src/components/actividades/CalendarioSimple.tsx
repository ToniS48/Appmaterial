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
  useToast
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Actividad, EstadoActividad, TipoActividad } from '../../types/actividad';
import { listarActividades } from '../../services/actividadService';
import ActividadDetalle from './ActividadDetalle';
import messages from '../../constants/messages';
import { 
  safeISOString, 
  isSameDay, 
  toDate, 
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
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
  }, [filtroEstado, filtroTipo, toast]);
  
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
    return isSameDay(day, new Date());
  };

  // Verificar si un día es pasado
  const isPastDay = (day: Date): boolean => {
    const today = normalizarFecha(new Date());
    const dateToCompare = normalizarFecha(day);
    if (!today || !dateToCompare) return false;
    return dateToCompare.getTime() < today.getTime();
  };
  
  // Obtener actividades para un día específico
  const getActividadesForDay = (day: Date): Actividad[] => {
    return actividades.filter(act => {
      const inicio = toDate(act.fechaInicio);
      const fin = toDate(act.fechaFin);
      if (!inicio || !fin) return false;
      
      const dayNormalized = normalizarFecha(day);
      const inicioNormalized = normalizarFecha(inicio);
      const finNormalized = normalizarFecha(fin);
      
      // Verificar que ninguno sea null antes de comparar
      if (!dayNormalized || !inicioNormalized || !finNormalized) return false;
      
      // Si llegamos aquí, sabemos que ninguna variable es null
      // Comprobar si el día está dentro del rango de la actividad o coincide con el inicio/fin
      const diaEnRango = 
        dayNormalized.getTime() >= inicioNormalized.getTime() && 
        dayNormalized.getTime() <= finNormalized.getTime();
        
      const coincideInicio = dayNormalized.getTime() === inicioNormalized.getTime();
      const coincideFin = dayNormalized.getTime() === finNormalized.getTime();
      
      return diaEnRango || coincideInicio || coincideFin;
    });  };
  
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
          </HStack>
        </Flex>
      </Flex>

      {/* Vista móvil: formato lista para pantallas pequeñas */}
      <Box display={{ base: "block", md: "none" }}>
        {calendarDays.map((day, index) => {
          const isActive = isCurrentMonth(day);
          const dayActivities = getActividadesForDay(day);
          if (!isActive && dayActivities.length === 0) return null;
          
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