import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Text,
  Badge,
  HStack,
  VStack,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import {
  FiPackage,
  FiCheck,
  FiClock,
  FiTool,
  FiAlertTriangle,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import { EstadisticasMateriales } from './types';

interface EstadisticasPrincipalesMaterialesProps {
  estadisticas: EstadisticasMateriales | null;
  cargando: boolean;
  onCargarDatos: () => void;
  añoSeleccionado: number;
  vistaExtendida?: boolean;
}

const EstadisticasPrincipalesMateriales: React.FC<EstadisticasPrincipalesMaterialesProps> = ({
  estadisticas,
  cargando,
  onCargarDatos,
  añoSeleccionado,
  vistaExtendida = false
}) => {
  if (!estadisticas && !cargando) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <Text>No hay datos disponibles</Text>
            <IconButton
              aria-label="Cargar datos"
              icon={<FiRefreshCw />}
              onClick={onCargarDatos}
              colorScheme="blue"
            />
          </VStack>
        </CardBody>
      </Card>
    );
  }

  const calcularTendencia = (actual: number, total: number) => {
    const porcentaje = total > 0 ? (actual / total) * 100 : 0;
    return porcentaje;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Estadísticas principales */}
      <Grid
        templateColumns={{ 
          base: "1fr", 
          md: "repeat(2, 1fr)", 
          lg: "repeat(4, 1fr)" 
        }}
        gap={6}
      >
        {/* Total de Materiales */}
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Total de Materiales</StatLabel>
                    <StatNumber>{estadisticas?.totalMateriales || 0}</StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <FiPackage />
                        <Text>Inventario total</Text>
                      </HStack>
                    </StatHelpText>
                  </Box>
                  <Box fontSize="2xl" color="blue.500">
                    <FiPackage />
                  </Box>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        {/* Materiales Disponibles */}
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Disponibles</StatLabel>
                    <StatNumber color="green.500">
                      {estadisticas?.materialesDisponibles || 0}
                    </StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <FiCheck />
                        <Text>
                          {estadisticas?.porcentajeDisponibilidad.toFixed(1) || 0}% del total
                        </Text>
                      </HStack>
                    </StatHelpText>
                  </Box>
                  <Box fontSize="2xl" color="green.500">
                    <FiCheck />
                  </Box>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        {/* Materiales Prestados */}
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Prestados</StatLabel>
                    <StatNumber color="blue.500">
                      {estadisticas?.materialesPrestados || 0}
                    </StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <FiClock />
                        <Text>
                          {estadisticas?.porcentajeUso.toFixed(1) || 0}% en uso
                        </Text>
                      </HStack>
                    </StatHelpText>
                  </Box>
                  <Box fontSize="2xl" color="blue.500">
                    <FiClock />
                  </Box>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        {/* Materiales en Mantenimiento */}
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Mantenimiento</StatLabel>
                    <StatNumber color="orange.500">
                      {estadisticas?.materialesMantenimiento || 0}
                    </StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <FiTool />
                        <Text>Requieren atención</Text>
                      </HStack>
                    </StatHelpText>
                  </Box>
                  <Box fontSize="2xl" color="orange.500">
                    <FiTool />
                  </Box>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Vista extendida */}
      {vistaExtendida && (
        <>
          {/* Distribución por estados */}
          <Card>
            <CardBody>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                📊 Distribución por Estados
              </Text>
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                <Box>
                  <Text fontSize="sm" mb={2}>Disponibles</Text>
                  <Progress 
                    value={calcularTendencia(estadisticas?.materialesDisponibles || 0, estadisticas?.totalMateriales || 1)}
                    colorScheme="green"
                    mb={1}
                  />
                  <Text fontSize="xs" color="gray.600">
                    {estadisticas?.materialesDisponibles || 0} materiales
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" mb={2}>Prestados</Text>
                  <Progress 
                    value={calcularTendencia(estadisticas?.materialesPrestados || 0, estadisticas?.totalMateriales || 1)}
                    colorScheme="blue"
                    mb={1}
                  />
                  <Text fontSize="xs" color="gray.600">
                    {estadisticas?.materialesPrestados || 0} materiales
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" mb={2}>Mantenimiento</Text>
                  <Progress 
                    value={calcularTendencia(estadisticas?.materialesMantenimiento || 0, estadisticas?.totalMateriales || 1)}
                    colorScheme="orange"
                    mb={1}
                  />
                  <Text fontSize="xs" color="gray.600">
                    {estadisticas?.materialesMantenimiento || 0} materiales
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" mb={2}>Revisión</Text>
                  <Progress 
                    value={calcularTendencia(estadisticas?.materialesRevision || 0, estadisticas?.totalMateriales || 1)}
                    colorScheme="yellow"
                    mb={1}
                  />
                  <Text fontSize="xs" color="gray.600">
                    {estadisticas?.materialesRevision || 0} materiales
                  </Text>
                </Box>
              </Grid>
            </CardBody>
          </Card>

          {/* Distribución por tipos */}
          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
            <Card>
              <CardBody>
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  🏷️ Distribución por Tipos
                </Text>
                <VStack spacing={4}>
                  <HStack justify="space-between" w="full">
                    <HStack>
                      <Badge colorScheme="purple">Cuerdas</Badge>
                      <Text>{estadisticas?.materialesPorTipo.cuerda || 0}</Text>
                    </HStack>
                    <Progress 
                      value={calcularTendencia(estadisticas?.materialesPorTipo.cuerda || 0, estadisticas?.totalMateriales || 1)}
                      colorScheme="purple"
                      w="200px"
                    />
                  </HStack>
                  
                  <HStack justify="space-between" w="full">
                    <HStack>
                      <Badge colorScheme="cyan">Anclajes</Badge>
                      <Text>{estadisticas?.materialesPorTipo.anclaje || 0}</Text>
                    </HStack>
                    <Progress 
                      value={calcularTendencia(estadisticas?.materialesPorTipo.anclaje || 0, estadisticas?.totalMateriales || 1)}
                      colorScheme="cyan"
                      w="200px"
                    />
                  </HStack>
                  
                  <HStack justify="space-between" w="full">
                    <HStack>
                      <Badge colorScheme="gray">Varios</Badge>
                      <Text>{estadisticas?.materialesPorTipo.varios || 0}</Text>
                    </HStack>
                    <Progress 
                      value={calcularTendencia(estadisticas?.materialesPorTipo.varios || 0, estadisticas?.totalMateriales || 1)}
                      colorScheme="gray"
                      w="200px"
                    />
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  💰 Información Financiera
                </Text>
                <VStack spacing={4} align="stretch">
                  <Stat>
                    <StatLabel>Valor Total Inventario</StatLabel>
                    <StatNumber>${estadisticas?.valorTotalInventario.toFixed(2) || 0}</StatNumber>
                  </Stat>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Antigüedad Promedio</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      {estadisticas?.promedioEdadMateriales ? 
                        Math.round(estadisticas.promedioEdadMateriales / 365 * 10) / 10 : 0} años
                    </Text>
                  </Box>
                  
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="gray.600">Nuevos</Text>
                      <Text fontWeight="bold" color="green.500">
                        {estadisticas?.materialesNuevos || 0}
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="gray.600">Antiguos</Text>
                      <Text fontWeight="bold" color="orange.500">
                        {estadisticas?.materialesAntiguos || 0}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </Grid>
        </>
      )}
    </VStack>
  );
};

export default EstadisticasPrincipalesMateriales;
