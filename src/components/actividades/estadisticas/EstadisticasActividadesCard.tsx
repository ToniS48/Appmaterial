/**
 * EstadisticasActividadesCard - Card independiente para estadísticas de actividades
 * 
 * Componente compacto que muestra un resumen de estadísticas de actividades
 * en formato de card, ideal para dashboards y vistas de resumen.
 * 
 * @author Sistema de Gestión de Actividades
 * @version 1.0 - Implementación inicial
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Select,
  Heading,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Flex,
  CircularProgress,
  CircularProgressLabel,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiActivity,
  FiUsers,
  FiTrendingUp,
  FiBarChart2,
  FiEye
} from 'react-icons/fi';
import { Actividad, TipoActividad, EstadoActividad } from '../../../types/actividad';
import { listarActividades } from '../../../services/actividadService';
import EstadisticasAnualesActividades from './EstadisticasAnualesActividades';

interface EstadisticasActividadesCardProps {
  añoSeleccionado?: number;
  compacto?: boolean;
  mostrarTendencias?: boolean;
}

interface ResumenEstadisticas {
  total: number;
  finalizadas: number;
  enCurso: number;
  planificadas: number;
  participantesUnicos: number;
  tasaFinalizacion: number;
  cambioRespectoPeriodoAnterior: number;
}

// Helper function para convertir Timestamp a Date de manera segura
const convertirTimestampADate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return null;
};

const EstadisticasActividadesCard: React.FC<EstadisticasActividadesCardProps> = ({
  añoSeleccionado = new Date().getFullYear(),
  compacto = false,
  mostrarTendencias = true
}) => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [añoActual, setAñoActual] = useState(añoSeleccionado);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Colores para el modo claro/oscuro
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const todasActividades = await listarActividades();
      setActividades(todasActividades);
      
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setCargando(false);
    }
  };

  // Calcular estadísticas del año actual
  const estadisticasActuales = useMemo((): ResumenEstadisticas => {
    const actividadesAño = actividades.filter(actividad => {
      const fechaInicio = convertirTimestampADate(actividad.fechaInicio);
      return fechaInicio ? fechaInicio.getFullYear() === añoActual : false;
    });

    const participantesSet = new Set<string>();
    actividadesAño.forEach(actividad => {
      actividad.participanteIds?.forEach(id => participantesSet.add(id));
    });

    const finalizadas = actividadesAño.filter(a => a.estado === 'finalizada').length;
    const enCurso = actividadesAño.filter(a => a.estado === 'en_curso').length;
    const planificadas = actividadesAño.filter(a => a.estado === 'planificada').length;

    return {
      total: actividadesAño.length,
      finalizadas,
      enCurso,
      planificadas,
      participantesUnicos: participantesSet.size,
      tasaFinalizacion: actividadesAño.length > 0 ? (finalizadas / actividadesAño.length) * 100 : 0,
      cambioRespectoPeriodoAnterior: 0 // Se calculará después
    };
  }, [actividades, añoActual]);

  // Calcular cambio respecto al año anterior
  const cambioAnual = useMemo(() => {
    const actividadesAñoAnterior = actividades.filter(actividad => {
      const fechaInicio = convertirTimestampADate(actividad.fechaInicio);
      return fechaInicio ? fechaInicio.getFullYear() === añoActual - 1 : false;
    });

    if (actividadesAñoAnterior.length === 0) return 0;
    
    const diferencia = estadisticasActuales.total - actividadesAñoAnterior.length;
    return Math.round((diferencia / actividadesAñoAnterior.length) * 100);
  }, [actividades, añoActual, estadisticasActuales.total]);

  // Generar años disponibles
  const añosDisponibles = useMemo(() => {
    const años = new Set<number>();
    actividades.forEach(actividad => {
      const fechaInicio = convertirTimestampADate(actividad.fechaInicio);
      if (fechaInicio) {
        años.add(fechaInicio.getFullYear());
      }
    });
    return Array.from(años).sort((a, b) => b - a);
  }, [actividades]);

  // Función para obtener color de progreso
  const getColorProgreso = (porcentaje: number): string => {
    if (porcentaje >= 80) return 'green';
    if (porcentaje >= 60) return 'blue';
    if (porcentaje >= 40) return 'yellow';
    return 'red';
  };

  if (cargando) {
    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Spinner size="lg" color={accentColor} />
            <Text color={textColor}>Cargando estadísticas...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card bg={cardBg} borderColor={borderColor} cursor="pointer" _hover={{ shadow: 'md' }}>
        <CardHeader pb={2}>
          <HStack justify="space-between" align="center">
            <HStack>
              <FiActivity color={accentColor} />
              <Heading size="md" color={accentColor}>
                Estadísticas de Actividades
              </Heading>
            </HStack>
            <HStack>
              {!compacto && añosDisponibles.length > 1 && (
                <Select
                  value={añoActual}
                  onChange={(e) => setAñoActual(parseInt(e.target.value))}
                  size="sm"
                  width="100px"
                >
                  {añosDisponibles.map(año => (
                    <option key={año} value={año}>{año}</option>
                  ))}
                </Select>
              )}
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<FiEye />}
                onClick={onOpen}
              >
                Ver detalles
              </Button>
            </HStack>
          </HStack>
        </CardHeader>

        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            {/* Estadísticas principales */}
            <SimpleGrid columns={compacto ? 2 : 4} spacing={4}>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {estadisticasActuales.total}
                </Text>
                <Text fontSize="sm" color={textColor}>Total</Text>
                {mostrarTendencias && cambioAnual !== 0 && (
                  <HStack justify="center" fontSize="xs">
                    {cambioAnual > 0 ? (
                      <FiTrendingUp color="green" />
                    ) : (
                      <FiTrendingUp color="red" style={{ transform: 'rotate(180deg)' }} />
                    )}
                    <Text color={cambioAnual > 0 ? 'green.500' : 'red.500'}>
                      {Math.abs(cambioAnual)}%
                    </Text>
                  </HStack>
                )}
              </Box>

              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {estadisticasActuales.finalizadas}
                </Text>
                <Text fontSize="sm" color={textColor}>Finalizadas</Text>
              </Box>

              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {estadisticasActuales.enCurso}
                </Text>
                <Text fontSize="sm" color={textColor}>En Curso</Text>
              </Box>

              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {estadisticasActuales.participantesUnicos}
                </Text>
                <Text fontSize="sm" color={textColor}>Participantes</Text>
              </Box>
            </SimpleGrid>

            {/* Progreso de finalización */}
            {!compacto && (
              <>
                <Divider />
                <Box>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      Tasa de Finalización
                    </Text>
                    <Badge colorScheme={getColorProgreso(estadisticasActuales.tasaFinalizacion)}>
                      {estadisticasActuales.tasaFinalizacion.toFixed(1)}%
                    </Badge>
                  </Flex>
                  <Progress
                    value={estadisticasActuales.tasaFinalizacion}
                    colorScheme={getColorProgreso(estadisticasActuales.tasaFinalizacion)}
                    size="sm"
                    borderRadius="md"
                  />
                </Box>
              </>
            )}

            {/* Distribución rápida por estado */}
            {!compacto && (
              <SimpleGrid columns={3} spacing={2}>
                <VStack spacing={1}>
                  <CircularProgress
                    value={estadisticasActuales.total > 0 ? (estadisticasActuales.planificadas / estadisticasActuales.total) * 100 : 0}
                    color="yellow.400"
                    size="40px"
                  >
                    <CircularProgressLabel fontSize="xs">
                      {estadisticasActuales.total > 0 ? Math.round((estadisticasActuales.planificadas / estadisticasActuales.total) * 100) : 0}%
                    </CircularProgressLabel>
                  </CircularProgress>
                  <Text fontSize="xs" color={textColor}>Planificadas</Text>
                </VStack>

                <VStack spacing={1}>
                  <CircularProgress
                    value={estadisticasActuales.total > 0 ? (estadisticasActuales.enCurso / estadisticasActuales.total) * 100 : 0}
                    color="blue.400"
                    size="40px"
                  >
                    <CircularProgressLabel fontSize="xs">
                      {estadisticasActuales.total > 0 ? Math.round((estadisticasActuales.enCurso / estadisticasActuales.total) * 100) : 0}%
                    </CircularProgressLabel>
                  </CircularProgress>
                  <Text fontSize="xs" color={textColor}>En Curso</Text>
                </VStack>

                <VStack spacing={1}>
                  <CircularProgress
                    value={estadisticasActuales.total > 0 ? (estadisticasActuales.finalizadas / estadisticasActuales.total) * 100 : 0}
                    color="green.400"
                    size="40px"
                  >
                    <CircularProgressLabel fontSize="xs">
                      {estadisticasActuales.total > 0 ? Math.round((estadisticasActuales.finalizadas / estadisticasActuales.total) * 100) : 0}%
                    </CircularProgressLabel>
                  </CircularProgress>
                  <Text fontSize="xs" color={textColor}>Finalizadas</Text>
                </VStack>
              </SimpleGrid>
            )}

            {/* Nota del año */}
            <Text fontSize="xs" color={textColor} textAlign="center">
              Datos del año {añoActual}
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Modal con estadísticas detalladas */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Estadísticas Detalladas de Actividades
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <EstadisticasAnualesActividades
              añoSeleccionado={añoActual}
              onCambioAño={(año) => setAñoActual(año)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EstadisticasActividadesCard;
