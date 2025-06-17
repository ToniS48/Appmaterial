/**
 * Dashboard de Seguimiento de Usuarios por Años
 * Gestiona estados de aprobación, actividad y estadísticas anuales de usuarios
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
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiUserPlus,
  FiClock
} from 'react-icons/fi';
import { 
  EstadisticasAnualesUsuarios, 
  EventoUsuario, 
  ResumenAnualUsuarios,
  TipoEventoUsuario,
  EstadoAprobacion,
  EstadoActividad,
  UsuarioProblematico
} from '../../types/usuarioHistorial';
import { usuarioHistorialService } from '../../services/domain/UsuarioHistorialService';
import { format, subYears } from 'date-fns';
import { es } from 'date-fns/locale';

interface UsuarioSeguimientoDashboardProps {
  añoInicial?: number;
}

const UsuarioSeguimientoDashboard: React.FC<UsuarioSeguimientoDashboardProps> = ({
  añoInicial
}) => {
  const toast = useToast();
  const { isOpen: isReporteOpen, onOpen: onReporteOpen, onClose: onReporteClose } = useDisclosure();
  
  // Estados
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoInicial || new Date().getFullYear());
  const [estadisticas, setEstadisticas] = useState<EstadisticasAnualesUsuarios | null>(null);
  const [eventosRecientes, setEventosRecientes] = useState<EventoUsuario[]>([]);
  const [usuariosProblematicos, setUsuariosProblematicos] = useState<UsuarioProblematico[]>([]);
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

  // Cargar datos al cambiar el año
  useEffect(() => {
    cargarDatos();
  }, [añoSeleccionado]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // Cargar estadísticas del año actual
      const stats = await usuarioHistorialService.obtenerEstadisticasAnuales(añoSeleccionado);
      setEstadisticas(stats);      // Cargar eventos recientes del año
      const eventosRecientesData = await usuarioHistorialService.obtenerEventosRecientes(50);
      const eventosFiltrados = eventosRecientesData.filter((e: EventoUsuario) => {
        const fechaEvento = e.fecha instanceof Date ? e.fecha : e.fecha?.toDate();
        return fechaEvento && fechaEvento.getFullYear() === añoSeleccionado;
      });
      setEventosRecientes(eventosFiltrados);

      // Cargar usuarios problemáticos
      const problematicos = await usuarioHistorialService.obtenerUsuariosProblematicos(añoSeleccionado);
      setUsuariosProblematicos(problematicos);

      // Comparar con año anterior si no es el primer año
      if (añoSeleccionado > 2020) {
        const comparacion = await usuarioHistorialService.compararAños(añoSeleccionado, añoSeleccionado - 1);
        setComparacionAños(comparacion);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del seguimiento',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargando(false);
    }
  };

  const generarReporte = async () => {
    try {
      const reporte = await usuarioHistorialService.generarReporteAnual(añoSeleccionado);
      setReporteTexto(reporte);
      onReporteOpen();
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el reporte',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const descargarReporte = () => {
    const element = document.createElement('a');
    const file = new Blob([reporteTexto], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `reporte-usuarios-${añoSeleccionado}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'Descarga completada',
      description: 'El reporte ha sido descargado exitosamente',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case EstadoAprobacion.APROBADO:
      case EstadoActividad.ACTIVO:
        return 'green';
      case EstadoAprobacion.PENDIENTE:
        return 'yellow';
      case EstadoAprobacion.RECHAZADO:
      case EstadoActividad.SUSPENDIDO:
        return 'red';
      case EstadoActividad.INACTIVO:
        return 'gray';
      default:
        return 'blue';
    }
  };

  const obtenerIconoTipoEvento = (tipo: TipoEventoUsuario) => {
    switch (tipo) {
      case TipoEventoUsuario.REGISTRO:
        return <FiUserPlus />;
      case TipoEventoUsuario.APROBACION:
        return <FiUserCheck />;
      case TipoEventoUsuario.RECHAZO:
      case TipoEventoUsuario.SUSPENSION:
        return <FiUserX />;
      case TipoEventoUsuario.ACTIVACION:
        return <FiTrendingUp />;
      case TipoEventoUsuario.DESACTIVACION:
        return <FiTrendingDown />;
      case TipoEventoUsuario.CAMBIO_ROL:
        return <FiUsers />;
      default:
        return <FiClock />;
    }
  };

  if (cargando && !estadisticas) {
    return (
      <Box p={6}>
        <VStack spacing={4}>
          <Text>Cargando datos de seguimiento de usuarios...</Text>
          <Progress size="xs" isIndeterminate width="100%" />
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} maxWidth="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Encabezado */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading size="lg" color="blue.600">
            Seguimiento Anual de Usuarios
          </Heading>
          
          <HStack spacing={3}>
            <Select 
              value={añoSeleccionado} 
              onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
              width="120px"
            >
              {añosDisponibles.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </Select>
            
            <ChakraTooltip label="Actualizar datos">
              <IconButton
                aria-label="Actualizar"
                icon={<FiRefreshCw />}
                onClick={cargarDatos}
                isLoading={cargando}
                colorScheme="blue"
                variant="outline"
              />
            </ChakraTooltip>
          </HStack>
        </Flex>

        {/* Tarjetas de estadísticas principales */}
        {estadisticas && (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Usuarios Registrados</StatLabel>
                  <StatNumber color="blue.500">{estadisticas.usuariosRegistrados}</StatNumber>
                  {comparacionAños && (
                    <StatHelpText>
                      <StatArrow type={comparacionAños.comparacion.crecimientoUsuarios > 0 ? 'increase' : 'decrease'} />
                      {Math.abs(comparacionAños.comparacion.crecimientoUsuarios).toFixed(1)}% vs año anterior
                    </StatHelpText>
                  )}
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Usuarios Aprobados</StatLabel>
                  <StatNumber color="green.500">{estadisticas.usuariosAprobados}</StatNumber>
                  <StatHelpText>
                    Tasa: {estadisticas.tasaAprobacion.toFixed(1)}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Usuarios Activos</StatLabel>
                  <StatNumber color="teal.500">{estadisticas.usuariosActivos}</StatNumber>
                  <StatHelpText>
                    Actividad: {estadisticas.tasaActividad.toFixed(1)}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Usuarios Suspendidos</StatLabel>
                  <StatNumber color="red.500">{estadisticas.usuariosSuspendidos}</StatNumber>
                  <StatHelpText>
                    Inactivos: {estadisticas.usuariosInactivos}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>
        )}

        {/* Pestañas principales */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab><FiBarChart style={{ marginRight: '8px' }} />Resumen</Tab>
            <Tab><FiTrendingUp style={{ marginRight: '8px' }} />Gráficos</Tab>
            <Tab><FiClock style={{ marginRight: '8px' }} />Eventos</Tab>
            <Tab><FiAlertTriangle style={{ marginRight: '8px' }} />Usuarios</Tab>
            <Tab><FiEye style={{ marginRight: '8px' }} />Comparación</Tab>
            <Tab><FiFileText style={{ marginRight: '8px' }} />Reportes</Tab>
          </TabList>

          <TabPanels>
            {/* Panel Resumen */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {estadisticas && (
                  <>
                    <Card>
                      <CardHeader>
                        <Heading size="md">Estadísticas Generales {añoSeleccionado}</Heading>
                      </CardHeader>
                      <CardBody>
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                          <VStack>
                            <Text fontWeight="bold" color="blue.600">Estados de Aprobación</Text>
                            <Text>Aprobados: {estadisticas.usuariosAprobados}</Text>
                            <Text>Rechazados: {estadisticas.usuariosRechazados}</Text>
                            <Text>Tasa de aprobación: {estadisticas.tasaAprobacion.toFixed(1)}%</Text>
                          </VStack>
                          
                          <VStack>
                            <Text fontWeight="bold" color="teal.600">Estados de Actividad</Text>
                            <Text>Activos: {estadisticas.usuariosActivos}</Text>
                            <Text>Inactivos: {estadisticas.usuariosInactivos}</Text>
                            <Text>Suspendidos: {estadisticas.usuariosSuspendidos}</Text>
                          </VStack>
                          
                          <VStack>
                            <Text fontWeight="bold" color="purple.600">Métricas de Calidad</Text>
                            <Text>Tasa de actividad: {estadisticas.tasaActividad.toFixed(1)}%</Text>
                            <Text>Tasa de retención: {estadisticas.tasaRetencion.toFixed(1)}%</Text>
                            <Text>Total eventos: {estadisticas.totalEventos}</Text>
                          </VStack>
                        </Grid>
                      </CardBody>
                    </Card>

                    {comparacionAños && (
                      <Card>
                        <CardHeader>
                          <Heading size="md">Comparación con Año Anterior</Heading>
                        </CardHeader>
                        <CardBody>
                          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                            <VStack align="start">
                              <Text fontWeight="bold">Crecimiento</Text>
                              <HStack>
                                <Text>Usuarios:</Text>
                                <Badge colorScheme={comparacionAños.comparacion.crecimientoUsuarios > 0 ? 'green' : 'red'}>
                                  {comparacionAños.comparacion.crecimientoUsuarios > 0 ? '+' : ''}
                                  {comparacionAños.comparacion.crecimientoUsuarios.toFixed(1)}%
                                </Badge>
                              </HStack>
                              <HStack>
                                <Text>Actividad:</Text>
                                <Badge colorScheme={comparacionAños.comparacion.cambioTasaActividad > 0 ? 'green' : 'red'}>
                                  {comparacionAños.comparacion.cambioTasaActividad > 0 ? '+' : ''}
                                  {comparacionAños.comparacion.cambioTasaActividad.toFixed(1)}%
                                </Badge>
                              </HStack>
                            </VStack>
                            
                            <VStack align="start">
                              <Text fontWeight="bold">Tendencia General</Text>
                              <Badge 
                                size="lg" 
                                colorScheme={
                                  comparacionAños.comparacion.tendencia.includes('Crecimiento') ? 'green' :
                                  comparacionAños.comparacion.tendencia.includes('Declive') ? 'red' : 'blue'
                                }
                              >
                                {comparacionAños.comparacion.tendencia}
                              </Badge>
                            </VStack>
                          </Grid>
                        </CardBody>
                      </Card>
                    )}
                  </>
                )}
              </VStack>
            </TabPanel>

            {/* Panel Gráficos */}
            <TabPanel>
              <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                <Card>
                  <CardHeader>
                    <Heading size="md">Registros por Mes</Heading>
                  </CardHeader>
                  <CardBody>
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Gráfico de Registros por Mes</AlertTitle>
                        <AlertDescription>
                          Los gráficos interactivos estarán disponibles próximamente.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">Distribución por Estado</Heading>
                  </CardHeader>
                  <CardBody>
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Gráfico de Estados de Usuario</AlertTitle>
                        <AlertDescription>
                          Los gráficos interactivos estarán disponibles próximamente.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Panel Eventos */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Eventos Recientes de Usuarios</Heading>
                </CardHeader>
                <CardBody>
                  {eventosRecientes.length > 0 ? (
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Fecha</Th>
                            <Th>Usuario</Th>
                            <Th>Tipo</Th>
                            <Th>Descripción</Th>
                            <Th>Responsable</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {eventosRecientes.slice(0, 20).map((evento) => (
                            <Tr key={evento.id}>
                              <Td>
                                {format(
                                  evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate(),
                                  'dd/MM/yyyy',
                                  { locale: es }
                                )}
                              </Td>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{evento.nombreUsuario}</Text>
                                  <Text fontSize="xs" color="gray.500">{evento.emailUsuario}</Text>
                                </VStack>
                              </Td>
                              <Td>
                                <HStack>
                                  <Box color="blue.500">
                                    {obtenerIconoTipoEvento(evento.tipoEvento)}
                                  </Box>
                                  <Badge colorScheme="blue" size="sm">
                                    {evento.tipoEvento}
                                  </Badge>
                                </HStack>
                              </Td>
                              <Td>
                                <Text fontSize="sm" noOfLines={2}>{evento.descripcion}</Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm">{evento.responsableNombre || '-'}</Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ) : (
                    <Text color="gray.500" textAlign="center" py={8}>
                      No hay eventos registrados para este año
                    </Text>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Panel Usuarios Problemáticos */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Usuarios que Requieren Atención</Heading>
                </CardHeader>
                <CardBody>
                  {usuariosProblematicos.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {usuariosProblematicos.map((usuario) => (
                        <Card key={usuario.usuarioId} variant="outline">
                          <CardBody>
                            <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap={4}>
                              <VStack align="start">
                                <Text fontWeight="bold">{usuario.nombreUsuario}</Text>
                                <Text fontSize="sm" color="gray.600">{usuario.emailUsuario}</Text>
                                <HStack>
                                  <Badge colorScheme={obtenerColorEstado(usuario.estadoActual.aprobacion)}>
                                    {usuario.estadoActual.aprobacion}
                                  </Badge>
                                  <Badge colorScheme={obtenerColorEstado(usuario.estadoActual.actividad)}>
                                    {usuario.estadoActual.actividad}
                                  </Badge>
                                </HStack>
                              </VStack>
                              
                              <VStack align="start">
                                <Text fontSize="sm">
                                  <strong>Total eventos:</strong> {usuario.totalEventos}
                                </Text>
                                <Text fontSize="sm">
                                  <strong>Gravedad:</strong>
                                  <Badge 
                                    ml={2} 
                                    colorScheme={
                                      usuario.gravedad === 'critica' ? 'red' :
                                      usuario.gravedad === 'alta' ? 'orange' :
                                      usuario.gravedad === 'media' ? 'yellow' : 'gray'
                                    }
                                  >
                                    {usuario.gravedad}
                                  </Badge>
                                </Text>
                              </VStack>
                              
                              <VStack align="start">
                                <Text fontSize="sm" fontWeight="bold">Recomendaciones:</Text>
                                {usuario.recomendaciones.slice(0, 2).map((rec, index) => (
                                  <Text key={index} fontSize="xs" color="gray.600">
                                    • {rec}
                                  </Text>
                                ))}
                              </VStack>
                            </Grid>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  ) : (
                    <Alert status="success">
                      <AlertIcon />
                      <AlertTitle>¡Excelente!</AlertTitle>
                      <AlertDescription>
                        No se identificaron usuarios problemáticos este año.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Panel Comparación */}
            <TabPanel>
              {comparacionAños ? (
                <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Año {añoSeleccionado}</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text>Usuarios registrados: {comparacionAños.añoActual.usuariosRegistrados}</Text>
                        <Text>Usuarios aprobados: {comparacionAños.añoActual.usuariosAprobados}</Text>
                        <Text>Tasa de aprobación: {comparacionAños.añoActual.tasaAprobacion.toFixed(1)}%</Text>
                        <Text>Tasa de actividad: {comparacionAños.añoActual.tasaActividad.toFixed(1)}%</Text>
                        <Text>Total eventos: {comparacionAños.añoActual.totalEventos}</Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">Año {añoSeleccionado - 1}</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text>Usuarios registrados: {comparacionAños.añoAnterior.usuariosRegistrados}</Text>
                        <Text>Usuarios aprobados: {comparacionAños.añoAnterior.usuariosAprobados}</Text>
                        <Text>Tasa de aprobación: {comparacionAños.añoAnterior.tasaAprobacion.toFixed(1)}%</Text>
                        <Text>Tasa de actividad: {comparacionAños.añoAnterior.tasaActividad.toFixed(1)}%</Text>
                        <Text>Total eventos: {comparacionAños.añoAnterior.totalEventos}</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  <AlertTitle>Sin datos de comparación</AlertTitle>
                  <AlertDescription>
                    No hay datos del año anterior para comparar.
                  </AlertDescription>
                </Alert>
              )}
            </TabPanel>

            {/* Panel Reportes */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Generar Reportes</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="start">
                    <Text>
                      Genera un reporte completo del seguimiento de usuarios para el año {añoSeleccionado}.
                    </Text>
                    <Button
                      leftIcon={<FiFileText />}
                      colorScheme="blue"
                      onClick={generarReporte}
                      isLoading={cargando}
                    >
                      Generar Reporte Anual
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modal para mostrar reporte */}
        <Modal isOpen={isReporteOpen} onClose={onReporteClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Reporte Anual de Usuarios {añoSeleccionado}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box
                as="pre"
                fontSize="sm"
                fontFamily="monospace"
                whiteSpace="pre-wrap"
                maxHeight="500px"
                overflowY="auto"
                bg="gray.50"
                p={4}
                borderRadius="md"
              >
                {reporteTexto}
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onReporteClose}>
                Cerrar
              </Button>
              <Button leftIcon={<FiDownload />} colorScheme="blue" onClick={descargarReporte}>
                Descargar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default UsuarioSeguimientoDashboard;
