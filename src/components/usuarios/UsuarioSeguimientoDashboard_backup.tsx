/**
 * Dashboard de Seguimiento de Usuarios por Años
 * Gestiona estados de aprobación, actividad y estadísticas anuales de usuarios
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  FiUsers,  FiUserCheck,
  FiUserX,
  FiUserPlus,
  FiClock,
  FiSettings
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
import RecalcularEstadosUsuarios from '../admin/RecalcularEstadosUsuarios';
import DiagnosticoUsuariosInactivos from '../admin/DiagnosticoUsuariosInactivos';
import DiagnosticoDetalladoUsuarios from '../admin/DiagnosticoDetalladoUsuarios';
import ReparacionUsuariosDesactualizados from '../admin/ReparacionUsuariosDesactualizados';
import GestionUsuariosTab from './GestionUsuariosTab';
import { GraficosDinamicosUsuarios } from './graficos';

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
  const { userProfile } = useAuth();
  
  // Estados
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoInicial || new Date().getFullYear());
  const [estadisticas, setEstadisticas] = useState<EstadisticasAnualesUsuarios | null>(null);  const [eventosRecientes, setEventosRecientes] = useState<EventoUsuario[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosProblematicos, setUsuariosProblematicos] = useState<UsuarioProblematico[]>([]);
  const [comparacionAños, setComparacionAños] = useState<any>(null);  const [cargando, setCargando] = useState(false);
  const [cargandoMigracion, setCargandoMigracion] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  // Verificar si el usuario es admin
  const esAdmin = useMemo(() => {
    return userProfile?.rol === 'admin';
  }, [userProfile]);

  // Cargar datos al cambiar el año
  useEffect(() => {
    cargarDatos();
  }, [añoSeleccionado]);
  const cargarDatos = async (silencioso = false) => {
    setCargando(true);
    setError(null);
      try {
      console.log('🔄 Iniciando carga de datos para año:', añoSeleccionado);
        const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al cargar estadísticas')), 30000)
      );

      console.log('🔍 Llamando a obtenerEstadisticasAnuales...');
      const stats = await Promise.race([
        usuarioHistorialService.obtenerEstadisticasAnuales(añoSeleccionado),
        timeoutPromise
      ]) as EstadisticasAnualesUsuarios;
      
      console.log('✅ Estadísticas cargadas:', stats);
      
      if (!stats) {
        throw new Error('Las estadísticas son null o undefined');
      }
      
      // Establecer estadísticas inmediatamente
      setEstadisticas(stats);
      console.log('✅ Estadísticas establecidas en el estado del componente');      console.log('🔍 Obteniendo eventos recientes...');
      const eventosRecientesData = await usuarioHistorialService.obtenerEventosRecientes(50);
      console.log('🔍 Eventos recientes obtenidos:', eventosRecientesData.length);
      
      console.log('📊 Debug estadísticas completas:', {
        totalEventos: stats.totalEventos,
        usuariosRegistrados: stats.usuariosRegistrados,
        usuariosAprobados: stats.usuariosAprobados,
        eventosReales: eventosRecientesData.length,
        año: añoSeleccionado
      });
      const eventosFiltrados = eventosRecientesData.filter((e: EventoUsuario) => {
        const fechaEvento = e.fecha instanceof Date ? e.fecha : e.fecha?.toDate();
        return fechaEvento && fechaEvento.getFullYear() === añoSeleccionado;
      });
      console.log('✅ Eventos cargados:', eventosFiltrados.length);
      setEventosRecientes(eventosFiltrados);

      const problematicos = await usuarioHistorialService.obtenerUsuariosProblematicos(añoSeleccionado);      console.log('✅ Usuarios problemáticos cargados:', problematicos.length);
      setUsuariosProblematicos(problematicos);

      // Cargar usuarios para gráficos dinámicos
      console.log('👥 Cargando usuarios para gráficos dinámicos...');
      const usuariosData = await listarUsuarios();
      console.log('✅ Usuarios cargados:', usuariosData.length);
      setUsuarios(usuariosData);

      if (añoSeleccionado > 2020) {
        console.log('📈 Cargando comparación con año anterior...');
        const comparacion = await usuarioHistorialService.compararAños(añoSeleccionado, añoSeleccionado - 1);
        console.log('✅ Comparación cargada:', comparacion);
        setComparacionAños(comparacion);
      }      console.log('🎉 Todos los datos cargados exitosamente');
      
      // Forzar un re-render para asegurar actualización de interfaz
      setTimeout(() => {
        console.log('🔄 Forzando actualización de interfaz después de cargar datos');
        setEstadisticas(prevStats => ({ ...stats }));
      }, 500);} catch (error) {
      console.error('❌ Error al cargar datos:', error);
      console.error('❌ Tipo de error:', typeof error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack available');
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar datos del seguimiento: ${errorMessage}`);
      
      if (!silencioso) {
        toast({
          title: 'Error',
          description: `No se pudieron cargar los datos del seguimiento: ${errorMessage}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
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
      
      const eventosBulk: Array<Omit<EventoUsuario, 'id' | 'fechaRegistro' | 'año' | 'mes'>> = [];
      
      // Generar eventos de registro para cada usuario
      for (const usuario of usuarios) {
        try {
          eventosBulk.push({
            usuarioId: usuario.uid,
            nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
            emailUsuario: usuario.email,
            tipoEvento: 'registro' as any,
            descripcion: `Usuario registrado en el sistema`,
            fecha: usuario.fechaCreacion || new Date(),
            responsableId: 'sistema',
            responsableNombre: 'Sistema Automático'
          });

          if (usuario.estadoAprobacion === 'aprobado') {
            eventosBulk.push({
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
                eventosBulk.push({
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
              }
            }
          }
        } catch (error) {
          console.warn(`Error procesando actividad ${actividad.nombre}:`, error);
        }
      }
        console.log(`📝 Preparando ${eventosBulk.length} eventos para registro en lote...`);
      
      // Registrar todos los eventos en lote (mucho más eficiente) y obtener los eventos creados
      const { ids, eventos: eventosCreados } = await usuarioHistorialService.registrarEventosBulkConEventos(eventosBulk);
      
      console.log(`✅ Generación completada. Se crearon ${eventosCreados.length} eventos`);      toast({
        title: 'Datos generados exitosamente',
        description: `Se generaron ${eventosCreados.length} eventos de seguimiento`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Esperar un poco antes de recargar para que los datos se persistan
      console.log('⏳ Esperando 1 segundo antes de recargar datos...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await cargarDatos(true); // Silencioso para evitar toast duplicado      // Verificar que los datos se cargaron correctamente
      console.log('🔍 Verificando datos después de la recarga...');
      setTimeout(() => {
        console.log('🔍 Estado actual de estadísticas:', estadisticas);
        console.log('🔍 Estado actual de eventos recientes:', eventosRecientes.length);
        if (estadisticas && estadisticas.totalEventos > 0) {
          console.log('✅ Datos verificados correctamente, dashboard visible');
        } else if (eventosRecientes.length > 0) {
          console.log('✅ Hay eventos recientes, dashboard visible');
        } else {
          console.log('⚠️ Los datos aún no se han cargado completamente');
          // Intentar una segunda recarga después de más tiempo
          setTimeout(async () => {
            console.log('🔄 Intentando segunda recarga de datos...');
            await cargarDatos(true);
          }, 2000);
        }
      }, 1500);
      
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

  const limpiarLogs = () => {
    console.clear();
    toast({
      title: 'Logs limpiados',
      description: 'Se ha limpiado la consola del navegador',
      status: 'info',
      duration: 2000,
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
  // Funciones para generar datos de gráficas
  const generarDatosGraficaRegistrosPorMes = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const registrosPorMes = new Array(12).fill(0);
    
    console.log('📊 Generando gráfica de registros por mes. Eventos disponibles:', eventosRecientes.length);
    
    eventosRecientes
      .filter(evento => evento.tipoEvento === TipoEventoUsuario.REGISTRO)
      .forEach(evento => {
        const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha?.toDate();
        if (fecha) {
          registrosPorMes[fecha.getMonth()]++;
        }
      });

    console.log('📊 Registros por mes calculados:', registrosPorMes);

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

    console.log('🎯 Generando gráfica de estados de aprobación. Estadísticas:', estadisticas);

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
    },  };
  // Lógica de renderizado más clara
  const tieneDatos = estadisticas && (estadisticas.totalEventos > 0 || eventosRecientes.length > 0);
  
  console.log('🔍 Decisión de renderizado:', {
    estadisticas: !!estadisticas,
    totalEventos: estadisticas?.totalEventos,
    eventosRecientes: eventosRecientes.length,
    tieneDatos,
    estadisticasCompletas: estadisticas
  });  if (cargando && !estadisticas) {
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
        </Alert>        <Button 
          mt={4} 
          colorScheme="blue" 
          onClick={() => cargarDatos(false)}
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
        {/* Encabezado */}        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading size="lg" color="blue.600">
            Gestión de Usuarios
          </Heading>
          
          <HStack spacing={3}>
            <Select 
              value={añoSeleccionado} 
              onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
              width="120px"
            >
              {añosDisponibles.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}            </Select>
            
            <ChakraTooltip label="Actualizar datos">
              <IconButton
                aria-label="Actualizar"
                icon={<FiRefreshCw />}
                onClick={() => cargarDatos(false)}
                isLoading={cargando}
                colorScheme="blue"
                variant="outline"
              />
            </ChakraTooltip>          </HStack>
        </Flex>
        
        {/* Tarjetas de estadísticas principales */}
        {estadisticas ? (
          (estadisticas.totalEventos === 0 && eventosRecientes.length === 0) ? (
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
                  <VStack spacing={3}>                    <Button 
                      colorScheme="blue" 
                      variant="outline" 
                      onClick={() => cargarDatos(false)}
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
                      loadingText="Generando datos..."                    >
                      Generar datos desde usuarios y actividades existentes
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
        ) : null}        {/* Pestañas principales - Mostrar si hay estadísticas cargadas */}
        {estadisticas && (
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList 
              overflowX="auto" 
              overflowY="hidden"
              flexWrap="nowrap"
              whiteSpace="nowrap"
              scrollBehavior="smooth"
              py={2}
              sx={{
                '&::-webkit-scrollbar': {
                  height: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  bg: 'gray.100',
                },
                '&::-webkit-scrollbar-thumb': {
                  bg: 'gray.400',
                  borderRadius: '4px',
                },
                // Prevenir scroll vertical
                maxHeight: 'fit-content',
                alignItems: 'center',
              }}
            >              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiBarChart />
                  <Box display={{ base: 'none', md: 'block' }}>Resumen</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiUserCheck />
                  <Box display={{ base: 'none', md: 'block' }}>Gestión</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiClock />
                  <Box display={{ base: 'none', md: 'block' }}>Eventos</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiAlertTriangle />
                  <Box display={{ base: 'none', md: 'block' }}>Usuarios</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiTrendingUp />
                  <Box display={{ base: 'none', md: 'block' }}>Gráficos</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiEye />
                  <Box display={{ base: 'none', md: 'block' }}>Comparación</Box>
                </HStack>
              </Tab>              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiFileText />
                  <Box display={{ base: 'none', md: 'block' }}>Reportes</Box>
                </HStack>
              </Tab>
              {esAdmin && (
                <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                  <HStack spacing={{ base: 0, md: 2 }} align="center">
                    <FiSettings />
                    <Box display={{ base: 'none', md: 'block' }}>Herramientas</Box>
                  </HStack>
                </Tab>
              )}
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
                  )}                </VStack>
              </TabPanel>

              {/* Panel Gestión de Usuarios */}
              <TabPanel px={{ base: 0, md: 4 }}>
                <GestionUsuariosTab 
                  onUsuariosChange={(usuarios) => {
                    // Actualizar estadísticas cuando cambien los usuarios
                    console.log('🔄 Usuarios actualizados desde gestión:', usuarios.length);
                  }}
                />              </TabPanel>

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
                                </Td>                                <Td>
                                  <HStack>
                                    {obtenerIconoTipoEvento(evento.tipoEvento as TipoEventoUsuario)}
                                    <Badge colorScheme="blue">
                                      {evento.tipoEvento}
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
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">{usuario.emailUsuario}</Text>                                  <Text fontSize="sm">
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
                                    Último evento: {format(
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
                </Card>              </TabPanel>

              {/* Panel Gráficos */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {/* Debug Info */}
                  <Card variant="outline" borderColor="gray.200">
                    <CardBody>
                      <Text fontSize="sm" color="gray.600">
                        🔍 Debug: {eventosRecientes.length} eventos | {estadisticas?.totalEventos} total eventos | 
                        Registros: {eventosRecientes.filter(e => e.tipoEvento === TipoEventoUsuario.REGISTRO).length}
                      </Text>
                    </CardBody>
                  </Card>

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
                        </Grid>                      </CardBody>
                    </Card>
                  )}

                  {/* Gráficos Dinámicos */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">🎯 Gráficos Dinámicos Configurables</Heading>
                    </CardHeader>                    <CardBody>
                      <GraficosDinamicosUsuarios usuarios={usuarios} />
                    </CardBody>
                  </Card>
                </VStack>
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
                      </Button>                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Panel Herramientas Administrativas - Solo para admins */}
              {esAdmin && (
                <TabPanel px={{ base: 1, md: 4 }}>
                  <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Herramientas Administrativas</AlertTitle>
                        <AlertDescription>
                          Herramientas especializadas para gestión y corrección de datos de usuarios.
                        </AlertDescription>
                      </Box>
                    </Alert>

                    {/* Herramientas de Debug */}
                    <Card borderLeft="4px" borderColor="orange.500">
                      <CardHeader>
                        <Heading size={{ base: 'sm', md: 'md' }} color="orange.600">
                          🔧 Herramientas de Debug
                        </Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <Text fontSize="sm" color="gray.600">
                            Herramientas de depuración y pruebas para desarrollo y diagnóstico.
                          </Text>
                          <Flex wrap="wrap" gap={3}>
                            <Button 
                              colorScheme="blue" 
                              onClick={() => cargarDatos(false)}
                              leftIcon={<FiRefreshCw />}
                              isLoading={cargando}
                              size={{ base: 'sm', md: 'md' }}
                            >
                              Recargar Datos
                            </Button>
                            
                            <Button 
                              colorScheme="orange" 
                              onClick={debugConexion}
                              leftIcon={<FiEye />}
                              size={{ base: 'sm', md: 'md' }}
                            >
                              Probar Conexión
                            </Button>
                                <Button 
                              colorScheme="green" 
                              onClick={generarDatosIniciales}
                              leftIcon={<FiUserPlus />}
                              isLoading={cargandoMigracion}
                              loadingText="Generando..."
                              size={{ base: 'sm', md: 'md' }}
                            >
                              Generar Datos Iniciales
                            </Button>                            <Button 
                              colorScheme="purple" 
                              onClick={limpiarLogs}
                              leftIcon={<FiRefreshCw />}
                              variant="outline"
                              size={{ base: 'sm', md: 'md' }}
                            >
                              Limpiar Logs
                            </Button>
                          </Flex>
                        </VStack>
                      </CardBody>
                    </Card>
                    
                    {/* Componente de reparación de usuarios desactualizados */}
                    <ReparacionUsuariosDesactualizados />
                    
                    {/* Componente de diagnóstico detallado */}
                    <DiagnosticoDetalladoUsuarios />
                    
                    {/* Componente de diagnóstico de usuarios inactivos */}
                    <DiagnosticoUsuariosInactivos />
                    
                    {/* Componente de recálculo de estados */}
                    <RecalcularEstadosUsuarios />
                  </VStack>
                </TabPanel>
              )}
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
