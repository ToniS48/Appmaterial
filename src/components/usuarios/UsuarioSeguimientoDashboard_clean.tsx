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
import { listarUsuarios } from '../../services/usuarioService';
import { listarActividades } from '../../services/actividadService';
import { Timestamp } from 'firebase/firestore';
import { format, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

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
  const [cargandoMigracion, setCargandoMigracion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarDebug, setMostrarDebug] = useState(true);
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
    setError(null);
    
    try {
      console.log('🔄 Iniciando carga de datos para año:', añoSeleccionado);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al cargar estadísticas')), 10000)
      );

      const stats = await Promise.race([
        usuarioHistorialService.obtenerEstadisticasAnuales(añoSeleccionado),
        timeoutPromise
      ]) as EstadisticasAnualesUsuarios;
      
      console.log('✅ Estadísticas cargadas:', stats);
      
      if (stats.totalEventos === 0) {
        console.log('📭 No hay eventos de seguimiento - mostrando opción para generar datos');
      }
      
      setEstadisticas(stats);

      const eventosRecientesData = await usuarioHistorialService.obtenerEventosRecientes(50);
      const eventosFiltrados = eventosRecientesData.filter((e: EventoUsuario) => {
        const fechaEvento = e.fecha instanceof Date ? e.fecha : e.fecha?.toDate();
        return fechaEvento && fechaEvento.getFullYear() === añoSeleccionado;
      });
      console.log('✅ Eventos cargados:', eventosFiltrados.length);
      setEventosRecientes(eventosFiltrados);

      const problematicos = await usuarioHistorialService.obtenerUsuariosProblematicos(añoSeleccionado);
      console.log('✅ Usuarios problemáticos cargados:', problematicos.length);
      setUsuariosProblematicos(problematicos);

      if (añoSeleccionado > 2020) {
        console.log('📈 Cargando comparación con año anterior...');
        const comparacion = await usuarioHistorialService.compararAños(añoSeleccionado, añoSeleccionado - 1);
        console.log('✅ Comparación cargada:', comparacion);
        setComparacionAños(comparacion);
      }

      console.log('🎉 Todos los datos cargados exitosamente');

    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar datos del seguimiento: ${errorMessage}`);
      
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

  const generarDatosIniciales = async () => {
    setCargandoMigracion(true);
    try {
      console.log('🔄 Iniciando generación de datos iniciales...');
      
      const usuarios = await listarUsuarios();
      console.log(`👥 Se encontraron ${usuarios.length} usuarios`);
      
      const actividades = await listarActividades();
      console.log(`📅 Se encontraron ${actividades.length} actividades`);
      
      let eventosCreados = 0;
      
      // Generar eventos de registro para cada usuario
      for (const usuario of usuarios) {
        try {
          await usuarioHistorialService.registrarEvento({
            usuarioId: usuario.uid,
            nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
            emailUsuario: usuario.email,
            tipoEvento: 'registro' as any,
            descripcion: `Usuario registrado en el sistema`,
            fecha: usuario.fechaCreacion || new Date(),
            responsableId: 'sistema',
            responsableNombre: 'Sistema Automático'
          });
          eventosCreados++;

          if (usuario.estadoAprobacion === 'aprobado') {
            await usuarioHistorialService.registrarEvento({
              usuarioId: usuario.uid,
              nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
              emailUsuario: usuario.email,
              tipoEvento: 'aprobacion' as any,
              descripcion: `Usuario aprobado para participar en actividades`,
              fecha: usuario.fechaAprobacion instanceof Date || usuario.fechaAprobacion instanceof Timestamp 
                    ? usuario.fechaAprobacion 
                    : usuario.fechaCreacion || new Date(),
              responsableId: 'sistema',
              responsableNombre: 'Sistema Automático'
            });
            eventosCreados++;
          }
          
        } catch (error) {
          console.warn(`Error procesando usuario ${usuario.email}:`, error);
        }
      }
      
      // Generar eventos de participación basados en actividades
      for (const actividad of actividades) {
        try {
          if (actividad.participanteIds && actividad.participanteIds.length > 0) {
            for (const participanteId of actividad.participanteIds) {
              const usuario = usuarios.find(u => u.uid === participanteId);
              if (usuario) {
                await usuarioHistorialService.registrarEvento({
                  usuarioId: participanteId,
                  nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
                  emailUsuario: usuario.email,
                  tipoEvento: 'participacion' as any,
                  descripcion: `Participó en la actividad: ${actividad.nombre}`,
                  fecha: actividad.fechaInicio instanceof Date ? actividad.fechaInicio : actividad.fechaInicio?.toDate() || new Date(),
                  actividadId: actividad.id,
                  actividadNombre: actividad.nombre,
                  responsableId: actividad.creadorId,
                  responsableNombre: 'Sistema Automático'
                });
                eventosCreados++;
              }
            }
          }
        } catch (error) {
          console.warn(`Error procesando actividad ${actividad.nombre}:`, error);
        }
      }
      
      console.log(`✅ Generación completada. Se crearon ${eventosCreados} eventos`);
      
      toast({
        title: 'Datos generados exitosamente',
        description: `Se generaron ${eventosCreados} eventos de seguimiento`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      await cargarDatos();
      
    } catch (error) {
      console.error('❌ Error generando datos iniciales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron generar los datos iniciales',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargandoMigracion(false);
    }
  };

  const debugConexion = async () => {
    try {
      console.log('🔧 [DEBUG] Probando conexión directa...');
      
      const eventos = await usuarioHistorialService.obtenerEventosRecientes(5);
      console.log('🔧 [DEBUG] Eventos recientes:', eventos);
      
      const usuarios = await listarUsuarios();
      console.log('🔧 [DEBUG] Usuarios encontrados:', usuarios.length);
      
      const actividades = await listarActividades();
      console.log('🔧 [DEBUG] Actividades encontradas:', actividades.length);
      
      toast({
        title: 'Debug completado',
        description: `Eventos: ${eventos.length}, Usuarios: ${usuarios.length}, Actividades: ${actividades.length}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('🔧 [DEBUG] Error:', error);
      toast({
        title: 'Error en debug',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
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

  // Funciones para generar datos de gráficas
  const generarDatosGraficaRegistrosPorMes = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const registrosPorMes = new Array(12).fill(0);
    
    eventosRecientes
      .filter(evento => (evento as any).tipoEvento === 'registro')
      .forEach(evento => {
        const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha?.toDate();
        if (fecha) {
          registrosPorMes[fecha.getMonth()]++;
        }
      });

    return {
      labels: meses,
      datasets: [{
        label: 'Registros',
        data: registrosPorMes,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        borderRadius: 4,
      }]
    };
  };

  const generarDatosGraficaEstadosAprobacion = () => {
    if (!estadisticas) return { labels: [], datasets: [] };

    return {
      labels: ['Aprobados', 'Rechazados'],
      datasets: [{
        data: [
          estadisticas.usuariosAprobados,
          estadisticas.usuariosRechazados,
        ],
        backgroundColor: [
          'rgba(72, 187, 120, 0.8)',
          'rgba(245, 101, 101, 0.8)',
        ],
        borderColor: [
          'rgba(72, 187, 120, 1)',
          'rgba(245, 101, 101, 1)',
        ],
        borderWidth: 2,
      }]
    };
  };

  const generarDatosGraficaActividadTemporal = () => {
    if (!comparacionAños) return { labels: [], datasets: [] };

    const años = [añoSeleccionado - 1, añoSeleccionado];
    const datosAñoAnterior = comparacionAños.añoAnterior;
    const datosAñoActual = estadisticas;

    return {
      labels: años.map(año => año.toString()),
      datasets: [
        {
          label: 'Usuarios Activos',
          data: [datosAñoAnterior?.usuariosActivos || 0, datosAñoActual?.usuariosActivos || 0],
          borderColor: 'rgba(72, 187, 120, 1)',
          backgroundColor: 'rgba(72, 187, 120, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Usuarios Registrados',
          data: [datosAñoAnterior?.usuariosRegistrados || 0, datosAñoActual?.usuariosRegistrados || 0],
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
        }
      ]
    };
  };

  const opcionesGraficaBarras = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const opcionesGraficaPastel = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const opcionesGraficaLineas = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Renderizar botones de debug SOLO si está habilitado Y no hay datos aún
  if (mostrarDebug && (!estadisticas || estadisticas.totalEventos === 0)) {
    return (
      <Box p={6} maxWidth="1400px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Card borderLeft="4px" borderColor="orange.500">
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md" color="orange.600">🔧 Panel de Debug</Heading>
                <HStack spacing={3} wrap="wrap">
                  <Button 
                    colorScheme="blue" 
                    onClick={cargarDatos}
                    leftIcon={<FiRefreshCw />}
                    isLoading={cargando}
                  >
                    Cargar Datos
                  </Button>
                  
                  <Button 
                    colorScheme="orange" 
                    onClick={debugConexion}
                    leftIcon={<FiEye />}
                  >
                    Test Conexión
                  </Button>
                  
                  <Button 
                    colorScheme="green" 
                    onClick={generarDatosIniciales}
                    leftIcon={<FiUserPlus />}
                    isLoading={cargandoMigracion}
                    loadingText="Generando..."
                  >
                    Generar Datos
                  </Button>
                  
                  <Button 
                    colorScheme="gray" 
                    onClick={() => setMostrarDebug(false)}
                    size="sm"
                  >
                    Ocultar Debug
                  </Button>
                </HStack>
                
                <Text fontSize="sm" color="gray.600">
                  Estado: {cargando ? 'Cargando...' : error ? `Error: ${error}` : estadisticas ? `${estadisticas.totalEventos} eventos` : 'Sin datos'}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {!cargando && !error && estadisticas && estadisticas.totalEventos > 0 && (
            <Card borderLeft="4px" borderColor="green.500">
              <CardBody>
                <HStack>
                  <Text color="green.600" fontWeight="bold">✅ Datos cargados exitosamente:</Text>
                  <Text>{estadisticas.totalEventos} eventos de seguimiento</Text>
                  <Button size="sm" variant="outline" onClick={() => setMostrarDebug(false)}>
                    Ver Dashboard Completo
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          )}
          
          {!cargando && !error && estadisticas && estadisticas.totalEventos === 0 && (
            <Text color="orange.600">No hay datos disponibles. Usa el botón "Generar Datos" para crear el historial inicial.</Text>
          )}
        </VStack>
      </Box>
    );
  }

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

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Error al cargar datos</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Box>
        </Alert>
        <Button 
          mt={4} 
          colorScheme="blue" 
          onClick={cargarDatos}
          leftIcon={<FiRefreshCw />}
        >
          Reintentar
        </Button>
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
            
            <ChakraTooltip label="Debug: Probar conexión">
              <IconButton
                aria-label="Debug"
                icon={<FiEye />}
                onClick={debugConexion}
                colorScheme="orange"
                variant="outline"
              />
            </ChakraTooltip>
            
            <Button 
              colorScheme="green" 
              variant="outline" 
              onClick={generarDatosIniciales}
              leftIcon={<FiUserPlus />}
              isLoading={cargandoMigracion}
              loadingText="Generando..."
              size="sm"
            >
              Generar datos
            </Button>
          </HStack>
        </Flex>

        {/* Tarjetas de estadísticas principales */}
        {estadisticas ? (
          estadisticas.totalEventos === 0 ? (
            <Card>
              <CardBody>
                <VStack spacing={4} py={8}>
                  <Text fontSize="lg" fontWeight="medium" color="gray.600">
                    No hay datos de seguimiento para el año {añoSeleccionado}
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    Los datos de seguimiento se generan automáticamente cuando los usuarios realizan actividades.
                    Para ver estadísticas, asegúrate de que hay usuarios registrados y actividades en el sistema.
                  </Text>
                  <VStack spacing={3}>
                    <Button 
                      colorScheme="blue" 
                      variant="outline" 
                      onClick={cargarDatos}
                      leftIcon={<FiRefreshCw />}
                    >
                      Actualizar datos
                    </Button>
                    <Button 
                      colorScheme="green" 
                      variant="solid" 
                      onClick={generarDatosIniciales}
                      leftIcon={<FiUserPlus />}
                      isLoading={cargandoMigracion}
                      loadingText="Generando datos..."
                    >
                      Generar datos desde usuarios y actividades existentes
                    </Button>
                    <Button 
                      colorScheme="orange" 
                      variant="outline" 
                      onClick={debugConexion}
                      leftIcon={<FiEye />}
                      size="sm"
                    >
                      Debug: Probar conexión
                    </Button>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          ) : (
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
          )
        ) : null}

        {/* Pestañas principales - Solo mostrar si hay datos */}
        {estadisticas && estadisticas.totalEventos > 0 && (
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
                <VStack spacing={6} align="stretch">
                  {/* Gráfica de Registros por Mes */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">📊 Registros por Mes - {añoSeleccionado}</Heading>
                    </CardHeader>
                    <CardBody>
                      <Box height="300px">
                        <Bar 
                          data={generarDatosGraficaRegistrosPorMes()} 
                          options={opcionesGraficaBarras}
                        />
                      </Box>
                    </CardBody>
                  </Card>

                  <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                    {/* Gráfica de Estados de Aprobación */}
                    <Card>
                      <CardHeader>
                        <Heading size="md">🎯 Estados de Aprobación</Heading>
                      </CardHeader>
                      <CardBody>
                        <Box height="300px">
                          <Pie 
                            data={generarDatosGraficaEstadosAprobacion()} 
                            options={opcionesGraficaPastel}
                          />
                        </Box>
                      </CardBody>
                    </Card>

                    {/* Gráfica de Tendencia Temporal */}
                    <Card>
                      <CardHeader>
                        <Heading size="md">📈 Tendencia Temporal</Heading>
                      </CardHeader>
                      <CardBody>
                        {comparacionAños ? (
                          <Box height="300px">
                            <Line 
                              data={generarDatosGraficaActividadTemporal()} 
                              options={opcionesGraficaLineas}
                            />
                          </Box>
                        ) : (
                          <Alert status="info">
                            <AlertIcon />
                            <Box>
                              <AlertTitle>Sin datos de comparación</AlertTitle>
                              <AlertDescription>
                                Se necesitan datos de años anteriores para mostrar tendencias.
                              </AlertDescription>
                            </Box>
                          </Alert>
                        )}
                      </CardBody>
                    </Card>
                  </Grid>

                  {/* Métricas Adicionales */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">📋 Métricas Avanzadas</Heading>
                    </CardHeader>
                    <CardBody>
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                        <Card variant="outline">
                          <CardBody textAlign="center">
                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                              {estadisticas?.tasaAprobacion.toFixed(1)}%
                            </Text>
                            <Text fontSize="sm" color="gray.600">Tasa de Aprobación</Text>
                          </CardBody>
                        </Card>
                        
                        <Card variant="outline">
                          <CardBody textAlign="center">
                            <Text fontSize="2xl" fontWeight="bold" color="green.500">
                              {estadisticas?.tasaActividad.toFixed(1)}%
                            </Text>
                            <Text fontSize="sm" color="gray.600">Tasa de Actividad</Text>
                          </CardBody>
                        </Card>
                        
                        <Card variant="outline">
                          <CardBody textAlign="center">
                            <Text fontSize="2xl" fontWeight="bold" color="teal.500">
                              {estadisticas?.tasaRetencion.toFixed(1)}%
                            </Text>
                            <Text fontSize="sm" color="gray.600">Tasa de Retención</Text>
                          </CardBody>
                        </Card>
                        
                        <Card variant="outline">
                          <CardBody textAlign="center">
                            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                              {eventosRecientes.length}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Eventos del Año</Text>
                          </CardBody>
                        </Card>
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* Indicadores de Rendimiento */}
                  {comparacionAños && (
                    <Card>
                      <CardHeader>
                        <Heading size="md">🚀 Indicadores de Rendimiento</Heading>
                      </CardHeader>
                      <CardBody>
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                          <VStack align="start" spacing={3}>
                            <Text fontWeight="bold">Crecimiento Anual</Text>
                            <HStack>
                              <Progress 
                                value={Math.abs(comparacionAños.comparacion.crecimientoUsuarios)} 
                                colorScheme={comparacionAños.comparacion.crecimientoUsuarios > 0 ? 'green' : 'red'}
                                size="lg" 
                                width="200px"
                                max={100}
                              />
                              <Badge colorScheme={comparacionAños.comparacion.crecimientoUsuarios > 0 ? 'green' : 'red'}>
                                {comparacionAños.comparacion.crecimientoUsuarios.toFixed(1)}%
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              Comparación con {añoSeleccionado - 1}
                            </Text>
                          </VStack>
                          
                          <VStack align="start" spacing={3}>
                            <Text fontWeight="bold">Cambio en Actividad</Text>
                            <HStack>
                              <Progress 
                                value={Math.abs(comparacionAños.comparacion.cambioTasaActividad)} 
                                colorScheme={comparacionAños.comparacion.cambioTasaActividad > 0 ? 'green' : 'red'}
                                size="lg" 
                                width="200px"
                                max={100}
                              />
                              <Badge colorScheme={comparacionAños.comparacion.cambioTasaActividad > 0 ? 'green' : 'red'}>
                                {comparacionAños.comparacion.cambioTasaActividad.toFixed(1)}%
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              Actividad vs año anterior
                            </Text>
                          </VStack>
                        </Grid>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
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
                            {eventosRecientes.map((evento, index) => (
                              <Tr key={index}>
                                <Td>
                                  {format(
                                    evento.fecha instanceof Date ? evento.fecha : evento.fecha?.toDate() || new Date(),
                                    'dd/MM/yyyy',
                                    { locale: es }
                                  )}
                                </Td>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium">{evento.nombreUsuario}</Text>
                                    <Text fontSize="xs" color="gray.500">{evento.emailUsuario}</Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <HStack>
                                    {obtenerIconoTipoEvento((evento as any).tipoEvento as TipoEventoUsuario)}
                                    <Badge colorScheme="blue">
                                      {(evento as any).tipoEvento}
                                    </Badge>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">{evento.descripcion}</Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">{evento.responsableNombre}</Text>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>No hay eventos recientes</AlertTitle>
                          <AlertDescription>
                            No se encontraron eventos de usuarios para el año {añoSeleccionado}.
                          </AlertDescription>
                        </Box>
                      </Alert>
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
                        {usuariosProblematicos.map((usuario, index) => (
                          <Card key={index} variant="outline">
                            <CardBody>
                              <Flex justify="space-between" align="start">
                                <VStack align="start" spacing={2}>
                                  <HStack>
                                    <Text fontWeight="bold">{usuario.nombreUsuario}</Text>
                                    <Badge
                                      colorScheme={obtenerColorEstado(usuario.estadoActual.aprobacion)}
                                    >
                                      {usuario.estadoActual.aprobacion}
                                    </Badge>
                                    <Badge
                                      colorScheme={obtenerColorEstado(usuario.estadoActual.actividad)}
                                    >
                                      {usuario.estadoActual.actividad}
                                    </Badge>
                                  </HStack>                                  <Text fontSize="sm" color="gray.600">{usuario.emailUsuario}</Text>
                                  <Text fontSize="sm">
                                    <strong>Recomendaciones:</strong> {usuario.recomendaciones.join(', ')}
                                  </Text>
                                </VStack>
                                <VStack align="end">
                                  <Badge
                                    colorScheme={obtenerColorEstado(usuario.gravedad)}
                                    size="lg"
                                  >
                                    {usuario.gravedad}
                                  </Badge>                                  <Text fontSize="xs" color="gray.500">
                                    Última actividad: {format(
                                      usuario.ultimoEvento instanceof Date 
                                        ? usuario.ultimoEvento 
                                        : usuario.ultimoEvento?.toDate() || new Date(),
                                      'dd/MM/yyyy'
                                    )}
                                  </Text>
                                </VStack>
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : (
                      <Alert status="success">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>¡Excelente!</AlertTitle>
                          <AlertDescription>
                            No se detectaron usuarios problemáticos para el año {añoSeleccionado}.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Panel Comparación */}
              <TabPanel>
                {comparacionAños ? (
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                    <Card>
                      <CardHeader>
                        <Heading size="md">Año {añoSeleccionado}</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack align="start" spacing={2}>
                          <Text>Usuarios registrados: {estadisticas?.usuariosRegistrados}</Text>
                          <Text>Usuarios aprobados: {estadisticas?.usuariosAprobados}</Text>
                          <Text>Usuarios activos: {estadisticas?.usuariosActivos}</Text>
                          <Text>Total eventos: {estadisticas?.totalEventos}</Text>
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
                          <Text>Usuarios activos: {comparacionAños.añoAnterior.usuariosActivos}</Text>
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
                      No hay suficientes datos históricos para realizar una comparación con años anteriores.
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
        )}

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
