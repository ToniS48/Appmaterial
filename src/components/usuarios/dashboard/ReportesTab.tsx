/**
 * ReportesTab - Componente para generar y gestionar reportes
 */
import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Select,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Alert,
  AlertIcon,
  Badge,
  Progress,
  useToast,
  Divider,
  Grid,
  GridItem,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FiDownload, FiFileText, FiCalendar, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EstadisticasAnualesUsuarios } from '../../../types/usuarioHistorial';

interface ReportesTabProps {
  año: number;
  estadisticas: EstadisticasAnualesUsuarios | null;
  onGenerarReporte: (tipo: TipoReporte, año: number) => Promise<string>;
  cargando: boolean;
}

export enum TipoReporte {
  COMPLETO = 'completo',
  USUARIOS_ACTIVOS = 'usuarios_activos',
  USUARIOS_PROBLEMÁTICOS = 'usuarios_problematicos',
  ESTADISTICAS_MENSUALES = 'estadisticas_mensuales',
  COMPARATIVO_ANUAL = 'comparativo_anual'
}

const ReportesTab: React.FC<ReportesTabProps> = ({
  año,
  estadisticas,
  onGenerarReporte,
  cargando
}) => {
  const toast = useToast();
  const { isOpen: isReporteOpen, onOpen: onReporteOpen, onClose: onReporteClose } = useDisclosure();
  
  const [tipoReporteSeleccionado, setTipoReporteSeleccionado] = useState<TipoReporte>(TipoReporte.COMPLETO);
  const [reporteTexto, setReporteTexto] = useState('');
  const [generandoReporte, setGenerandoReporte] = useState(false);

  const tiposReporte = [
    {
      tipo: TipoReporte.COMPLETO,
      nombre: 'Reporte Completo',
      descripcion: 'Estadísticas completas del año seleccionado',
      icon: FiFileText
    },
    {
      tipo: TipoReporte.USUARIOS_ACTIVOS,
      nombre: 'Usuarios Activos',
      descripcion: 'Listado y análisis de usuarios activos',
      icon: FiUsers
    },
    {
      tipo: TipoReporte.USUARIOS_PROBLEMÁTICOS,
      nombre: 'Usuarios Problemáticos',
      descripcion: 'Usuarios que requieren atención o corrección',
      icon: FiUsers
    },
    {
      tipo: TipoReporte.ESTADISTICAS_MENSUALES,
      nombre: 'Estadísticas Mensuales',
      descripcion: 'Evolución mensual de usuarios',
      icon: FiCalendar
    },
    {
      tipo: TipoReporte.COMPARATIVO_ANUAL,
      nombre: 'Comparativo Anual',
      descripcion: 'Comparación con años anteriores',
      icon: FiCalendar
    }
  ];

  const handleGenerarReporte = async (tipo: TipoReporte) => {
    setGenerandoReporte(true);
    try {
      const reporte = await onGenerarReporte(tipo, año);
      setReporteTexto(reporte);
      setTipoReporteSeleccionado(tipo);
      onReporteOpen();
      
      toast({
        title: "Reporte generado",
        description: "El reporte se ha generado exitosamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error al generar reporte",
        description: "No se pudo generar el reporte solicitado",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGenerandoReporte(false);
    }
  };

  const handleDescargarReporte = () => {
    if (!reporteTexto) return;

    const tipoReporte = tiposReporte.find(t => t.tipo === tipoReporteSeleccionado);
    const nombreArchivo = `${tipoReporte?.nombre.replace(/\s+/g, '_')}_${año}_${format(new Date(), 'yyyyMMdd_HHmm')}.txt`;
    
    const blob = new Blob([reporteTexto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Reporte descargado",
      description: `Se descargó ${nombreArchivo}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const getResumenEstadisticas = () => {
    if (!estadisticas) return null;

    return {      totalUsuarios: estadisticas.usuariosRegistrados,
      usuariosActivos: estadisticas.usuariosActivos,
      usuariosAprobados: estadisticas.usuariosAprobados,
      usuariosRechazados: estadisticas.usuariosRechazados,
      tasaAprobacion: estadisticas.tasaAprobacion ? (estadisticas.tasaAprobacion * 100).toFixed(1) : 'N/A'
    };
  };

  const resumen = getResumenEstadisticas();

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Generación de Reportes - Año {año}
        </Text>
        <Text fontSize="sm" color="gray.600">
          Genera reportes detallados sobre el estado y actividad de los usuarios
        </Text>
      </Box>

      {resumen && (
        <Card>
          <CardHeader>
            <Text fontWeight="bold">Resumen del Año {año}</Text>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <GridItem>
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {resumen.totalUsuarios}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Total Usuarios</Text>
                </Box>
              </GridItem>
              <GridItem>
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {resumen.usuariosActivos}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Usuarios Activos</Text>
                </Box>
              </GridItem>
              <GridItem>
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {resumen.usuariosRechazados}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Pendientes</Text>
                </Box>
              </GridItem>
              <GridItem>
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                    {resumen.tasaAprobacion}%
                  </Text>
                  <Text fontSize="sm" color="gray.600">Tasa Aprobación</Text>
                </Box>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <Text fontWeight="bold">Tipos de Reportes Disponibles</Text>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
            {tiposReporte.map((tipo) => {
              const IconComponent = tipo.icon;
              return (
                <Card key={tipo.tipo} variant="outline">
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <IconComponent />
                        <Text fontWeight="medium">{tipo.nombre}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {tipo.descripcion}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        isLoading={generandoReporte}
                        loadingText="Generando..."
                        onClick={() => handleGenerarReporte(tipo.tipo)}
                        isDisabled={cargando}
                      >
                        Generar Reporte
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </Grid>
        </CardBody>
      </Card>

      {generandoReporte && (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text>Generando reporte...</Text>
            <Progress size="sm" isIndeterminate mt={2} />
          </Box>
        </Alert>
      )}

      {/* Modal para mostrar el reporte generado */}
      <Modal isOpen={isReporteOpen} onClose={onReporteClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxHeight="80vh">
          <ModalHeader>
            <HStack>
              <FiFileText />
              <Text>
                {tiposReporte.find(t => t.tipo === tipoReporteSeleccionado)?.nombre} - Año {año}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={reporteTexto}
              readOnly
              minHeight="400px"
              fontFamily="monospace"
              fontSize="sm"
              resize="vertical"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="blue"
              onClick={handleDescargarReporte}
              mr={3}
            >
              Descargar
            </Button>
            <Button variant="ghost" onClick={onReporteClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ReportesTab;
