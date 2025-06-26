import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Spinner,
  Text,
  Select,
  Input,
  FormControl,
  FormLabel,
  useToast
} from '@chakra-ui/react';
import { FiEdit, FiCheck, FiPlus, FiSearch, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  listarPrestamos, 
  registrarDevolucion, 
  obtenerPrestamosVencidos, 
  limpiarCacheVencidos,
  marcarPrestamosVencidosAutomaticamente 
} from '../../services/prestamoService';
import { obtenerActividad } from '../../services/actividadService';
import { Prestamo, EstadoPrestamo } from '../../types/prestamo';
import { RolUsuario } from '../../types/usuario';
import PrestamoForm from './PrestamoForm';
import DevolucionAvanzadaForm from './DevolucionAvanzadaForm';
import DashboardLayout from '../layouts/DashboardLayout';
import messages from '../../constants/messages';

interface PrestamosDashboardProps {
  rol: RolUsuario; // 'admin' o 'vocal'
  titulo?: string;
}

const PrestamosDashboard: React.FC<PrestamosDashboardProps> = ({ rol, titulo }) => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null);
  const [isLoading, setIsLoading] = useState(true);  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [contadorRetrasados, setContadorRetrasados] = useState(0);
  const [isLoadingContador, setIsLoadingContador] = useState(false);
  const [loadingRequestId, setLoadingRequestId] = useState<number | null>(null);
  const [isLoadingVerificacion, setIsLoadingVerificacion] = useState(false);
  const toast = useToast();

  // Modales y diálogos
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDevolucionOpen, onOpen: onDevolucionOpen, onClose: onDevolucionClose } = useDisclosure();
  // Cargar préstamos
  const cargarPrestamos = async () => {
    const requestId = Date.now();
    const mostrarSoloRetrasados = filtroEstado === 'retrasados';
    console.log(`🔄 [${requestId}] Iniciando carga de préstamos - mostrarSoloRetrasados: ${mostrarSoloRetrasados}, filtroEstado: ${filtroEstado}`);
    
    setIsLoading(true);
    
    try {
      let data: Prestamo[] = [];
      
      if (mostrarSoloRetrasados) {
        console.log(`📅 [${requestId}] Obteniendo préstamos vencidos...`);
        data = await obtenerPrestamosVencidos();
      } else {
        console.log(`📊 [${requestId}] Obteniendo préstamos con filtros normales...`);
        const filtros: any = {};
        if (filtroEstado) filtros.estado = filtroEstado;
        data = await listarPrestamos(filtros);
      }
      
      // Verificar si esta petición sigue siendo la actual (solo si hay una más nueva)
      if (loadingRequestId && loadingRequestId > requestId) {
        console.log(`🚫 [${requestId}] Petición obsoleta, hay una más nueva (${loadingRequestId})`);
        return;
      }
      
      // Filtrar por texto de búsqueda si hay algo
      let prestamosFiltrados = data;
      if (filtroBusqueda.trim()) {
        const busqueda = filtroBusqueda.toLowerCase();
        prestamosFiltrados = data.filter(
          p => p.nombreMaterial.toLowerCase().includes(busqueda) || 
               p.nombreUsuario.toLowerCase().includes(busqueda) ||
               (p.nombreActividad && p.nombreActividad.toLowerCase().includes(busqueda))
        );
        console.log(`🔍 [${requestId}] Filtrados por búsqueda: ${prestamosFiltrados.length} de ${data.length}`);
      }
        console.log(`✅ [${requestId}] Préstamos cargados exitosamente: ${prestamosFiltrados.length}`);
      setPrestamos(prestamosFiltrados);
    } catch (error) {
      console.error(`❌ [${requestId}] Error al cargar préstamos:`, error);
      
      // Solo mostrar error si esta es la petición actual
      if (loadingRequestId === requestId) {        // Intentar recovery: cargar sin filtros si hay filtro activo
        if (filtroEstado && filtroEstado !== 'retrasados') {
          console.log(`🔄 [${requestId}] Intentando recovery sin filtros...`);
          try {
            const dataRecovery = await listarPrestamos();
            if (loadingRequestId === requestId) {
              setPrestamos(dataRecovery);
              toast({
                title: "Préstamos cargados parcialmente",
                description: "Se cargaron todos los préstamos (filtro removido temporalmente)",
                status: 'warning',
                duration: 5000,
                isClosable: true,
              });
            }
            return;
          } catch (recoveryError) {
            console.error(`❌ [${requestId}] Recovery también falló:`, recoveryError);
          }
        }
        
        toast({
          title: messages.errors.general,
          description: messages.prestamos.errorCargar,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });      }
    } finally {      // Limpiar loading solo si esta es la petición actual o más nueva
      if (!loadingRequestId || loadingRequestId <= requestId) {
        setIsLoading(false);
        setLoadingRequestId(null);
      }
    }
  };

  // Cargar contador de retrasados independientemente con cache
  const cargarContadorRetrasados = async () => {
    const mostrarSoloRetrasados = filtroEstado === 'retrasados';
    if (mostrarSoloRetrasados || isLoadingContador) {
      console.log('⏭️ Saltando carga de contador: filtro activo o ya cargando');
      return;
    }
    
    // Cache simple para evitar llamadas múltiples
    const cacheKey = 'contador-retrasados';
    const cacheTime = sessionStorage.getItem(`${cacheKey}-time`);
    const cacheValue = sessionStorage.getItem(cacheKey);
    const now = Date.now();
    
    // Si tenemos cache válido (menos de 60 segundos), usar ese valor
    if (cacheTime && cacheValue && (now - parseInt(cacheTime)) < 60000) {
      console.log('📦 Usando contador desde cache');
      setContadorRetrasados(parseInt(cacheValue));
      return;
    }
    
    console.log('🔄 Cargando contador de retrasados...');
    setIsLoadingContador(true);
    try {
      const prestamosVencidos = await obtenerPrestamosVencidos();
      const count = prestamosVencidos.length;
      setContadorRetrasados(count);
      
      // Guardar en cache
      sessionStorage.setItem(cacheKey, count.toString());
      sessionStorage.setItem(`${cacheKey}-time`, now.toString());
      console.log(`✅ Contador actualizado: ${count} préstamos retrasados`);
    } catch (error) {
      console.error('❌ Error al cargar contador de retrasados:', error);
      setContadorRetrasados(0);
    } finally {
      setIsLoadingContador(false);
    }
  };

  // Manejar verificación automática de préstamos vencidos
  const handleVerificacionAutomatica = async () => {
    if (rol !== 'admin') {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden ejecutar esta función",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoadingVerificacion(true);
      
      console.log('🔍 Ejecutando verificación automática manual...');
      const resultado = await marcarPrestamosVencidosAutomaticamente();
      
      if (resultado.marcados > 0) {
        toast({
          title: "Verificación completada",
          description: `${resultado.marcados} préstamo(s) marcado(s) como "por devolver". Se procesaron ${resultado.procesados} actividad(es).`,
          status: "success",
          duration: 8000,
          isClosable: true,
        });
        
        // Recargar la lista de préstamos para mostrar los cambios
        cargarPrestamos();
        
      } else if (resultado.procesados === 0) {
        toast({
          title: "Sin actividades vencidas",
          description: "No se encontraron actividades finalizadas hace más de 7 días con préstamos activos",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Verificación completada",
          description: `Se procesaron ${resultado.procesados} actividad(es), pero no se encontraron préstamos que marcar`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
      
      if (resultado.errores > 0) {
        console.warn(`⚠️ Se produjeron ${resultado.errores} error(es) durante la verificación`);
      }
      
    } catch (error) {
      console.error('❌ Error en verificación automática:', error);
      toast({
        title: "Error en verificación",
        description: "No se pudo completar la verificación automática. Revisa la consola para más detalles.",
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsLoadingVerificacion(false);
    }
  };

  // Agrupar préstamos por actividad
  const agruparPrestamosPorActividad = (prestamos: Prestamo[]) => {
    const grupos: { [key: string]: { actividad: string | null; prestamos: Prestamo[] } } = {};
    
    prestamos.forEach(prestamo => {
      const actividadId = prestamo.actividadId || 'sin_actividad';
      const nombreActividad = prestamo.nombreActividad || 'Sin actividad asociada';
      
      if (!grupos[actividadId]) {
        grupos[actividadId] = {
          actividad: nombreActividad,
          prestamos: []
        };
      }
      
      grupos[actividadId].prestamos.push(prestamo);
    });
    
    return Object.values(grupos);
  };  // Efectos para cargar datos
  useEffect(() => {
    console.log('🔄 useEffect - Cargando préstamos por cambio en filtros');
    cargarPrestamos();
  }, [filtroEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('🔍 useEffect - Cargando préstamos por cambio en búsqueda');
    const timeoutId = setTimeout(() => {
      cargarPrestamos();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [filtroBusqueda]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Efecto separado para cargar contador de retrasados (solo al inicio)
  useEffect(() => {
    console.log('📊 useEffect - Programando carga de contador inicial');
    const timeoutId = setTimeout(() => {
      cargarContadorRetrasados();
    }, 2000); // Esperar 2 segundos después del montaje
    
    return () => clearTimeout(timeoutId);
  }, []); // Solo se ejecuta al montar el componente// Actualizar contador cuando se registra una devolución
  const actualizarContadorTrasDevolución = () => {
    // Limpiar cache del servicio
    limpiarCacheVencidos();
      // Limpiar cache del componente
    sessionStorage.removeItem('contador-retrasados');
    sessionStorage.removeItem('contador-retrasados-time');
    
    if (filtroEstado !== 'retrasados') {
      setTimeout(() => {
        cargarContadorRetrasados();
      }, 500);
    }
  };

  // Limpiar cache cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // No limpiar cache al desmontar para mantener performance
    };
    }, []);
  
  // Manejar éxito de devolución avanzada
  const handleDevolucionSuccess = () => {
    if (!prestamoSeleccionado) return;
    
    onDevolucionClose();
    cargarPrestamos();
    actualizarContadorTrasDevolución(); // Actualizar contador
    setPrestamoSeleccionado(null);
  };

  // Renderizar el estado del préstamo with un Badge colorido
  const renderEstadoBadge = (estado: EstadoPrestamo) => {
    let color = '';
    switch (estado) {
      case 'en_uso':
        color = 'blue';
        break;
      case 'devuelto':
        color = 'green';
        break;
      case 'pendiente':
        color = 'orange';
        break;
      case 'perdido':
        color = 'red';
        break;
      case 'estropeado':
        color = 'purple';
        break;
      default:
        color = 'gray';
    }
    
    return <Badge colorScheme={color}>{estado.replace('_', ' ')}</Badge>;
  };

  // Verificar si un préstamo está retrasado
  const estaRetrasado = (prestamo: Prestamo) => {
    if (prestamo.estado === 'devuelto') return false;
    
    const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Date ? 
      prestamo.fechaDevolucionPrevista : 
      (prestamo.fechaDevolucionPrevista as any).toDate();
    
    return fechaVencimiento < new Date();
  };
  // Calcular días de retraso
  const diasRetraso = (prestamo: Prestamo) => {
    if (!estaRetrasado(prestamo)) return 0;
    
    const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Date ? 
      prestamo.fechaDevolucionPrevista : 
      (prestamo.fechaDevolucionPrevista as any).toDate();
    
    const hoy = new Date();
    const diferenciaTiempo = Math.abs(hoy.getTime() - fechaVencimiento.getTime());
    return Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
  };
  // Obtener mensaje descriptivo del retraso
  const getMensajeRetraso = (dias: number) => {
    if (dias <= 3) return `${dias} día${dias !== 1 ? 's' : ''} retrasado`;
    if (dias <= 7) return `${dias} días retrasado`;
    if (dias <= 13) return `${dias} días retrasado ⚠️`;
    return `${dias} días retrasado 🚨`;
  };

  // Obtener color del badge según el nivel de retraso
  const getColorRetraso = (dias: number) => {
    if (dias <= 3) return 'orange';
    if (dias <= 7) return 'red';
    return 'red';
  };

  // Formatear fecha para mostrar
  const formatFecha = (fecha: Date | any) => {
    if (!fecha) return 'N/A';
    
    const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
    return format(fechaObj, 'dd/MM/yyyy', { locale: es });
  };
  return (
    <DashboardLayout title={titulo || messages.prestamos.tituloPagina}>      <Box py={5} px={3}>        <Flex justify="space-between" align="center" mb={6}>
          <HStack spacing={4}>
            <Button 
              leftIcon={<FiPlus />} 
              colorScheme={rol === 'admin' ? 'brand' : 'blue'}
              onClick={() => {
                setPrestamoSeleccionado(null);
                onFormOpen();
              }}
            >
              {messages.prestamos.nuevoPrestamo}
            </Button>

            {/* Botón de verificación automática - solo para admins */}
            {rol === 'admin' && (
              <Button
                leftIcon={<FiClock />}
                variant="outline"
                colorScheme="orange"
                size="sm"
                onClick={handleVerificacionAutomatica}
                isLoading={isLoadingVerificacion}
                loadingText="Verificando..."
              >
                Verificar Vencidos
              </Button>
            )}

            {/* Botón de acceso rápido a retrasados */}
            {contadorRetrasados > 0 && filtroEstado !== 'retrasados' && (
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={() => setFiltroEstado('retrasados')}
                leftIcon={<Text>⚠️</Text>}
              >
                {contadorRetrasados} Retrasado{contadorRetrasados !== 1 ? 's' : ''}
              </Button>
            )}
          </HStack>
            {/* Botón para volver a vista normal */}
          {filtroEstado === 'retrasados' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFiltroEstado('')}
            >
              Ver todos los préstamos
            </Button>
          )}
        </Flex>{/* Filtros */}
        <Flex 
          mb={6} 
          direction={{ base: 'column', md: 'row' }} 
          gap={4}
          align={{ base: 'stretch', md: 'flex-end' }}
        >
          <FormControl maxW={{ base: '100%', md: '200px' }}>
            <FormLabel>{messages.prestamos.filtroPorEstado}</FormLabel>            <Select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              placeholder={messages.prestamos.estadosTodos}
            >
              <option value="retrasados">Retrasados {contadorRetrasados > 0 ? `(${contadorRetrasados})` : ''}</option>
              <option value="en_uso">En uso</option>
              <option value="pendiente">Pendiente</option>
              <option value="devuelto">Devuelto</option>
              <option value="perdido">Perdido</option>
              <option value="estropeado">Estropeado</option>
            </Select></FormControl>

          <FormControl maxW={{ base: '100%', md: '300px' }}>
            <FormLabel>{messages.prestamos.buscar}</FormLabel>
            <Flex>
              <Input 
                placeholder="Buscar por material, usuario..." 
                value={filtroBusqueda} 
                onChange={(e) => setFiltroBusqueda(e.target.value)}
              />
              <IconButton 
                ml={2}
                aria-label={messages.prestamos.buscar}
                icon={<FiSearch />} 
                onClick={() => cargarPrestamos()}
              />
            </Flex>
          </FormControl>
        </Flex>        {/* Tabla de préstamos */}
        {isLoading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" />
          </Flex>        ) : prestamos.length === 0 ? (
          <Box textAlign="center" p={10}>            <Text fontSize="lg" mb={4}>
              {filtroEstado === 'retrasados' 
                ? "🎉 No hay préstamos retrasados" 
                : messages.prestamos.sinResultados
              }
            </Text>
            {/* Botón de debug solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {                  console.log('🔧 DEBUG: Estado actual del componente:', {
                    prestamos: prestamos.length,
                    filtroEstado,
                    filtroBusqueda,
                    isLoading,
                    contadorRetrasados
                  });
                  cargarPrestamos();
                }}
              >
                🔧 Debug: Reintentar carga
              </Button>
            )}
          </Box>
        ) : (
          <Box>            {/* Indicador de filtro activo */}
            {filtroEstado === 'retrasados' && (
              <Box mb={4} p={3} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                <Flex align="center">
                  <Text color="red.700" fontWeight="bold" mr={2}>
                    ⚠️ Mostrando solo préstamos retrasados
                  </Text>
                  <Badge colorScheme="red">
                    {prestamos.length} préstamo{prestamos.length !== 1 ? 's' : ''} retrasado{prestamos.length !== 1 ? 's' : ''}
                  </Badge>
                </Flex>
              </Box>
            )}
            
            {agruparPrestamosPorActividad(prestamos).map((grupo, index) => (
              <Box key={index} mb={8}>
                <Heading size="md" mb={2} p={2} bg="gray.50" borderRadius="md">
                  {grupo.actividad}
                </Heading>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Material
                        </Th>                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Usuario
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Resp. Actividad
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Resp. Material
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          F. Préstamo
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          F. Devolución
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Estado
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Cantidad
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Acciones
                        </Th>
                      </Tr>
                    </Thead>                    <Tbody>
                      {grupo.prestamos.map((prestamo) => {
                        const retrasado = estaRetrasado(prestamo);
                        const dias = retrasado ? diasRetraso(prestamo) : 0;
                        
                        return (
                          <Tr 
                            key={prestamo.id}
                            bg={retrasado ? 'red.50' : 'transparent'}
                            borderLeft={retrasado ? '4px solid' : 'none'}
                            borderLeftColor={retrasado ? 'red.500' : 'transparent'}
                          >                            <Td>
                              <Flex align="center">
                                {prestamo.nombreMaterial}
                                {retrasado && (
                                  <Badge ml={2} colorScheme={getColorRetraso(dias)} size="sm">
                                    {getMensajeRetraso(dias)}
                                  </Badge>
                                )}
                              </Flex>
                            </Td>
                            <Td>{prestamo.nombreUsuario}</Td>
                            <Td>
                              {prestamo.nombreResponsableActividad || 
                               (prestamo.responsableActividad ? 'Responsable asignado' : 'No asignado')}
                            </Td>
                            <Td>
                              {prestamo.nombreResponsableMaterial || 
                               (prestamo.responsableMaterial ? 'Responsable asignado' : 'No asignado')}
                            </Td>
                            <Td>{formatFecha(prestamo.fechaPrestamo)}</Td>
                            <Td>
                              <Flex align="center">
                                {prestamo.fechaDevolucion ? formatFecha(prestamo.fechaDevolucion) : formatFecha(prestamo.fechaDevolucionPrevista) + ' (prevista)'}
                                {retrasado && !prestamo.fechaDevolucion && (
                                  <Text ml={2} color="red.600" fontSize="sm" fontWeight="bold">
                                    ⚠️ RETRASADO
                                  </Text>
                                )}
                              </Flex>
                            </Td>
                            <Td>{renderEstadoBadge(prestamo.estado)}</Td>
                            <Td>{prestamo.cantidadPrestada}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  size="sm"
                                  aria-label={messages.prestamos.editar}
                                  icon={<FiEdit />}
                                  onClick={() => {
                                    setPrestamoSeleccionado(prestamo);
                                    onFormOpen();
                                  }}
                                />
                                {prestamo.estado !== 'devuelto' && (
                                  <IconButton
                                    size="sm"
                                    colorScheme="green"
                                    aria-label={messages.prestamos.registrarDevolucion}
                                    icon={<FiCheck />}
                                    onClick={() => {
                                      setPrestamoSeleccionado(prestamo);
                                      onDevolucionOpen();
                                    }}
                                  />
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Modal para crear/editar préstamo */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {prestamoSeleccionado ? messages.prestamos.editar : messages.prestamos.nuevo}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <PrestamoForm
              prestamo={prestamoSeleccionado || undefined}
              onSuccess={() => {
                onFormClose();
                cargarPrestamos();
              }}
              onCancel={onFormClose}
            />
          </ModalBody>
        </ModalContent>      </Modal>

      {/* Modal de devolución avanzada */}
      {prestamoSeleccionado && (
        <DevolucionAvanzadaForm
          isOpen={isDevolucionOpen}
          onClose={onDevolucionClose}
          prestamo={prestamoSeleccionado}
          onSuccess={handleDevolucionSuccess}
        />
      )}
    </DashboardLayout>
  );
};

export default PrestamosDashboard;
