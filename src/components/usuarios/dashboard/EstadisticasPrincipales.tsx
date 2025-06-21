/**
 * Componente de Estadísticas Principales del Dashboard
 * Muestra las métricas clave de usuarios en formato de tarjetas
 */
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Grid,
  GridItem,
  Button,
  Badge,
  Progress
} from '@chakra-ui/react';
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiUserPlus,
  FiActivity,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw
} from 'react-icons/fi';
import { EstadisticasAnualesUsuarios } from '../../../types/usuarioHistorial';

interface EstadisticasPrincipalesProps {
  estadisticas: EstadisticasAnualesUsuarios | null;
  comparacionAños?: any;
  cargando: boolean;
  onGenerarDatos: () => void;
  onCargarDatos: () => void;
  añoSeleccionado: number;
  cargandoMigracion: boolean;
  vistaExtendida?: boolean;
}

const EstadisticasPrincipales: React.FC<EstadisticasPrincipalesProps> = ({
  estadisticas,
  comparacionAños,
  cargando,
  onGenerarDatos,
  onCargarDatos,
  añoSeleccionado,
  cargandoMigracion,
  vistaExtendida = false
}) => {
  // Función para obtener el color del badge según el valor
  const getColorBadge = (valor: number, esPositivo = true) => {
    if (valor === 0) return 'gray';
    if (esPositivo) {
      return valor > 0 ? 'green' : 'red';
    } else {
      return valor > 0 ? 'red' : 'green';
    }
  };

  // Función para formatear números
  const formatearNumero = (numero: number) => {
    return numero.toLocaleString('es-ES');
  };

  // Función para formatear porcentajes
  const formatearPorcentaje = (numero: number) => {
    return `${numero.toFixed(1)}%`;
  };

  // Mostrar estado de carga o error
  if (cargando && !estadisticas) {
    return (
      <Box p={6}>
        <VStack spacing={4}>
          <Text>Cargando estadísticas...</Text>
          <Progress size="xs" isIndeterminate width="100%" />
        </VStack>
      </Box>
    );
  }

  // Si no hay estadísticas, mostrar mensaje
  if (!estadisticas) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <Text color="gray.500">No hay estadísticas disponibles para el año {añoSeleccionado}</Text>
            <Button 
              colorScheme="green" 
              onClick={onGenerarDatos}
              leftIcon={<FiUserPlus />}
              isLoading={cargandoMigracion}
              loadingText="Generando..."
            >
              Generar datos iniciales
            </Button>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  // Grid de estadísticas principales
  const estadisticasGrid = (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
      {/* Total de Usuarios */}
      <GridItem>
        <Card>
          <CardHeader pb={2}>
            <HStack spacing={2}>
              <FiUsers />
              <Text fontSize="sm" color="gray.600">Total Usuarios</Text>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold">{formatearNumero(estadisticas.usuariosRegistrados)}</Text>
              <Text fontSize="xs" color="gray.500">Registrados en {añoSeleccionado}</Text>
            </VStack>
          </CardBody>
        </Card>
      </GridItem>

      {/* Usuarios Aprobados */}
      <GridItem>
        <Card>
          <CardHeader pb={2}>
            <HStack spacing={2}>
              <FiUserCheck />
              <Text fontSize="sm" color="gray.600">Aprobados</Text>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {formatearNumero(estadisticas.usuariosAprobados)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Tasa: {formatearPorcentaje(estadisticas.tasaAprobacion * 100)}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </GridItem>

      {/* Usuarios Activos */}
      <GridItem>
        <Card>
          <CardHeader pb={2}>
            <HStack spacing={2}>
              <FiActivity />
              <Text fontSize="sm" color="gray.600">Activos</Text>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {formatearNumero(estadisticas.usuariosActivos)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Actividad: {formatearPorcentaje(estadisticas.tasaActividad * 100)}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </GridItem>

      {/* Total de Eventos */}
      <GridItem>
        <Card>
          <CardHeader pb={2}>
            <HStack spacing={2}>
              <FiTrendingUp />
              <Text fontSize="sm" color="gray.600">Eventos</Text>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold">{formatearNumero(estadisticas.totalEventos)}</Text>
              <Text fontSize="xs" color="gray.500">Total de eventos</Text>
            </VStack>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );

  // Vista extendida con información adicional
  if (vistaExtendida) {
    return (
      <VStack spacing={6} align="stretch">
        {/* Grid principal */}
        {estadisticasGrid}

        {/* Información adicional solo en vista extendida */}
        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={4}>
          {/* Estadísticas Detalladas */}
          <GridItem>
            <Card>
              <CardHeader>
                <Text fontWeight="bold">Estadísticas Detalladas</Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm">Usuarios Rechazados:</Text>
                    <Badge colorScheme="red">{formatearNumero(estadisticas.usuariosRechazados)}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Usuarios Suspendidos:</Text>
                    <Badge colorScheme="orange">{formatearNumero(estadisticas.usuariosSuspendidos)}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Usuarios Inactivos:</Text>
                    <Badge colorScheme="gray">{formatearNumero(estadisticas.usuariosInactivos)}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Tasa de Retención:</Text>
                    <Badge colorScheme="blue">{formatearPorcentaje(estadisticas.tasaRetencion * 100)}</Badge>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Métricas de Rendimiento */}
          <GridItem>
            <Card>
              <CardHeader>
                <Text fontWeight="bold">Métricas de Rendimiento</Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm">Participación Promedio:</Text>
                    <Badge colorScheme="green">{estadisticas.participacionPromedio.toFixed(1)}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Tiempo Promedio Aprobación:</Text>
                    <Badge colorScheme="blue">{estadisticas.tiempoPromedioAprobacion} días</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Usuarios Problemáticos:</Text>
                    <Badge colorScheme="red">{estadisticas.usuariosProblematicos.length}</Badge>
                  </HStack>
                  {estadisticas.tendencia && (
                    <HStack justify="space-between">
                      <Text fontSize="sm">Tendencia:</Text>
                      <Badge 
                        colorScheme={
                          estadisticas.tendencia === 'creciente' ? 'green' :
                          estadisticas.tendencia === 'decreciente' ? 'red' : 'blue'
                        }
                      >
                        {estadisticas.tendencia}
                      </Badge>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Comparación con años anteriores si está disponible */}
        {comparacionAños && (
          <Card>
            <CardHeader>
              <Text fontWeight="bold">Comparación Anual</Text>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                {estadisticas.crecimientoUsuarios !== undefined && (
                  <VStack align="start">
                    <Text fontWeight="bold">Crecimiento de Usuarios</Text>
                    <Badge 
                      size="lg" 
                      colorScheme={getColorBadge(estadisticas.crecimientoUsuarios)}
                    >
                      {estadisticas.crecimientoUsuarios > 0 ? '+' : ''}{formatearPorcentaje(estadisticas.crecimientoUsuarios)}
                    </Badge>
                  </VStack>
                )}
                {estadisticas.cambioTasaActividad !== undefined && (
                  <VStack align="start">
                    <Text fontWeight="bold">Cambio en Actividad</Text>
                    <Badge 
                      size="lg" 
                      colorScheme={getColorBadge(estadisticas.cambioTasaActividad)}
                    >
                      {estadisticas.cambioTasaActividad > 0 ? '+' : ''}{formatearPorcentaje(estadisticas.cambioTasaActividad)}
                    </Badge>
                  </VStack>
                )}
                {estadisticas.tendencia && (
                  <VStack align="start">
                    <Text fontWeight="bold">Tendencia General</Text>
                    <Badge 
                      size="lg" 
                      colorScheme={
                        estadisticas.tendencia === 'creciente' ? 'green' :
                        estadisticas.tendencia === 'decreciente' ? 'red' : 'blue'
                      }
                    >
                      {estadisticas.tendencia}
                    </Badge>
                  </VStack>
                )}
              </Grid>
            </CardBody>
          </Card>
        )}

        {/* Botones de acción */}
        <Card>
          <CardHeader>
            <HStack spacing={2}>
              <FiRefreshCw />
              <Text fontWeight="bold">Acciones Rápidas</Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <HStack spacing={4}>
              <Button 
                colorScheme="blue" 
                variant="outline" 
                onClick={onCargarDatos} 
                leftIcon={<FiRefreshCw />}
                isLoading={cargando}
              >
                Actualizar datos
              </Button>
              <Button 
                colorScheme="green" 
                variant="solid" 
                onClick={onGenerarDatos}
                leftIcon={<FiUserPlus />}
                isLoading={cargandoMigracion}
                loadingText="Generando datos..."
              >
                Generar datos iniciales
              </Button>
            </HStack>
          </CardBody>
        </Card>
      </VStack>
    );
  }

  // Vista normal (compacta)
  return estadisticasGrid;
};

export default EstadisticasPrincipales;
