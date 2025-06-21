/**
 * ComparacionAñosTab - Componente para comparar estadísticas entre años
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Select,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  Progress,
  Badge,
  Divider
} from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiBarChart } from 'react-icons/fi';
import { EstadisticasAnualesUsuarios } from '../../../types/usuarioHistorial';

interface ComparacionAñosTabProps {
  añoActual: number;
  estadisticasActuales: EstadisticasAnualesUsuarios | null;
  onAñoComparacionChange: (año: number) => void;
  estadisticasComparacion: EstadisticasAnualesUsuarios | null;
  cargando: boolean;
}

const ComparacionAñosTab: React.FC<ComparacionAñosTabProps> = ({
  añoActual,
  estadisticasActuales,
  onAñoComparacionChange,
  estadisticasComparacion,
  cargando
}) => {
  const [añoComparacion, setAñoComparacion] = useState(añoActual - 1);

  useEffect(() => {
    onAñoComparacionChange(añoComparacion);
  }, [añoComparacion, onAñoComparacionChange]);

  const calcularVariacion = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  };

  const getIconoTendencia = (variacion: number) => {
    if (variacion > 0) return <FiTrendingUp />;
    if (variacion < 0) return <FiTrendingDown />;
    return <FiMinus />;
  };

  const getColorTendencia = (variacion: number) => {
    if (variacion > 0) return 'green';
    if (variacion < 0) return 'red';
    return 'gray';
  };

  const renderComparacion = (
    titulo: string,
    valorActual: number,
    valorAnterior: number,
    descripcion?: string
  ) => {
    const variacion = calcularVariacion(valorActual, valorAnterior);
    const color = getColorTendencia(variacion);
    
    return (
      <Stat>
        <StatLabel>{titulo}</StatLabel>
        <StatNumber>{valorActual.toLocaleString()}</StatNumber>
        <StatHelpText>
          <StatArrow type={variacion >= 0 ? 'increase' : 'decrease'} />
          {Math.abs(variacion).toFixed(1)}% vs {añoComparacion}
          {descripcion && (
            <Text fontSize="xs" color="gray.500" mt={1}>
              {descripcion}
            </Text>
          )}
        </StatHelpText>
      </Stat>
    );
  };

  // Años disponibles para comparación
  const añosDisponibles = Array.from({ length: 5 }, (_, i) => añoActual - 1 - i);

  if (cargando) {
    return (
      <Box textAlign="center" py={8}>
        <Text>Cargando datos de comparación...</Text>
        <Progress size="sm" isIndeterminate mt={4} />
      </Box>
    );
  }

  if (!estadisticasActuales) {
    return (
      <Alert status="warning">
        <AlertIcon />
        No hay estadísticas disponibles para el año actual
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          Comparación de Años
        </Text>
        <HStack>
          <Text>Comparar {añoActual} con:</Text>
          <Select
            value={añoComparacion}
            onChange={(e) => setAñoComparacion(parseInt(e.target.value))}
            width="auto"
          >
            {añosDisponibles.map(año => (
              <option key={año} value={año}>{año}</option>
            ))}
          </Select>
        </HStack>
      </Box>

      {estadisticasComparacion ? (
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
          <GridItem>
            <Card>
              <CardHeader>
                <HStack>
                  <FiBarChart />
                  <Text fontWeight="bold">Usuarios Totales</Text>
                </HStack>
              </CardHeader>
              <CardBody>                {renderComparacion(
                  "Total de Usuarios",
                  estadisticasActuales.usuariosRegistrados,
                  estadisticasComparacion.usuariosRegistrados,
                  "Usuarios registrados en el sistema"
                )}
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardHeader>
                <Text fontWeight="bold">Estados de Aprobación</Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>                  {renderComparacion(
                    "Aprobados",
                    estadisticasActuales.usuariosAprobados,
                    estadisticasComparacion.usuariosAprobados
                  )}
                  <Divider />
                  {renderComparacion(
                    "Rechazados",
                    estadisticasActuales.usuariosRechazados,
                    estadisticasComparacion.usuariosRechazados
                  )}
                  <Divider />
                  {renderComparacion(
                    "Suspendidos",
                    estadisticasActuales.usuariosSuspendidos,
                    estadisticasComparacion.usuariosSuspendidos
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardHeader>
                <Text fontWeight="bold">Estados de Actividad</Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>                  {renderComparacion(
                    "Activos",
                    estadisticasActuales.usuariosActivos,
                    estadisticasComparacion.usuariosActivos
                  )}
                  <Divider />
                  {renderComparacion(
                    "Inactivos",
                    estadisticasActuales.usuariosInactivos,
                    estadisticasComparacion.usuariosInactivos
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardHeader>
                <Text fontWeight="bold">Métricas de Rendimiento</Text>
              </CardHeader>
              <CardBody>                <VStack spacing={4}>
                  {renderComparacion(
                    "Tasa de Aprobación",
                    estadisticasActuales.tasaAprobacion,
                    estadisticasComparacion.tasaAprobacion,
                    "Porcentaje de usuarios aprobados"
                  )}
                  <Divider />
                  {renderComparacion(
                    "Tasa de Actividad",
                    estadisticasActuales.tasaActividad,
                    estadisticasComparacion.tasaActividad,
                    "Porcentaje de usuarios activos"
                  )}
                  <Divider />
                  {renderComparacion(
                    "Participación Promedio",
                    estadisticasActuales.participacionPromedio,
                    estadisticasComparacion.participacionPromedio,                    "Actividades por usuario activo"
                  )}
                  {estadisticasActuales.tasaAprobacion !== undefined && (
                    <>
                      <Divider />
                      {renderComparacion(
                        "Tasa de Aprobación (%)",
                        Math.round(estadisticasActuales.tasaAprobacion * 100),
                        Math.round((estadisticasComparacion.tasaAprobacion || 0) * 100)
                      )}
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      ) : (
        <Alert status="info">
          <AlertIcon />
          No hay datos disponibles para el año {añoComparacion}
        </Alert>
      )}
    </VStack>
  );
};

export default ComparacionAñosTab;
