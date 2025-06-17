/**
 * Dashboard de Seguimiento de Material por Años
 * Proporciona una vista completa del historial, estadísticas y reportes anuales
 */
import React, { useState, useEffect, useMemo } from 'react';
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
  Badge,  Alert,
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
  Spacer
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
  FiDollarSign
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

// Gráficos interactivos con Chart.js
// TEMPORAL: Comentado hasta resolver problemas de módulos
/*
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);
*/

interface MaterialSeguimientoDashboardProps {
  añoInicial?: number;
}

const MaterialSeguimientoDashboard: React.FC<MaterialSeguimientoDashboardProps> = ({
  añoInicial
}) => {
  const toast = useToast();
  const { isOpen: isReporteOpen, onOpen: onReporteOpen, onClose: onReporteClose } = useDisclosure();
  
  // Estados
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoInicial || new Date().getFullYear());
  const [estadisticas, setEstadisticas] = useState<EstadisticasAnuales | null>(null);
  const [eventosRecientes, setEventosRecientes] = useState<EventoMaterial[]>([]);
  const [materialesProblematicos, setMaterialesProblematicos] = useState<any[]>([]);
  const [comparacionAños, setComparacionAños] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [reporteTexto, setReporteTexto] = useState('');

  // Años disponibles para selección
  const añosDisponibles = useMemo(() => {
    const añoActual = new Date().getFullYear();
    const años = [];
    for (let i = 0; i < 5; i++) {
      años.push(añoActual - i);
    }
    return años;
  }, []);

  // Cargar datos
  const cargarDatos = async (año: number) => {
    setCargando(true);
    try {
      const [
        estadisticasData,
        eventosData,
        materialesData,
        comparacionData
      ] = await Promise.all([
        materialHistorialService.obtenerEstadisticasAnuales(año),
        materialHistorialService.obtenerHistorial({ años: [año] }),
        materialHistorialService.obtenerMaterialesProblematicos(año, 10),
        año > 2020 ? materialHistorialService.compararAños(año - 1, año) : null
      ]);

      setEstadisticas(estadisticasData);
      setEventosRecientes(eventosData.slice(0, 20)); // Últimos 20 eventos
      setMaterialesProblematicos(materialesData);
      setComparacionAños(comparacionData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: 'Error al cargar datos',
        description: 'No se pudieron cargar las estadísticas del año seleccionado',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setCargando(false);
    }
  };

  // Generar reporte
  const generarReporte = async () => {
    try {
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
  };

  // Descargar reporte
  const descargarReporte = () => {
    const blob = new Blob([reporteTexto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-material-${añoSeleccionado}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Efectos
  useEffect(() => {
    cargarDatos(añoSeleccionado);
  }, [añoSeleccionado]);

  // Configuración de gráficos
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Seguimiento de Material por Meses'
      },
    },
  };

  const eventosChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Total Eventos',
        data: estadisticas?.eventosPorMes || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Incidencias',
        data: estadisticas?.incidenciasPorMes || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const tiposChartData = {
    labels: Object.keys(estadisticas?.estadisticasPorTipo || {}),
    datasets: [
      {
        data: Object.values(estadisticas?.estadisticasPorTipo || {}).map((t: any) => t.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      },
    ],
  };

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

  if (cargando) {
    return (
      <Box p={6}>
        <VStack spacing={4}>
          <Heading size="lg">Cargando datos...</Heading>
          <Progress size="sm" isIndeterminate width="100%" />
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <Heading size="xl">📊 Seguimiento de Material por Años</Heading>
          <HStack spacing={4}>
            <Select
              value={añoSeleccionado}
              onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
              width="200px"
            >
              {añosDisponibles.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </Select>            <ChakraTooltip label="Actualizar datos">
              <IconButton
                aria-label="Actualizar"
                icon={<FiRefreshCw />}
                onClick={() => cargarDatos(añoSeleccionado)}
                isLoading={cargando}
              />
            </ChakraTooltip>
            <Button
              leftIcon={<FiFileText />}
              colorScheme="blue"
              onClick={generarReporte}
            >
              Generar Reporte
            </Button>
          </HStack>
        </Flex>

        {/* Estadísticas principales */}
        {estadisticas && (
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Materiales</StatLabel>
                  <StatNumber>{estadisticas.totalMateriales}</StatNumber>
                  <StatHelpText>
                    {estadisticas.materialesActivos} activos
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Inversión Total</StatLabel>
                  <StatNumber>€{estadisticas.inversionTotal.toFixed(2)}</StatNumber>
                  <StatHelpText>
                    <FiDollarSign style={{ display: 'inline' }} /> Este año
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Costo Pérdidas</StatLabel>
                  <StatNumber color="red.500">€{estadisticas.costoPerdidas.toFixed(2)}</StatNumber>
                  <StatHelpText>
                    {estadisticas.materialesPerdidos} materiales perdidos
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            {comparacionAños && (
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Tendencia Incidencias</StatLabel>
                    <StatNumber>
                      <HStack>
                        <Box color={getTendenciaColor(comparacionAños.comparacion.tendencia)}>
                          {getTendenciaIcon(comparacionAños.comparacion.tendencia)}
                        </Box>
                        <Text fontSize="lg">{comparacionAños.comparacion.tendencia}</Text>
                      </HStack>
                    </StatNumber>
                    <StatHelpText>
                      vs. año anterior
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            )}
          </Grid>
        )}

        {/* Alertas de materiales problemáticos */}
        {materialesProblematicos.length > 0 && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Materiales que requieren atención</AlertTitle>
              <AlertDescription>
                {materialesProblematicos.length} materiales tienen múltiples incidencias este año
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Pestañas principales */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>📈 Gráficos</Tab>
            <Tab>📋 Eventos Recientes</Tab>
            <Tab>⚠️ Materiales Problemáticos</Tab>
            <Tab>📊 Comparación Anual</Tab>
          </TabList>

          <TabPanels>            {/* Panel de Gráficos */}
            <TabPanel>
              <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
                <Card>
                  <CardHeader>
                    <Heading size="md">Eventos por Mes</Heading>
                  </CardHeader>                  <CardBody>
                    {/* <Line options={chartOptions} data={eventosChartData} /> */}
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Gráfico de Eventos por Mes</AlertTitle>
                        <AlertDescription>
                          Los gráficos interactivos estarán disponibles próximamente.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">Distribución por Tipo</Heading>
                  </CardHeader>                  <CardBody>
                    {/* <Pie data={tiposChartData} /> */}
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Gráfico de Distribución por Tipo</AlertTitle>
                        <AlertDescription>
                          Los gráficos interactivos estarán disponibles próximamente.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Panel de Eventos Recientes */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Últimos Eventos Registrados</Heading>
                </CardHeader>
                <CardBody>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Fecha</Th>
                        <Th>Material</Th>
                        <Th>Tipo Evento</Th>
                        <Th>Descripción</Th>
                        <Th>Costo</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {eventosRecientes.map((evento) => (
                        <Tr key={evento.id}>
                          <Td>
                            {format(
                              evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate(),
                              'dd/MM/yyyy',
                              { locale: es }
                            )}
                          </Td>
                          <Td>{evento.nombreMaterial}</Td>
                          <Td>
                            <Badge colorScheme={evento.tipoEvento.includes('incidencia') ? 'red' : 'blue'}>
                              {evento.tipoEvento}
                            </Badge>
                          </Td>
                          <Td>{evento.descripcion}</Td>
                          <Td>
                            {evento.costoAsociado ? `€${evento.costoAsociado.toFixed(2)}` : '-'}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Panel de Materiales Problemáticos */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Materiales con Mayor Número de Incidencias</Heading>
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
                      {materialesProblematicos.map((material) => (
                        <Tr key={material.materialId}>
                          <Td>{material.nombreMaterial}</Td>
                          <Td>
                            <Badge colorScheme="red" fontSize="sm">
                              {material.totalIncidencias}
                            </Badge>
                          </Td>
                          <Td>€{material.costoTotal.toFixed(2)}</Td>
                          <Td>
                            <Badge 
                              colorScheme={
                                material.gravedad === 'critica' ? 'red' :
                                material.gravedad === 'alta' ? 'orange' :
                                material.gravedad === 'media' ? 'yellow' : 'green'
                              }
                            >
                              {material.gravedad}
                            </Badge>
                          </Td>
                          <Td>
                            {format(material.ultimaIncidencia, 'dd/MM/yyyy', { locale: es })}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Panel de Comparación Anual */}
            <TabPanel>
              {comparacionAños ? (
                <VStack spacing={6}>
                  <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6} width="100%">
                    <Card>
                      <CardHeader>
                        <Heading size="md">Mejora en Materiales</Heading>
                      </CardHeader>
                      <CardBody>
                        <Stat>
                          <StatNumber>
                            {comparacionAños.comparacion.mejoraMateriales > 0 ? '+' : ''}
                            {comparacionAños.comparacion.mejoraMateriales.toFixed(1)}%
                          </StatNumber>
                          <StatHelpText>vs año anterior</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <Heading size="md">Reducción Incidencias</Heading>
                      </CardHeader>
                      <CardBody>
                        <Stat>
                          <StatNumber color={comparacionAños.comparacion.mejoraIncidencias > 0 ? 'green.500' : 'red.500'}>
                            {comparacionAños.comparacion.mejoraIncidencias > 0 ? '+' : ''}
                            {comparacionAños.comparacion.mejoraIncidencias.toFixed(1)}%
                          </StatNumber>
                          <StatHelpText>menos incidencias</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <Heading size="md">Ahorro en Costos</Heading>
                      </CardHeader>
                      <CardBody>
                        <Stat>
                          <StatNumber color={comparacionAños.comparacion.mejoraCostos > 0 ? 'green.500' : 'red.500'}>
                            {comparacionAños.comparacion.mejoraCostos > 0 ? '+' : ''}
                            {comparacionAños.comparacion.mejoraCostos.toFixed(1)}%
                          </StatNumber>
                          <StatHelpText>ahorro en pérdidas</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </Grid>

                  <Alert 
                    status={comparacionAños.comparacion.tendencia === 'mejora' ? 'success' : 
                            comparacionAños.comparacion.tendencia === 'empeora' ? 'error' : 'info'}
                  >
                    <AlertIcon />
                    <AlertTitle>Tendencia General: {comparacionAños.comparacion.tendencia}</AlertTitle>
                    <AlertDescription>
                      {comparacionAños.comparacion.tendencia === 'mejora' && 
                        'Los indicadores muestran una mejora general en la gestión del material.'}
                      {comparacionAños.comparacion.tendencia === 'empeora' && 
                        'Los indicadores sugieren la necesidad de revisar los procesos de gestión.'}
                      {comparacionAños.comparacion.tendencia === 'estable' && 
                        'Los indicadores se mantienen estables respecto al año anterior.'}
                    </AlertDescription>
                  </Alert>
                </VStack>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  <AlertTitle>Sin datos de comparación</AlertTitle>
                  <AlertDescription>
                    No hay datos del año anterior para realizar la comparación.
                  </AlertDescription>
                </Alert>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modal de Reporte */}
        <Modal isOpen={isReporteOpen} onClose={onReporteClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Reporte Anual {añoSeleccionado}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box 
                as="pre" 
                whiteSpace="pre-wrap" 
                fontFamily="monospace" 
                fontSize="sm"
                p={4}
                bg="gray.50"
                borderRadius="md"
                maxH="500px"
                overflowY="auto"
              >
                {reporteTexto}
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button leftIcon={<FiDownload />} onClick={descargarReporte} mr={3}>
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
