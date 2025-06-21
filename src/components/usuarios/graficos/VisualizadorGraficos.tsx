/**
 * Componente para mostrar un gráfico dinámico de usuarios
 */
import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  useColorModeValue,
  Skeleton
} from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { ResultadoAnalisis, TipoGrafico } from './tipos';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiInfo } from 'react-icons/fi';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VisualizadorGraficosProps {
  resultado: ResultadoAnalisis | null;
  cargando?: boolean;
  error?: string | null;
  altura?: string | number;
}

const VisualizadorGraficos: React.FC<VisualizadorGraficosProps> = ({
  resultado,
  cargando = false,
  error = null,
  altura = '400px'
}) => {
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const gridColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)');

  // Opciones base para todos los gráficos
  const opcionesBase = useMemo(() => ({
    responsive: resultado?.configuracion.opciones?.responsive !== false,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: resultado?.configuracion.opciones?.mostrarLeyenda !== false,
        position: 'top' as const,
      },
      title: {
        display: false, // Lo manejamos con el CardHeader
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(0, 0, 0, 0.8)',
        borderWidth: 1,
      }
    },
    animation: {
      duration: resultado?.configuracion.opciones?.animaciones !== false ? 1000 : 0,
    },
  }), [resultado?.configuracion.opciones]);

  // Opciones específicas para gráficos de barras y líneas
  const opcionesConEjes = useMemo(() => ({
    ...opcionesBase,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: gridColor
        }
      },
      x: {
        grid: {
          color: gridColor
        }
      }
    },
  }), [opcionesBase, gridColor]);

  // Opciones específicas para gráficos circulares
  const opcionesCirculares = useMemo(() => ({
    ...opcionesBase,
    plugins: {
      ...opcionesBase.plugins,
      legend: {
        ...opcionesBase.plugins.legend,
        position: 'right' as const,
      },
    },
  }), [opcionesBase]);

  const renderizarGrafico = () => {
    if (!resultado) return null;

    const { configuracion, datos } = resultado;

    const props = {
      data: datos,
      options: ['pie', 'doughnut'].includes(configuracion.tipo) ? opcionesCirculares : opcionesConEjes,
    };

    switch (configuracion.tipo) {
      case 'bar':
        return <Bar {...props} />;
      case 'line':
        return <Line {...props} />;
      case 'pie':
        return <Pie {...props} />;
      case 'doughnut':
        return <Doughnut {...props} />;
      case 'area':
        // Para área, modificamos los datos para que tengan fill: true
        const datosArea = {
          ...datos,
          datasets: datos.datasets.map(dataset => ({
            ...dataset,
            fill: true,
            backgroundColor: dataset.backgroundColor || dataset.borderColor + '30'
          }))
        };
        return <Line data={datosArea} options={opcionesConEjes} />;
      case 'histogram':
        return <Bar {...props} />;
      default:
        return <Bar {...props} />;
    }
  };

  const obtenerIconoTendencia = (tendencia?: string) => {
    if (!tendencia) return <FiMinus />;
    if (tendencia === 'creciente') return <FiTrendingUp />;
    if (tendencia === 'decreciente') return <FiTrendingDown />;
    return <FiMinus />;
  };

  const obtenerColorTendencia = (tendencia?: string) => {
    if (tendencia === 'creciente') return 'green';
    if (tendencia === 'decreciente') return 'red';
    return 'gray';
  };

  if (cargando) {
    return (
      <Card bg={bgCard} borderColor={borderColor} borderWidth="1px">
        <CardHeader>
          <Skeleton height="20px" width="200px" />
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Skeleton height={altura} width="100%" />
            <Grid templateColumns="repeat(3, 1fr)" gap={4} width="100%">
              <Skeleton height="80px" />
              <Skeleton height="80px" />
              <Skeleton height="80px" />
            </Grid>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card bg={bgCard} borderColor={borderColor} borderWidth="1px">
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Error al generar el gráfico</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!resultado) {
    return (
      <Card bg={bgCard} borderColor={borderColor} borderWidth="1px">
        <CardBody>
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>Sin datos</AlertTitle>
              <AlertDescription>
                Selecciona una configuración para visualizar el gráfico.
              </AlertDescription>
            </Box>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={bgCard} borderColor={borderColor} borderWidth="1px">
      <CardHeader>
        <VStack align="start" spacing={1}>
          <Heading size="md">{resultado.configuracion.titulo}</Heading>
          <Text fontSize="sm" color="gray.600">
            {resultado.configuracion.descripcion}
          </Text>
        </VStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Gráfico principal */}
          <Box height={altura} width="100%">
            {renderizarGrafico()}
          </Box>

          {/* Estadísticas resumidas */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
            <Card variant="outline" size="sm">
              <CardBody textAlign="center">
                <Stat size="sm">
                  <StatLabel fontSize="xs">Total</StatLabel>
                  <StatNumber fontSize="lg" color="blue.500">
                    {resultado.estadisticas.total}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>

            <Card variant="outline" size="sm">
              <CardBody textAlign="center">
                <Stat size="sm">
                  <StatLabel fontSize="xs">Promedio</StatLabel>
                  <StatNumber fontSize="lg" color="green.500">
                    {resultado.estadisticas.promedio?.toFixed(1) || '0'}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>

            <Card variant="outline" size="sm">
              <CardBody textAlign="center">
                <Stat size="sm">
                  <StatLabel fontSize="xs">Máximo</StatLabel>
                  <StatNumber fontSize="lg" color="purple.500">
                    {resultado.estadisticas.maximo}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>

            <Card variant="outline" size="sm">
              <CardBody textAlign="center">
                <Stat size="sm">
                  <StatLabel fontSize="xs">Tendencia</StatLabel>
                  <StatNumber fontSize="lg" color={obtenerColorTendencia(resultado.estadisticas.tendencia) + '.500'}>
                    <HStack justify="center" spacing={1}>
                      {obtenerIconoTendencia(resultado.estadisticas.tendencia)}
                      <Text>
                        {resultado.estadisticas.tendencia === 'creciente' ? 'Sube' :
                         resultado.estadisticas.tendencia === 'decreciente' ? 'Baja' : 'Estable'}
                      </Text>
                    </HStack>
                  </StatNumber>
                  {resultado.estadisticas.porcentajeCambio && (
                    <StatHelpText fontSize="xs">
                      {resultado.estadisticas.porcentajeCambio > 0 ? '+' : ''}
                      {resultado.estadisticas.porcentajeCambio.toFixed(1)}%
                    </StatHelpText>
                  )}
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* Insights automáticos */}
          {resultado.insights.length > 0 && (
            <Box>
              <HStack mb={3}>
                <FiInfo />
                <Text fontSize="sm" fontWeight="medium">Insights Automáticos</Text>
              </HStack>
              <VStack align="start" spacing={2}>
                {resultado.insights.map((insight, index) => (
                  <HStack key={index} align="start" spacing={2}>
                    <Badge colorScheme="blue" variant="outline" mt={0.5}>
                      {index + 1}
                    </Badge>
                    <Text fontSize="sm" color="gray.700">
                      {insight}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Información de configuración */}
          <Box bg="gray.50" p={3} borderRadius="md" fontSize="xs" color="gray.600">
            <HStack justify="space-between" wrap="wrap">
              <Text>
                Métrica: <strong>{resultado.configuracion.metrica}</strong>
              </Text>
              <Text>
                Tipo: <strong>{resultado.configuracion.tipo}</strong>
              </Text>
              {resultado.configuracion.periodo && (
                <Text>
                  Período: <strong>{resultado.configuracion.periodo}</strong>
                </Text>
              )}
              <Text>
                Datos: <strong>{resultado.datos.labels.length} elementos</strong>
              </Text>
            </HStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default VisualizadorGraficos;
