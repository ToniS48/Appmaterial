/**
 * EstadisticasAnualesActividades - Componente para generar estadísticas de actividades
 * 
 * Proporciona un resumen anual completo de las actividades, incluyendo:
 * - Estadísticas generales por estado
 * - Análisis por tipo de actividad
 * - Distribución mensual
 * - Participación de usuarios
 * - Uso de materiales
 * - Tendencias y gráficos
 * 
 * @author Sistema de Gestión de Actividades
 * @version 1.0 - Implementación inicial
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Flex,
  CircularProgress,
  CircularProgressLabel
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiActivity,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiPieChart,
  FiMapPin
} from 'react-icons/fi';
import { Actividad, TipoActividad, EstadoActividad } from '../../../types/actividad';
import { listarActividades } from '../../../services/actividadService';
import { listarUsuarios } from '../../../services/usuarioService';

interface EstadisticasAnualesActividadesProps {
  añoSeleccionado: number;
  onCambioAño?: (año: number) => void;
}

interface EstadisticasActividad {
  total: number;
  porEstado: Record<EstadoActividad, number>;
  porTipo: Record<TipoActividad, number>;
  porMes: Record<number, number>;
  conMaterial: number;
  sinMaterial: number;
  participantesUnicos: number;
  lugaresUnicos: string[];
  promedioParticipantes: number;
  duracionPromedio: number;
}

interface EvolucionAnual {
  añoAnterior: EstadisticasActividad | null;
  cambios: {
    total: number;
    finalizadas: number;
    participantes: number;
  };
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

const EstadisticasAnualesActividades: React.FC<EstadisticasAnualesActividadesProps> = ({
  añoSeleccionado,
  onCambioAño
}) => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'resumen' | 'tipos' | 'timeline' | 'participacion'>('resumen');
  
  // Colores para el modo claro/oscuro
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, [añoSeleccionado]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const todasActividades = await listarActividades();
      setActividades(todasActividades);
      
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setError('Error al cargar las estadísticas de actividades');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar actividades del año seleccionado
  const actividadesAño = useMemo(() => {
    return actividades.filter(actividad => {
      const fechaInicio = convertirTimestampADate(actividad.fechaInicio);
      return fechaInicio ? fechaInicio.getFullYear() === añoSeleccionado : false;
    });
  }, [actividades, añoSeleccionado]);

  // Calcular estadísticas principales
  const estadisticas = useMemo((): EstadisticasActividad => {
    const stats: EstadisticasActividad = {
      total: actividadesAño.length,
      porEstado: {
        planificada: 0,
        en_curso: 0,
        finalizada: 0,
        cancelada: 0
      },
      porTipo: {
        espeleologia: 0,
        barranquismo: 0,
        exterior: 0
      },
      porMes: {},
      conMaterial: 0,
      sinMaterial: 0,
      participantesUnicos: 0,
      lugaresUnicos: [],
      promedioParticipantes: 0,
      duracionPromedio: 0
    };

    const participantesSet = new Set<string>();
    const lugaresSet = new Set<string>();
    let totalParticipantes = 0;
    let totalDuracion = 0;
    let actividadesConDuracion = 0;

    actividadesAño.forEach(actividad => {
      // Estadísticas por estado
      stats.porEstado[actividad.estado]++;

      // Estadísticas por tipo
      actividad.tipo.forEach(tipo => {
        if (tipo in stats.porTipo) {
          stats.porTipo[tipo as TipoActividad]++;
        }
      });

      // Estadísticas por mes
      const fechaInicio = convertirTimestampADate(actividad.fechaInicio);
      if (fechaInicio) {
        const mes = fechaInicio.getMonth() + 1;
        stats.porMes[mes] = (stats.porMes[mes] || 0) + 1;
      }

      // Material
      if (actividad.necesidadMaterial) {
        stats.conMaterial++;
      } else {
        stats.sinMaterial++;
      }

      // Participantes únicos
      actividad.participanteIds?.forEach(id => participantesSet.add(id));
      totalParticipantes += actividad.participanteIds?.length || 0;

      // Lugares únicos
      if (actividad.lugar) {
        lugaresSet.add(actividad.lugar);
      }

      // Duración (si tiene fecha fin)
      const fechaFin = convertirTimestampADate(actividad.fechaFin);
      if (fechaInicio && fechaFin) {
        const duracion = fechaFin.getTime() - fechaInicio.getTime();
        const dias = duracion / (1000 * 60 * 60 * 24);
        totalDuracion += dias;
        actividadesConDuracion++;
      }
    });

    stats.participantesUnicos = participantesSet.size;
    stats.lugaresUnicos = Array.from(lugaresSet);
    stats.promedioParticipantes = actividadesAño.length > 0 ? totalParticipantes / actividadesAño.length : 0;
    stats.duracionPromedio = actividadesConDuracion > 0 ? totalDuracion / actividadesConDuracion : 0;

    return stats;
  }, [actividadesAño]);

  // Calcular evolución respecto al año anterior
  const evolucion = useMemo((): EvolucionAnual => {
    const actividadesAñoAnterior = actividades.filter(actividad => {
      const fechaInicio = convertirTimestampADate(actividad.fechaInicio);
      return fechaInicio ? fechaInicio.getFullYear() === añoSeleccionado - 1 : false;
    });

    if (actividadesAñoAnterior.length === 0) {
      return {
        añoAnterior: null,
        cambios: { total: 0, finalizadas: 0, participantes: 0 }
      };
    }

    const statsAñoAnterior: EstadisticasActividad = {
      total: actividadesAñoAnterior.length,
      porEstado: {
        planificada: 0,
        en_curso: 0,
        finalizada: 0,
        cancelada: 0
      },
      porTipo: { espeleologia: 0, barranquismo: 0, exterior: 0 },
      porMes: {},
      conMaterial: 0,
      sinMaterial: 0,
      participantesUnicos: 0,
      lugaresUnicos: [],
      promedioParticipantes: 0,
      duracionPromedio: 0
    };

    actividadesAñoAnterior.forEach(actividad => {
      statsAñoAnterior.porEstado[actividad.estado]++;
    });

    const participantesAñoAnterior = new Set<string>();
    actividadesAñoAnterior.forEach(actividad => {
      actividad.participanteIds?.forEach(id => participantesAñoAnterior.add(id));
    });
    statsAñoAnterior.participantesUnicos = participantesAñoAnterior.size;

    return {
      añoAnterior: statsAñoAnterior,
      cambios: {
        total: estadisticas.total - statsAñoAnterior.total,
        finalizadas: estadisticas.porEstado.finalizada - statsAñoAnterior.porEstado.finalizada,
        participantes: estadisticas.participantesUnicos - statsAñoAnterior.participantesUnicos
      }
    };
  }, [actividades, añoSeleccionado, estadisticas]);

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

  // Función para obtener color de estado
  const getColorEstado = (estado: EstadoActividad): string => {
    switch (estado) {
      case 'finalizada': return 'green';
      case 'en_curso': return 'blue';
      case 'planificada': return 'yellow';
      case 'cancelada': return 'red';
      default: return 'gray';
    }
  };

  // Función para obtener color de tipo
  const getColorTipo = (tipo: TipoActividad): string => {
    switch (tipo) {
      case 'espeleologia': return 'purple';
      case 'barranquismo': return 'cyan';
      case 'exterior': return 'orange';
      default: return 'gray';
    }
  };

  // Renderizar resumen general
  const renderResumenGeneral = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Stat>
            <StatLabel>Total Actividades</StatLabel>
            <StatNumber color="blue.500">{estadisticas.total}</StatNumber>
            {evolucion.añoAnterior && (
              <StatHelpText>
                <StatArrow type={evolucion.cambios.total >= 0 ? 'increase' : 'decrease'} />
                {Math.abs(evolucion.cambios.total)} vs año anterior
              </StatHelpText>
            )}
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Stat>
            <StatLabel>Actividades Finalizadas</StatLabel>
            <StatNumber color="green.500">{estadisticas.porEstado.finalizada}</StatNumber>
            <StatHelpText>
              {estadisticas.total > 0 
                ? `${Math.round((estadisticas.porEstado.finalizada / estadisticas.total) * 100)}% del total`
                : '0% del total'
              }
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Stat>
            <StatLabel>Participantes Únicos</StatLabel>
            <StatNumber color="purple.500">{estadisticas.participantesUnicos}</StatNumber>
            {evolucion.añoAnterior && (
              <StatHelpText>
                <StatArrow type={evolucion.cambios.participantes >= 0 ? 'increase' : 'decrease'} />
                {Math.abs(evolucion.cambios.participantes)} vs año anterior
              </StatHelpText>
            )}
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Stat>
            <StatLabel>Promedio Participantes</StatLabel>
            <StatNumber color="orange.500">{estadisticas.promedioParticipantes.toFixed(1)}</StatNumber>
            <StatHelpText>Por actividad</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  // Renderizar distribución por estado
  const renderDistribucionEstados = () => (
    <Card bg={cardBg} borderColor={borderColor}>
      <CardBody>
        <Heading size="md" mb={4}>
          <HStack>
            <FiActivity />
            <Text>Distribución por Estado</Text>
          </HStack>
        </Heading>
        <VStack spacing={3}>
          {Object.entries(estadisticas.porEstado).map(([estado, cantidad]) => (
            <Box key={estado} w="100%">
              <Flex justify="space-between" mb={1}>
                <HStack>
                  <Badge colorScheme={getColorEstado(estado as EstadoActividad)}>
                    {estado.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Text fontSize="sm" color={textColor}>
                    {cantidad} actividades
                  </Text>
                </HStack>
                <Text fontSize="sm" fontWeight="bold">
                  {estadisticas.total > 0 ? Math.round((cantidad / estadisticas.total) * 100) : 0}%
                </Text>
              </Flex>
              <Progress
                value={estadisticas.total > 0 ? (cantidad / estadisticas.total) * 100 : 0}
                colorScheme={getColorEstado(estado as EstadoActividad)}
                size="sm"
                borderRadius="md"
              />
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );

  // Renderizar distribución por tipo
  const renderDistribucionTipos = () => (
    <Card bg={cardBg} borderColor={borderColor}>
      <CardBody>
        <Heading size="md" mb={4}>
          <HStack>
            <FiPieChart />
            <Text>Distribución por Tipo</Text>
          </HStack>
        </Heading>
        <VStack spacing={3}>
          {Object.entries(estadisticas.porTipo).map(([tipo, cantidad]) => (
            <Box key={tipo} w="100%">
              <Flex justify="space-between" mb={1}>
                <HStack>
                  <Badge colorScheme={getColorTipo(tipo as TipoActividad)}>
                    {tipo.toUpperCase()}
                  </Badge>
                  <Text fontSize="sm" color={textColor}>
                    {cantidad} actividades
                  </Text>
                </HStack>
                <Text fontSize="sm" fontWeight="bold">
                  {estadisticas.total > 0 ? Math.round((cantidad / estadisticas.total) * 100) : 0}%
                </Text>
              </Flex>
              <Progress
                value={estadisticas.total > 0 ? (cantidad / estadisticas.total) * 100 : 0}
                colorScheme={getColorTipo(tipo as TipoActividad)}
                size="sm"
                borderRadius="md"
              />
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );

  // Renderizar distribución mensual
  const renderDistribucionMensual = () => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const maxActividades = Math.max(...Object.values(estadisticas.porMes), 1);

    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>        <Heading size="md" mb={4}>
          <HStack>
            <FiBarChart2 />
            <Text>Distribución Mensual</Text>
          </HStack>
        </Heading>
          <VStack spacing={3}>
            {meses.map((mes, index) => {
              const numMes = index + 1;
              const cantidad = estadisticas.porMes[numMes] || 0;
              return (
                <Box key={mes} w="100%">
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="medium">{mes}</Text>
                    <Text fontSize="sm" color={textColor}>{cantidad} actividades</Text>
                  </Flex>
                  <Progress
                    value={(cantidad / maxActividades) * 100}
                    colorScheme="teal"
                    size="sm"
                    borderRadius="md"
                  />
                </Box>
              );
            })}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Renderizar uso de materiales
  const renderUsoMateriales = () => (
    <Card bg={cardBg} borderColor={borderColor}>
      <CardBody>
        <Heading size="md" mb={4}>
          <HStack>
            <FiPackage />
            <Text>Uso de Materiales</Text>
          </HStack>
        </Heading>
        <VStack spacing={4}>
          <HStack w="100%" justify="space-between">
            <CircularProgress
              value={estadisticas.total > 0 ? (estadisticas.conMaterial / estadisticas.total) * 100 : 0}
              color="blue.400"
              size="80px"
            >
              <CircularProgressLabel>
                {estadisticas.total > 0 ? Math.round((estadisticas.conMaterial / estadisticas.total) * 100) : 0}%
              </CircularProgressLabel>
            </CircularProgress>
            <VStack align="start" spacing={2}>
              <HStack>
                <Box w={3} h={3} bg="blue.400" borderRadius="sm" />
                <Text fontSize="sm">Con material: {estadisticas.conMaterial}</Text>
              </HStack>
              <HStack>
                <Box w={3} h={3} bg="gray.300" borderRadius="sm" />
                <Text fontSize="sm">Sin material: {estadisticas.sinMaterial}</Text>
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // Renderizar información adicional
  const renderInformacionAdicional = () => (
    <Card bg={cardBg} borderColor={borderColor}>
      <CardBody>
        <Heading size="md" mb={4}>
          <HStack>
            <FiMapPin />
            <Text>Información Adicional</Text>
          </HStack>
        </Heading>
        <VStack spacing={3} align="start">
          <HStack>
            <Text fontWeight="medium">Lugares visitados:</Text>
            <Badge variant="outline">{estadisticas.lugaresUnicos.length}</Badge>
          </HStack>
          <HStack>
            <Text fontWeight="medium">Duración promedio:</Text>
            <Text>{estadisticas.duracionPromedio.toFixed(1)} días</Text>
          </HStack>
          <Box>
            <Text fontWeight="medium" mb={2}>Lugares más visitados:</Text>
            <VStack align="start" spacing={1}>
              {estadisticas.lugaresUnicos.slice(0, 5).map((lugar, index) => (
                <Text key={lugar} fontSize="sm" color={textColor}>
                  {index + 1}. {lugar}
                </Text>
              ))}
              {estadisticas.lugaresUnicos.length > 5 && (
                <Text fontSize="sm" color={textColor}>
                  ... y {estadisticas.lugaresUnicos.length - 5} más
                </Text>
              )}
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );

  if (cargando) {
    return (
      <VStack spacing={4} py={8}>
        <Spinner size="xl" />
        <Text>Cargando estadísticas de actividades...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Selector de año */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={2}
          >
            <Heading size="lg">
              <HStack>
                <FiCalendar />
                <Text>Estadísticas de Actividades {añoSeleccionado}</Text>
              </HStack>
            </Heading>
            <Select
              value={añoSeleccionado}
              onChange={(e) => onCambioAño?.(parseInt(e.target.value))}
              width="150px"
              mt={{ base: 2, md: 0 }}
            >
              {añosDisponibles.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </Select>
          </Flex>
        </CardBody>
      </Card>

      {/* Resumen general */}
      {renderResumenGeneral()}

      {/* Pestañas de detalles */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab onClick={() => setVistaActual('resumen')}>
            <HStack>
              <FiActivity />
              <Text>Estados</Text>
            </HStack>
          </Tab>
          <Tab onClick={() => setVistaActual('tipos')}>
            <HStack>
              <FiPieChart />
              <Text>Tipos</Text>
            </HStack>
          </Tab>          <Tab onClick={() => setVistaActual('timeline')}>
            <HStack>
              <FiBarChart2 />
              <Text>Timeline</Text>
            </HStack>
          </Tab>
          <Tab onClick={() => setVistaActual('participacion')}>
            <HStack>
              <FiUsers />
              <Text>Participación</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {renderDistribucionEstados()}
              {renderUsoMateriales()}
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {renderDistribucionTipos()}
              {renderInformacionAdicional()}
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            {renderDistribucionMensual()}
          </TabPanel>
          <TabPanel>
            <Alert status="info">
              <AlertIcon />
              Gráficos de participación en desarrollo. Por ahora, consulta el resumen general para ver participantes únicos.
            </Alert>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Nota informativa */}
      <Text fontSize="sm" color={textColor} textAlign="center">
        Mostrando estadísticas de {estadisticas.total} actividades del año {añoSeleccionado}
      </Text>
    </VStack>
  );
};

export default EstadisticasAnualesActividades;
