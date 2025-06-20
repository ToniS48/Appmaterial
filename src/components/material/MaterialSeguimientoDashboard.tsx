/**
 * Dashboard de Seguimiento de Material por Años - Versión Optimizada
 * Proporciona una vista completa del historial, estadísticas y reportes anuales
 * Optimizado con lazy loading y cache inteligente para mejorar rendimiento en 4G
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  IconButton,
  Tooltip as ChakraTooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Grid,
  GridItem,
  Progress,
  Flex,
  Spacer,
  useColorModeValue,
  Spinner,
  Center,
  Skeleton,
  SkeletonText
} from '@chakra-ui/react';
import {
  FiDownload,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiBarChart,
  FiFileText,
  FiAlertTriangle,
  FiEye,
  FiCalendar,
  FiDollarSign,
  FiActivity,
  FiDatabase
} from 'react-icons/fi';
import { 
  EstadisticasAnuales, 
  EventoMaterial, 
  ResumenAnualMaterial,
  TipoEventoMaterial 
} from '../../types/materialHistorial';
import { materialHistorialService } from '../../services/domain/MaterialHistorialService';
import { format, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLazyDataManager, useOnDemandData } from '../../hooks/useLazyDataManager';
import { networkOptimization } from '../../services/networkOptimization';

// Gráficos interactivos con Chart.js
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface MaterialSeguimientoDashboardProps {
  añoInicial?: number;
}

const MaterialSeguimientoDashboard: React.FC<MaterialSeguimientoDashboardProps> = ({
  añoInicial
}) => {
  const toast = useToast();
  const { isOpen: isReporteOpen, onOpen: onReporteOpen, onClose: onReporteClose } = useDisclosure();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
    // Estados
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoInicial || new Date().getFullYear());
  const [reporteTexto, setReporteTexto] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [networkInfo, setNetworkInfo] = useState(networkOptimization.getNetworkInfo());

  // Suscribirse a cambios de configuración de red
  useEffect(() => {
    const unsubscribe = networkOptimization.subscribe((config) => {
      setNetworkInfo(networkOptimization.getNetworkInfo());
    });

    return unsubscribe;
  }, []);

  // Años disponibles para selección
  const añosDisponibles = useMemo(() => {
    const añoActual = new Date().getFullYear();
    const años = [];
    for (let i = 0; i < 5; i++) {
      años.push(añoActual - i);
    }
    return años;
  }, []);

  // Lazy loading para estadísticas principales - siempre cargadas
  const estadisticasManager = useLazyDataManager({
    loadFunction: () => materialHistorialService.obtenerEstadisticasAnuales(añoSeleccionado),
    cacheKey: `estadisticas-${añoSeleccionado}`,
    cacheTTL: 5 * 60 * 1000, // 5 minutos para datos principales
    loadOnMount: true,
    onError: (error) => {
      toast({
        title: 'Error al cargar estadísticas',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  });

  // Lazy loading para eventos recientes - solo cuando se necesiten
  const eventosManager = useOnDemandData({
    loadFunction: () => materialHistorialService.obtenerHistorial({ 
      años: [añoSeleccionado] 
    }).then(eventos => eventos.slice(0, 20)),
    cacheKey: `eventos-recientes-${añoSeleccionado}`,
    cacheTTL: 3 * 60 * 1000, // 3 minutos para eventos
    onError: (error) => {
      toast({
        title: 'Error al cargar eventos',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  });

  // Lazy loading para materiales problemáticos - solo cuando se necesiten
  const materialesProblematicosManager = useOnDemandData({
    loadFunction: () => materialHistorialService.obtenerMaterialesProblematicos(añoSeleccionado, 10),
    cacheKey: `materiales-problematicos-${añoSeleccionado}`,
    cacheTTL: 10 * 60 * 1000, // 10 minutos para materiales problemáticos
    onError: (error) => {
      toast({
        title: 'Error al cargar materiales problemáticos',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  });

  // Lazy loading para comparación de años - solo cuando se necesite
  const comparacionManager = useOnDemandData({
    loadFunction: () => materialHistorialService.compararAños(añoSeleccionado - 1, añoSeleccionado),
    cacheKey: `comparacion-${añoSeleccionado}`,
    cacheTTL: 10 * 60 * 1000, // 10 minutos para comparaciones
    onError: (error) => {
      console.warn('No se pudo cargar la comparación:', error.message);
    }
  });

  // Efecto para actualizar datos cuando cambia el año
  useEffect(() => {
    console.log(`🔄 [MaterialDashboard] Cambiando al año: ${añoSeleccionado}`);
    
    // Forzar recarga de estadísticas principales
    estadisticasManager.forceReload();
    
    // Limpiar cache de otros datos para el nuevo año
    eventosManager.clearCache();
    materialesProblematicosManager.clearCache();
    comparacionManager.clearCache();
    
    // Precargar datos según la pestaña activa
    if (activeTab === 2) { // Pestaña de eventos
      eventosManager.load();
    } else if (activeTab === 3) { // Pestaña de materiales
      materialesProblematicosManager.load();
    } else if (activeTab === 4 && añoSeleccionado > 2020) { // Pestaña de comparación
      comparacionManager.load();
    }
  }, [añoSeleccionado]);

  // Manejar cambio de pestaña con lazy loading
  const handleTabChange = useCallback((index: number) => {
    setActiveTab(index);
    
    // Cargar datos específicos según la pestaña
    switch (index) {
      case 2: // Eventos
        if (!eventosManager.loaded) {
          eventosManager.load();
        }
        break;
      case 3: // Materiales problemáticos
        if (!materialesProblematicosManager.loaded) {
          materialesProblematicosManager.load();
        }
        break;
      case 4: // Comparación
        if (añoSeleccionado > 2020 && !comparacionManager.loaded) {
          comparacionManager.load();
        }
        break;
    }
  }, [añoSeleccionado, eventosManager, materialesProblematicosManager, comparacionManager]);

  // Generar reporte con cache
  const generarReporte = useCallback(async () => {
    try {
      console.log(`📄 [MaterialDashboard] Generando reporte para ${añoSeleccionado}...`);
      const reporte = await materialHistorialService.generarReporteAnual(añoSeleccionado);
      setReporteTexto(reporte);
      onReporteOpen();
    } catch (error) {
      toast({
        title: 'Error al generar reporte',
        description: 'No se pudo generar el reporte anual',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }, [añoSeleccionado, toast, onReporteOpen]);

  // Descargar reporte
  const descargarReporte = useCallback(() => {
    const blob = new Blob([reporteTexto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-material-${añoSeleccionado}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [reporteTexto, añoSeleccionado]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    const estadisticas = estadisticasManager.data;
    if (!estadisticas) return null;

    return {
      line: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [
          {
            label: 'Eventos por Mes',
            data: estadisticas.eventosPorMes || [],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
          },
          {
            label: 'Incidencias',
            data: estadisticas.incidenciasPorMes || [],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1,
          },
        ],
      },
      pie: {
        labels: Object.keys(estadisticas.estadisticasPorTipo || {}),
        datasets: [
          {
            label: 'Eventos por Tipo',
            data: Object.values(estadisticas.estadisticasPorTipo || {}).map((t: any) => t.total),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
            ],
          },
        ],
      }
    };
  }, [estadisticasManager.data]);

  // Función para obtener el color de la tendencia
  const getTendenciaColor = (tendencia: string) => {
    switch (tendencia) {
      case 'mejora': return 'green';
      case 'empeora': return 'red';
      default: return 'gray';
    }
  };

  // Función para obtener el ícono de la tendencia
  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'mejora': return <FiTrendingUp />;
      case 'empeora': return <FiTrendingDown />;
      default: return <FiMinus />;
    }
  };

  // Componente de loading para pestañas específicas
  const TabLoadingSpinner = ({ loading, children }: { loading: boolean; children: React.ReactNode }) => {
    if (loading) {
      return (
        <Center p={8}>
          <VStack spacing={4}>
            <Spinner size="lg" color="blue.500" />
            <Text color="gray.600">Cargando datos...</Text>
          </VStack>
        </Center>
      );
    }
    return <>{children}</>;
  };

  // Exposición global para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    (window as any).materialHistorialService = materialHistorialService;
    (window as any).MaterialHistorialService = materialHistorialService;
    console.log('🔧 MaterialHistorialService expuesto globalmente para debugging');
  }

  // Mostrar spinner si las estadísticas principales están cargando
  if (estadisticasManager.loading) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Heading size="lg">Cargando datos de materiales...</Heading>
          <Text color="gray.600">
            {estadisticasManager.fromCache ? 'Verificando actualizaciones...' : 'Obteniendo datos del servidor...'}
          </Text>
          <Progress size="sm" isIndeterminate width="300px" />
        </VStack>
      </Center>
    );
  }

  const estadisticas = estadisticasManager.data;

  return (
    <Box bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch" p={6}>
        {/* Header mejorado con indicadores de cache */}
        <Card bg={cardBg}>
          <CardBody>
            <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
              <VStack align="start" spacing={2}>
                <Heading size="xl" color="blue.600">
                  📊 Seguimiento de Material por Años
                </Heading>
                <Text fontSize="md" color="gray.600">
                  Sistema de monitoreo y análisis del historial de materiales por períodos anuales
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue" variant="subtle">
                    <FiCalendar style={{ marginRight: '4px' }} />
                    Año {añoSeleccionado}
                  </Badge>
                  {estadisticas && (
                    <Badge colorScheme="green" variant="subtle">
                      <FiActivity style={{ marginRight: '4px' }} />
                      {estadisticas.materialesActivos} materiales activos
                    </Badge>
                  )}                  {estadisticasManager.fromCache && (
                    <Badge colorScheme="purple" variant="subtle">
                      <FiDatabase style={{ marginRight: '4px' }} />
                      Datos en caché
                    </Badge>
                  )}
                  {networkInfo && networkOptimization.isSlowConnection() && (
                    <Badge colorScheme="orange" variant="subtle">
                      🌐 Modo Optimizado ({networkInfo.effectiveType.toUpperCase()})
                    </Badge>
                  )}
                  {networkInfo && !networkOptimization.isSlowConnection() && (
                    <Badge colorScheme="green" variant="subtle">
                      🌐 Red Rápida ({networkInfo.effectiveType.toUpperCase()})
                    </Badge>
                  )}
                </HStack>
              </VStack>
              
              <HStack spacing={4} wrap="wrap">
                <Select
                  value={añoSeleccionado}
                  onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                  width="200px"
                  bg={cardBg}
                >
                  {añosDisponibles.map(año => (
                    <option key={año} value={año}>{año}</option>
                  ))}
                </Select>
                
                <ChakraTooltip label="Actualizar datos">
                  <IconButton
                    aria-label="Actualizar"
                    icon={<FiRefreshCw />}
                    onClick={() => estadisticasManager.forceReload()}
                    isLoading={estadisticasManager.loading}
                    colorScheme="blue"
                    variant="outline"
                  />
                </ChakraTooltip>
                
                <Button
                  leftIcon={<FiFileText />}
                  colorScheme="blue"
                  onClick={generarReporte}
                  isDisabled={!estadisticas}
                >
                  Generar Reporte
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Estadísticas principales con información de caché */}
        {estadisticas && (
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Materiales</StatLabel>
                  <StatNumber color="blue.500">{estadisticas.totalMateriales}</StatNumber>
                  <StatHelpText>
                    {estadisticas.materialesActivos} activos, {estadisticas.materialesPerdidos} perdidos
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Inversión Total</StatLabel>
                  <StatNumber color="green.500">€{estadisticas.inversionTotal?.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    Costo pérdidas: €{estadisticas.costoPerdidas?.toLocaleString()}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Eventos Registrados</StatLabel>
                  <StatNumber color="purple.500">{estadisticas.eventosPorMes.reduce((total, eventos) => total + eventos, 0)}</StatNumber>
                  <StatHelpText>
                    Este año
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Costo Mantenimiento</StatLabel>
                  <StatNumber color="orange.500">€{estadisticas.costoMantenimiento?.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    Año {añoSeleccionado}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>
        )}

        {/* Pestañas con lazy loading */}
        <Tabs variant="enclosed" bg={cardBg} borderRadius="lg" shadow="sm" index={activeTab} onChange={handleTabChange}>
          <TabList>
            <Tab>📊 Resumen</Tab>
            <Tab>📈 Gráficos</Tab>
            <Tab>📋 Eventos Recientes</Tab>
            <Tab>⚠️ Materiales Problemáticos</Tab>
            <Tab>🔄 Comparación Anual</Tab>
            <Tab>📄 Reportes</Tab>
          </TabList>

          <TabPanels>
            {/* Resumen */}
            <TabPanel>
              {estadisticas ? (
                <VStack spacing={6} align="stretch">
                  <Alert status="info" bg={cardBg} borderLeft="4px solid" borderLeftColor="blue.400">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Resumen del año {añoSeleccionado}</AlertTitle>
                      <AlertDescription>
                        Se registraron {estadisticas.eventosPorMes.reduce((total, eventos) => total + eventos, 0)} eventos en total, 
                        con una inversión de €{estadisticas.inversionTotal?.toLocaleString()} y 
                        {estadisticas.materialesActivos} materiales activos.
                      </AlertDescription>
                    </Box>
                  </Alert>

                  {/* Métricas adicionales */}
                  <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                    <Card bg={cardBg}>
                      <CardHeader>
                        <Heading size="sm">Materiales Nuevos</Heading>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                          {estadisticas.materialesNuevos || 0}
                        </Text>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg}>
                      <CardHeader>
                        <Heading size="sm">Dados de Baja</Heading>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text fontSize="2xl" fontWeight="bold" color="red.500">
                          {estadisticas.materialesDadosBaja || 0}
                        </Text>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg}>
                      <CardHeader>
                        <Heading size="sm">Materiales Dañados</Heading>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                          {estadisticas.materialesDadosBaja || 0}
                        </Text>
                      </CardBody>
                    </Card>
                  </Grid>
                </VStack>
              ) : (
                <Alert status="warning">
                  <AlertIcon />
                  <AlertDescription>
                    No hay datos disponibles para el año {añoSeleccionado}
                  </AlertDescription>
                </Alert>
              )}
            </TabPanel>

            {/* Gráficos */}
            <TabPanel>
              {chartData ? (
                <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="md">Eventos por Mes</Heading>
                    </CardHeader>
                    <CardBody>
                      <Line 
                        data={chartData.line} 
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            }
                          }
                        }} 
                      />
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="md">Distribución por Tipo</Heading>
                    </CardHeader>
                    <CardBody>
                      <Pie 
                        data={chartData.pie}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            }
                          }
                        }}
                      />
                    </CardBody>
                  </Card>
                </Grid>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    No hay datos suficientes para generar gráficos
                  </AlertDescription>
                </Alert>
              )}
            </TabPanel>

            {/* Eventos Recientes */}
            <TabPanel>
              <TabLoadingSpinner loading={eventosManager.loading}>
                {eventosManager.data && eventosManager.data.length > 0 ? (
                  <Card bg={cardBg}>
                    <CardHeader>
                      <HStack justify="space-between">
                        <Heading size="md">Eventos Recientes del {añoSeleccionado}</Heading>
                        <Badge colorScheme={eventosManager.fromCache ? 'purple' : 'green'}>
                          {eventosManager.fromCache ? 'Datos en caché' : 'Datos actualizados'}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Fecha</Th>
                            <Th>Material</Th>
                            <Th>Tipo de Evento</Th>
                            <Th>Costo</Th>
                            <Th>Estado</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {eventosManager.data.map((evento: EventoMaterial, index: number) => (
                            <Tr key={index}>
                              <Td>
                                {format(
                                  evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate(),
                                  'dd/MM/yyyy',
                                  { locale: es }
                                )}
                              </Td>
                              <Td>{evento.nombreMaterial}</Td>
                              <Td>
                                <Badge colorScheme="blue" variant="subtle">
                                  {evento.tipoEvento}
                                </Badge>
                              </Td>
                              <Td>€{(evento.costoAsociado || 0).toLocaleString()}</Td>
                              <Td>
                                <Badge 
                                  colorScheme={evento.estadoNuevo === 'disponible' ? 'green' : 'red'}
                                  variant="subtle"
                                >
                                  {evento.estadoNuevo}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    <AlertDescription>
                      No hay eventos registrados para el año {añoSeleccionado}
                    </AlertDescription>
                  </Alert>
                )}
              </TabLoadingSpinner>
            </TabPanel>

            {/* Materiales Problemáticos */}
            <TabPanel>
              <TabLoadingSpinner loading={materialesProblematicosManager.loading}>
                {materialesProblematicosManager.data && materialesProblematicosManager.data.length > 0 ? (
                  <Card bg={cardBg}>
                    <CardHeader>
                      <HStack justify="space-between">
                        <Heading size="md">Materiales que Requieren Atención</Heading>
                        <Badge colorScheme={materialesProblematicosManager.fromCache ? 'purple' : 'green'}>
                          {materialesProblematicosManager.fromCache ? 'Datos en caché' : 'Datos actualizados'}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Material</Th>
                            <Th>Incidencias</Th>
                            <Th>Costo Total</Th>
                            <Th>Gravedad</Th>
                            <Th>Última Incidencia</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {materialesProblematicosManager.data.map((material: any, index: number) => (
                            <Tr key={index}>
                              <Td>{material.nombreMaterial}</Td>
                              <Td>
                                <Badge colorScheme="red" variant="solid">
                                  {material.totalIncidencias}
                                </Badge>
                              </Td>
                              <Td>€{material.costoTotal?.toLocaleString()}</Td>
                              <Td>
                                <Badge 
                                  colorScheme={
                                    material.gravedad === 'alta' ? 'red' : 
                                    material.gravedad === 'media' ? 'orange' : 'yellow'
                                  }
                                  variant="subtle"
                                >
                                  {material.gravedad}
                                </Badge>
                              </Td>
                              <Td>
                                {material.ultimaIncidencia && format(
                                  material.ultimaIncidencia instanceof Date ? 
                                    material.ultimaIncidencia : 
                                    material.ultimaIncidencia.toDate(),
                                  'dd/MM/yyyy',
                                  { locale: es }
                                )}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                ) : (
                  <Alert status="success">
                    <AlertIcon />
                    <AlertDescription>
                      ¡Excelente! No se han identificado materiales problemáticos en {añoSeleccionado}
                    </AlertDescription>
                  </Alert>
                )}
              </TabLoadingSpinner>
            </TabPanel>

            {/* Comparación Anual */}
            <TabPanel>
              {añoSeleccionado <= 2020 ? (
                <Alert status="warning">
                  <AlertIcon />
                  <AlertDescription>
                    La comparación anual no está disponible para años anteriores a 2021
                  </AlertDescription>
                </Alert>
              ) : (
                <TabLoadingSpinner loading={comparacionManager.loading}>
                  {comparacionManager.data ? (
                    <VStack spacing={6} align="stretch">
                      <Card bg={cardBg}>
                        <CardHeader>
                          <HStack justify="space-between">
                            <Heading size="md">Comparación {añoSeleccionado - 1} vs {añoSeleccionado}</Heading>
                            <Badge colorScheme={comparacionManager.fromCache ? 'purple' : 'green'}>
                              {comparacionManager.fromCache ? 'Datos en caché' : 'Datos actualizados'}
                            </Badge>
                          </HStack>
                        </CardHeader>
                        <CardBody>
                          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                            <Stat>
                              <StatLabel>Mejora en Materiales</StatLabel>
                              <StatNumber color={getTendenciaColor(comparacionManager.data.comparacion?.tendencia)}>
                                {getTendenciaIcon(comparacionManager.data.comparacion?.tendencia)}
                                {comparacionManager.data.comparacion?.mejoraMateriales?.toFixed(1)}%
                              </StatNumber>
                              <StatHelpText>
                                Respecto al año anterior
                              </StatHelpText>
                            </Stat>

                            <Stat>
                              <StatLabel>Cambio en Incidencias</StatLabel>
                              <StatNumber color={comparacionManager.data.comparacion?.mejoraIncidencias > 0 ? 'green' : 'red'}>
                                {comparacionManager.data.comparacion?.mejoraIncidencias > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                                {comparacionManager.data.comparacion?.mejoraIncidencias?.toFixed(1)}%
                              </StatNumber>
                              <StatHelpText>
                                Reducción de incidencias
                              </StatHelpText>
                            </Stat>

                            <Stat>
                              <StatLabel>Optimización Costos</StatLabel>
                              <StatNumber color={comparacionManager.data.comparacion?.mejoraCostos > 0 ? 'green' : 'red'}>
                                {comparacionManager.data.comparacion?.mejoraCostos > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                                {comparacionManager.data.comparacion?.mejoraCostos?.toFixed(1)}%
                              </StatNumber>
                              <StatHelpText>
                                Ahorro en costos
                              </StatHelpText>
                            </Stat>
                          </Grid>
                        </CardBody>
                      </Card>
                    </VStack>
                  ) : (
                    <Alert status="info">
                      <AlertIcon />
                      <AlertDescription>
                        No hay datos suficientes para realizar la comparación anual
                      </AlertDescription>
                    </Alert>
                  )}
                </TabLoadingSpinner>
              )}
            </TabPanel>

            {/* Reportes */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">📄 Generación de Reportes</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="start">
                      <Text>
                        Genera reportes detallados del seguimiento de materiales para auditorías,
                        análisis de tendencias y toma de decisiones.
                      </Text>
                      
                      <HStack spacing={4}>
                        <Button
                          leftIcon={<FiFileText />}
                          colorScheme="blue"
                          onClick={generarReporte}
                          isDisabled={!estadisticas}
                        >
                          Generar Reporte Anual {añoSeleccionado}
                        </Button>
                        
                        {reporteTexto && (
                          <Button
                            leftIcon={<FiDownload />}
                            colorScheme="green"
                            onClick={descargarReporte}
                          >
                            Descargar
                          </Button>
                        )}
                      </HStack>

                      <Text fontSize="sm" color="gray.600">
                        El reporte incluye estadísticas detalladas, materiales problemáticos,
                        tendencias anuales y recomendaciones para optimización.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modal para mostrar reporte */}
        <Modal isOpen={isReporteOpen} onClose={onReporteClose} size="4xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Reporte Anual de Material {añoSeleccionado}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box 
                bg="gray.50" 
                p={4} 
                borderRadius="md" 
                maxH="70vh" 
                overflowY="auto"
                fontFamily="monospace"
                fontSize="sm"
                whiteSpace="pre-wrap"
              >
                {reporteTexto}
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={descargarReporte}>
                <FiDownload style={{ marginRight: '8px' }} />
                Descargar
              </Button>
              <Button variant="ghost" onClick={onReporteClose}>
                Cerrar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default MaterialSeguimientoDashboard;
