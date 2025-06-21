import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Grid,
  GridItem,
  Badge,
  Alert,
  AlertIcon,
  Progress,
  Textarea
} from '@chakra-ui/react';
import {
  FiFileText,
  FiDownload,
  FiBarChart,
  FiPackage,
  FiTool,
  FiAlertTriangle
} from 'react-icons/fi';
import { EstadisticasMateriales, TipoReporteMaterial } from './types';

interface ReportesMaterialesTabProps {
  año: number;
  estadisticas: EstadisticasMateriales | null;
  onGenerarReporte: (tipo: TipoReporteMaterial) => Promise<void>;
  cargando: boolean;
  reporteTexto?: string;
}

const ReportesMaterialesTab: React.FC<ReportesMaterialesTabProps> = ({
  año,
  estadisticas,
  onGenerarReporte,
  cargando,
  reporteTexto
}) => {
  const [tipoReporteSeleccionado, setTipoReporteSeleccionado] = useState<TipoReporteMaterial>('inventario-completo');

  const tiposReporte: { valor: TipoReporteMaterial; nombre: string; descripcion: string; icono: React.ReactNode }[] = [
    {
      valor: 'inventario-completo',
      nombre: 'Inventario Completo',
      descripcion: 'Reporte detallado de todo el inventario de materiales',
      icono: <FiPackage />
    },
    {
      valor: 'materiales-disponibles',
      nombre: 'Materiales Disponibles',
      descripcion: 'Lista de materiales actualmente disponibles para préstamo',
      icono: <FiBarChart />
    },
    {
      valor: 'materiales-prestados',
      nombre: 'Materiales Prestados',
      descripcion: 'Materiales actualmente en préstamo',
      icono: <FiFileText />
    },
    {
      valor: 'materiales-mantenimiento',
      nombre: 'Materiales en Mantenimiento',
      descripcion: 'Materiales que requieren o están en mantenimiento',
      icono: <FiTool />
    },
    {
      valor: 'estadisticas-uso',
      nombre: 'Estadísticas de Uso',
      descripcion: 'Análisis de uso y tendencias de materiales',
      icono: <FiBarChart />
    },    {
      valor: 'materiales-problematicos',
      nombre: 'Materiales Problemáticos',
      descripcion: 'Materiales que requieren atención o tienen problemas',
      icono: <FiAlertTriangle />
    }
  ];

  const handleGenerarReporte = async () => {
    await onGenerarReporte(tipoReporteSeleccionado);
  };

  const descargarReporte = () => {
    if (!reporteTexto) return;
    
    const element = document.createElement('a');
    const file = new Blob([reporteTexto], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `reporte-materiales-${tipoReporteSeleccionado}-${año}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          📊 Generación de Reportes de Materiales
        </Text>
        <Text fontSize="sm" color="gray.600">
          Genera reportes detallados sobre el inventario y uso de materiales
        </Text>
      </Box>

      {/* Selector de tipo de reporte */}
      <Card>
        <CardBody>
          <Text fontWeight="bold" mb={4}>Seleccionar Tipo de Reporte</Text>
          <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
            {tiposReporte.map((tipo) => (
              <Card
                key={tipo.valor}
                variant={tipoReporteSeleccionado === tipo.valor ? "filled" : "outline"}
                cursor="pointer"
                onClick={() => setTipoReporteSeleccionado(tipo.valor)}
                _hover={{ borderColor: "blue.300" }}
                borderColor={tipoReporteSeleccionado === tipo.valor ? "blue.500" : undefined}
              >
                <CardBody>
                  <HStack spacing={3} align="start">
                    <Box color="blue.500" fontSize="xl">
                      {tipo.icono}
                    </Box>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="medium">{tipo.nombre}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {tipo.descripcion}
                      </Text>
                      {tipoReporteSeleccionado === tipo.valor && (
                        <Badge colorScheme="blue">Seleccionado</Badge>
                      )}
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {/* Resumen de datos para el reporte */}
      {estadisticas && (
        <Card>
          <CardBody>
            <Text fontWeight="bold" mb={4}>Datos Disponibles para el Reporte</Text>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Total de Materiales</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {estadisticas.totalMateriales}
                </Text>
              </VStack>
              
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Disponibles</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {estadisticas.materialesDisponibles}
                </Text>
              </VStack>
              
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Prestados</Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {estadisticas.materialesPrestados}
                </Text>
              </VStack>
              
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Valor Total</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  ${estadisticas.valorTotalInventario.toFixed(0)}
                </Text>
              </VStack>
            </Grid>
          </CardBody>
        </Card>
      )}

      {/* Botón de generación */}
      <HStack justify="center">
        <Button
          leftIcon={<FiFileText />}
          colorScheme="blue"
          size="lg"
          onClick={handleGenerarReporte}
          isLoading={cargando}
          loadingText="Generando reporte..."
          isDisabled={!estadisticas}
        >
          Generar Reporte {año}
        </Button>
      </HStack>

      {cargando && (
        <Box>
          <Text fontSize="sm" mb={2} textAlign="center">
            Generando reporte de {tiposReporte.find(t => t.valor === tipoReporteSeleccionado)?.nombre}...
          </Text>
          <Progress size="sm" isIndeterminate />
        </Box>
      )}

      {/* Vista previa del reporte */}
      {reporteTexto && (
        <Card>
          <CardBody>
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="bold">Vista Previa del Reporte</Text>
              <Button
                leftIcon={<FiDownload />}
                size="sm"
                colorScheme="green"
                onClick={descargarReporte}
              >
                Descargar
              </Button>
            </HStack>
            
            <Textarea
              value={reporteTexto}
              readOnly
              minHeight="300px"
              fontFamily="monospace"
              fontSize="sm"
              bg="gray.50"
            />
          </CardBody>
        </Card>
      )}

      {/* Información adicional */}
      <Alert status="info">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Información sobre los Reportes</Text>
          <Text fontSize="sm">
            Los reportes incluyen datos actualizados del inventario de materiales.
            Puedes descargar los reportes en formato de texto para análisis posterior.
          </Text>
        </Box>
      </Alert>
    </VStack>
  );
};

export default ReportesMaterialesTab;
