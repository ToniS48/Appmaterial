import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  IconButton,
  Button,
  ButtonGroup,
  useDisclosure,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { FiCheck, FiUsers, FiRefreshCw, FiCheckSquare } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { 
  listarPrestamosPorResponsabilidad, 
  registrarDevolucion,
  devolverTodosLosMaterialesActividad
} from '../../services/prestamoService';
import { Prestamo } from '../../types/prestamo';
import { formatFecha } from '../../utils/dateUtils';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import messages from '../../constants/messages';
import DevolucionAvanzadaForm from '../../components/prestamos/DevolucionAvanzadaForm';
import DevolucionBulkForm from '../../components/prestamos/DevolucionBulkForm';

const MisPrestamosPag: React.FC = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<{prestamos: Prestamo[]; nombre: string} | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();
  const { userProfile } = useAuth();
  const toast = useToast();

  // Función de diagnóstico temporal
  const ejecutarDiagnostico = async () => {
    if (!userProfile) return;
    
    console.log('🔧 === DIAGNÓSTICO MANUAL DESDE COMPONENTE ===');
    console.log('👤 Usuario:', userProfile.uid);
    console.log('📧 Email:', userProfile.email);
    
    try {
      // Probar la función paso a paso
      console.log('🔍 Ejecutando listarPrestamosPorResponsabilidad...');
      const result = await listarPrestamosPorResponsabilidad(userProfile.uid);
      console.log('📊 Resultado:', result.length, 'préstamos');
      
      if (result.length === 0) {
        console.log('⚠️ NO HAY RESULTADOS - Verificando datos directamente...');
        
        // Probar consulta directa
        const { listarPrestamos } = await import('../../services/prestamoService');
        const prestamosDirectos = await listarPrestamos({ usuarioId: userProfile.uid });
        console.log('📋 Préstamos directos:', prestamosDirectos.length);
        
        // Mostrar todos los préstamos del sistema relacionados con el usuario
        const todosPrestamos = await listarPrestamos();
        const relacionados = todosPrestamos.filter(p => 
          p.usuarioId === userProfile.uid || 
          p.responsableActividad === userProfile.uid || 
          p.responsableMaterial === userProfile.uid
        );
        console.log('📋 Préstamos relacionados contigo:', relacionados.length);
        relacionados.forEach(p => {
          let roles = [];
          if (p.usuarioId === userProfile.uid) roles.push('Usuario');
          if (p.responsableActividad === userProfile.uid) roles.push('Resp.Actividad');
          if (p.responsableMaterial === userProfile.uid) roles.push('Resp.Material');
          console.log(`   - ${p.nombreMaterial} (${p.estado}) - Roles: ${roles.join(', ')}`);
        });
      }
      
      // Actualizar estado del componente
      setPrestamos(result);
      console.log('✅ Estado del componente actualizado');
      
    } catch (error) {      console.error('❌ Error en diagnóstico:', error);
    }
  };

  // Función para cargar préstamos del usuario actual (incluyendo responsabilidades)
  const cargarMisPrestamos = async () => {
    if (!userProfile) return;
    
    try {
      setIsLoading(true);
      console.log('🔍 MisPrestamosPag - Cargando préstamos para usuario:', userProfile.uid);
      
      // Usar la nueva función que incluye préstamos por responsabilidad
      const misPrestamosActivos = await listarPrestamosPorResponsabilidad(userProfile.uid);
      
      console.log('✅ MisPrestamosPag - Préstamos cargados:', misPrestamosActivos.length);
      setPrestamos(misPrestamosActivos);

      // Verificar si hay préstamos marcados automáticamente recientemente
      const prestamosRecienMarcados = misPrestamosActivos.filter(prestamo => 
        prestamo.estado === 'por_devolver' && 
        (prestamo as any).marcadoAutomaticamente === true &&
        (prestamo as any).fechaMarcadoAutomatico
      );

      if (prestamosRecienMarcados.length > 0) {
        // Verificar si el marcado fue reciente (últimas 24 horas)
        const prestamosRecientes = prestamosRecienMarcados.filter(prestamo => {
          const fechaMarcado = (prestamo as any).fechaMarcadoAutomatico?.toDate?.() || 
                               (prestamo as any).fechaMarcadoAutomatico;
          if (!fechaMarcado) return false;
          
          const hace24Horas = new Date();
          hace24Horas.setHours(hace24Horas.getHours() - 24);
          
          return fechaMarcado > hace24Horas;
        });

        if (prestamosRecientes.length > 0) {
          toast({
            title: "⏰ Préstamos marcados automáticamente",
            description: `${prestamosRecientes.length} préstamo(s) han sido marcados como "por devolver" porque su actividad finalizó hace más de una semana`,
            status: "warning",
            duration: 10000,
            isClosable: true,
          });
        }
      }
      
      // Mostrar toast informativo solo si hay préstamos
      if (misPrestamosActivos.length > 0) {
        toast({
          title: 'Préstamos cargados',
          description: `Se encontraron ${misPrestamosActivos.length} préstamo(s) activo(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Diagnóstico adicional cuando no hay resultados
        console.log('⚠️ MisPrestamosPag - No se encontraron préstamos activos');
        console.log('🔍 Ejecutando diagnóstico adicional...');
        
        // Verificar si hay préstamos en otros estados
        try {
          const { listarPrestamos } = await import('../../services/prestamoService');
          const todosPrestamosUsuario = await listarPrestamos({ usuarioId: userProfile.uid });
          
          if (todosPrestamosUsuario.length > 0) {
            const estadosPrestamos = todosPrestamosUsuario.reduce((acc, p) => {
              acc[p.estado] = (acc[p.estado] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            console.log('📊 Estados de préstamos del usuario:', estadosPrestamos);
            
            toast({
              title: 'Información de préstamos',
              description: `Tienes ${todosPrestamosUsuario.length} préstamo(s) total(es), pero ninguno en estado activo`,
              status: 'info',
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (diagnosticError) {
          console.warn('⚠️ Error en diagnóstico adicional:', diagnosticError);
        }
      }
      
    } catch (error) {
      console.error('❌ MisPrestamosPag - Error al cargar préstamos:', error);
      
      // Mostrar error más detallado según el tipo
      let errorMessage = 'No se pudieron cargar tus préstamos. Intenta nuevamente.';
      let errorTitle = 'Error de carga';
      
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'No tienes permisos para acceder a esta información.';
          errorTitle = 'Permisos insuficientes';
        } else if (error.message.includes('failed-precondition')) {
          errorMessage = 'Hay un problema de configuración en la base de datos. Contacta al administrador.';
          errorTitle = 'Error de configuración';
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'El servicio no está disponible temporalmente. Intenta en unos minutos.';
          errorTitle = 'Servicio no disponible';
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // En caso de error crítico, al menos mostrar una lista vacía en lugar de bloquear
      setPrestamos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar préstamos cuando el componente se monta o cambia el usuario
  useEffect(() => {
    cargarMisPrestamos();}, [userProfile, toast]);

  // Agrupar préstamos por actividad
  const agruparPrestamosPorActividad = (prestamos: Prestamo[]) => {
    const grupos: { [key: string]: { actividad: string; prestamos: Prestamo[] } } = {};
    
    prestamos.forEach(prestamo => {
      const actividadId = prestamo.actividadId || 'sin_actividad';
      const nombreActividad = prestamo.nombreActividad || 'Préstamos individuales';
      
      if (!grupos[actividadId]) {
        grupos[actividadId] = {
          actividad: nombreActividad,
          prestamos: []
        };
      }
      
      grupos[actividadId].prestamos.push(prestamo);
    });
    
    return Object.values(grupos);
  };

  // Determinar el rol del usuario en el préstamo
  const obtenerRolUsuario = (prestamo: Prestamo): string => {
    if (!userProfile) return 'Desconocido';
    
    const userId = userProfile.uid;
    
    // Verificar si es el usuario directo del préstamo
    if (prestamo.usuarioId === userId) {
      return 'Usuario directo';
    }
    
    // Verificar si es responsable de actividad
    if (prestamo.responsableActividad === userId) {
      return 'Resp. Actividad';
    }
    
    // Verificar si es responsable de material
    if (prestamo.responsableMaterial === userId) {
      return 'Resp. Material';
    }
    
    return 'Relacionado';
  };
  // Función optimizada para verificar si la actividad ha finalizado pero el material no se ha devuelto
  const esActividadFinalizadaConMaterialPendiente = (prestamo: Prestamo): boolean => {
    // Solo aplica para préstamos relacionados con actividades
    if (!prestamo.actividadId) {
      return false;
    }
    
    // Verificar si el préstamo sigue activo (no devuelto)
    if (prestamo.estado !== 'en_uso') {
      return false;
    }
    
    // Si tenemos fechaFinActividad, usar ese campo optimizado
    if (prestamo.fechaFinActividad) {
      const fechaFinActividad = prestamo.fechaFinActividad instanceof Date 
        ? prestamo.fechaFinActividad 
        : prestamo.fechaFinActividad.toDate();
      
      const ahora = new Date();
      return fechaFinActividad < ahora;
    }
    
    // Fallback: usar fechaDevolucionPrevista como antes (para compatibilidad)
    if (prestamo.fechaDevolucionPrevista) {
      const fechaDevolucionPrevista = prestamo.fechaDevolucionPrevista instanceof Date 
        ? prestamo.fechaDevolucionPrevista 
        : prestamo.fechaDevolucionPrevista.toDate();
      
      const ahora = new Date();
      return fechaDevolucionPrevista < ahora;
    }
    
    return false;
  };

  // Calcular días de retraso en la devolución (optimizada)
  const calcularDiasRetraso = (prestamo: Prestamo): number => {
    if (!esActividadFinalizadaConMaterialPendiente(prestamo)) {
      return 0;
    }
    
    // Priorizar fechaFinActividad si está disponible
    let fechaReferencia: Date;
    
    if (prestamo.fechaFinActividad) {
      fechaReferencia = prestamo.fechaFinActividad instanceof Date 
        ? prestamo.fechaFinActividad 
        : prestamo.fechaFinActividad.toDate();
    } else if (prestamo.fechaDevolucionPrevista) {
      fechaReferencia = prestamo.fechaDevolucionPrevista instanceof Date 
        ? prestamo.fechaDevolucionPrevista 
        : prestamo.fechaDevolucionPrevista.toDate();
    } else {
      return 0;
    }
    
    const ahora = new Date();
    const diferenciaMilisegundos = ahora.getTime() - fechaReferencia.getTime();
    return Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
  };
  // Manejar la solicitud de devolución
  const handleSolicitarDevolucion = (prestamo: Prestamo) => {
    setPrestamoSeleccionado(prestamo);
    onOpen();
  };  // Manejar devolución de toda la actividad
  const handleDevolverTodaActividad = async (actividadId: string, nombreActividad: string) => {
    // Obtener todos los préstamos de la actividad
    const prestamosActividad = prestamos.filter(p => p.actividadId === actividadId);
    const prestamosActivos = prestamosActividad.filter(p => p.estado === 'en_uso' || p.estado === 'por_devolver');

    if (prestamosActivos.length === 0) {
      toast({
        title: 'Sin materiales para devolver',
        description: `No se encontraron materiales activos para devolver en la actividad "${nombreActividad}"`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Configurar datos para el modal de devolución en bulk
    setActividadSeleccionada({
      prestamos: prestamosActivos,
      nombre: nombreActividad
    });
    
    // Abrir modal de devolución en bulk
    onBulkOpen();
  };  // Manejar éxito de devolución avanzada
  const handleDevolucionSuccess = () => {
    if (!prestamoSeleccionado) return;
    
    // Actualizar lista de préstamos removiendo el devuelto
    setPrestamos(prestamos.filter(p => p.id !== prestamoSeleccionado.id));
    setPrestamoSeleccionado(null);
  };

  // Manejar éxito de devolución en bulk
  const handleDevolucionBulkSuccess = async () => {
    // Recargar todos los préstamos para reflejar los cambios
    await cargarMisPrestamos();
    setActividadSeleccionada(null);
  };

  // Renderizar estado del préstamo
  const renderEstado = (estado: string) => {
    let colorScheme = '';
    switch (estado) {
      case 'en_uso':
        colorScheme = 'green';
        break;
      case 'pendiente':
        colorScheme = 'yellow';
        break;
      case 'por_devolver':
        colorScheme = 'orange';
        break;
      case 'devuelto':
        colorScheme = 'gray';
        break;
      case 'perdido':
        colorScheme = 'red';
        break;
      default:
        colorScheme = 'blue';
    }
    return <Badge colorScheme={colorScheme}>{estado.replace('_', ' ')}</Badge>;
  };
  if (isLoading) {
    return (
      <DashboardLayout title="Mis Préstamos">
        <Box p={5} textAlign="center">
          <Box mb={3}>
            <Heading size="md" color="blue.500">
              Cargando préstamos...
            </Heading>
          </Box>
          <Box fontSize="sm" color="gray.500">
            Buscando préstamos directos y por responsabilidad de actividad/material
          </Box>
        </Box>
      </DashboardLayout>
    );
  }
  return (    <DashboardLayout title="Mis Préstamos">
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">
            Mis Préstamos Activos ({prestamos.length})
          </Heading>
          
          {/* Botón de diagnóstico temporal para debugging */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              size="sm"
              colorScheme="orange"
              variant="outline"
              leftIcon={<FiRefreshCw />}
              onClick={async () => {
                if (!userProfile) return;
                
                console.log('🔧 === DIAGNÓSTICO MANUAL DESDE COMPONENTE ===');
                console.log('👤 Usuario:', userProfile.uid);
                
                try {
                  const result = await listarPrestamosPorResponsabilidad(userProfile.uid);
                  console.log('📊 Resultado:', result.length, 'préstamos');
                  setPrestamos(result);
                  
                  toast({
                    title: 'Diagnóstico ejecutado',
                    description: `Encontrados ${result.length} préstamos. Ver consola para detalles.`,
                    status: result.length > 0 ? 'success' : 'warning',
                    duration: 3000,
                    isClosable: true,
                  });
                } catch (error) {
                  console.error('❌ Error en diagnóstico:', error);
                  toast({
                    title: 'Error en diagnóstico',
                    description: 'Ver consola para detalles del error',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                }
              }}
            >
              🔧 Debug
            </Button>
          )}
          
          {/* Resumen de materiales con retraso */}
          {(() => {
            const materialesConRetraso = prestamos.filter(p => esActividadFinalizadaConMaterialPendiente(p));
            if (materialesConRetraso.length > 0) {
              return (
                <Box textAlign="right">
                  <Badge colorScheme="red" size="lg" p={2}>
                    ⚠️ {materialesConRetraso.length} material(es) con actividad finalizada
                  </Badge>
                  <Box fontSize="xs" color="red.500" mt={1}>
                    Requieren devolución urgente
                  </Box>
                </Box>
              );
            }
            return null;
          })()}
        </Flex>
        
        {prestamos.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Heading size="sm" color="gray.500" mb={2}>
              No tienes préstamos activos
            </Heading>
            <Box fontSize="sm" color="gray.400">
              Los préstamos aparecen aquí cuando eres el usuario directo o responsable de la actividad/material
            </Box>
          </Box>
        ) : (          agruparPrestamosPorActividad(prestamos).map((grupo, grupoIndex) => (
            <Box key={grupoIndex} mb={6}>
              {/* Encabezado del grupo de actividad */}
              <Box 
                bg="gray.50" 
                p={3} 
                borderRadius="md" 
                mb={3}
                borderLeft="4px solid"
                borderLeftColor="blue.400"
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="sm" color="gray.700">
                      {grupo.actividad}
                    </Heading>
                    <Box fontSize="xs" color="gray.500" mt={1}>
                      {grupo.prestamos.length} material(es) prestado(s)
                    </Box>
                  </Box>
                    {/* Indicador de materiales con retraso + Botón para marcar actividad */}
                  <Flex align="center" gap={2}>
                    {(() => {
                      const materialesConRetraso = grupo.prestamos.filter(p => esActividadFinalizadaConMaterialPendiente(p));
                      const materialesActivos = grupo.prestamos.filter(p => p.estado === 'en_uso');
                      
                      return (
                        <Flex align="center" gap={2}>
                          {materialesConRetraso.length > 0 && (
                            <Badge colorScheme="red" size="sm">
                              ⚠️ {materialesConRetraso.length} material(es) retrasado(s)
                            </Badge>
                          )}                            {/* Botón para devolver toda la actividad */}
                          {materialesActivos.length > 0 && grupo.actividad !== 'Préstamos individuales' && (
                            <Tooltip label={`Abrir formulario para devolver todos los ${materialesActivos.length} materiales de esta actividad con observaciones e incidencias`}>
                              <Button
                                size="sm"
                                colorScheme="green"
                                variant="outline"
                                leftIcon={<FiUsers />}
                                onClick={() => handleDevolverTodaActividad(grupo.prestamos[0]?.actividadId!, grupo.actividad)}
                              >
                                Devolver todo ({materialesActivos.length})
                              </Button>
                            </Tooltip>
                          )}
                        </Flex>
                      );
                    })()}
                  </Flex>
                </Flex>
              </Box>{/* Tabla de préstamos para esta actividad */}
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Material</Th>
                    <Th>Mi Rol</Th>
                    <Th>Fecha préstamo</Th>
                    <Th>Fecha devolución prevista</Th>
                    <Th>Estado Actividad</Th>
                    <Th>Estado</Th>
                    <Th>Cantidad</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>                  {grupo.prestamos.map(prestamo => (
                    <Tr key={prestamo.id}>
                      <Td fontWeight="medium">{prestamo.nombreMaterial}</Td>
                      <Td>
                        <Badge 
                          colorScheme={
                            obtenerRolUsuario(prestamo) === 'Usuario directo' ? 'blue' :
                            obtenerRolUsuario(prestamo) === 'Resp. Actividad' ? 'purple' :
                            obtenerRolUsuario(prestamo) === 'Resp. Material' ? 'orange' : 'gray'
                          }
                          size="sm"
                        >
                          {obtenerRolUsuario(prestamo)}
                        </Badge>
                      </Td>
                      <Td>
                        {prestamo.fechaPrestamo instanceof Date ? 
                          prestamo.fechaPrestamo.toLocaleDateString() : 
                          prestamo.fechaPrestamo.toDate().toLocaleDateString()}
                      </Td>
                      <Td>
                        {prestamo.fechaDevolucionPrevista instanceof Date ? 
                          prestamo.fechaDevolucionPrevista.toLocaleDateString() : 
                          prestamo.fechaDevolucionPrevista.toDate().toLocaleDateString()}
                      </Td>
                      <Td>
                        {esActividadFinalizadaConMaterialPendiente(prestamo) ? (
                          <Box>
                            <Badge colorScheme="red" size="sm" mb={1}>
                              ⚠️ Actividad Finalizada
                            </Badge>
                            <Box fontSize="xs" color="red.500">
                              Retraso: {calcularDiasRetraso(prestamo)} día(s)
                            </Box>
                          </Box>
                        ) : prestamo.actividadId ? (
                          <Badge colorScheme="green" size="sm">
                            ✅ En curso
                          </Badge>
                        ) : (
                          <Badge colorScheme="gray" size="sm">
                            Sin actividad
                          </Badge>
                        )}
                      </Td>
                      <Td>{renderEstado(prestamo.estado)}</Td>
                      <Td>{prestamo.cantidadPrestada}</Td>                      <Td>
                        <ButtonGroup size="xs" spacing={1}>
                          {/* Botón principal: Devolver */}
                          <Button
                            colorScheme={esActividadFinalizadaConMaterialPendiente(prestamo) ? "red" : "green"}
                            leftIcon={<FiCheckSquare />}
                            onClick={() => handleSolicitarDevolucion(prestamo)}
                            variant={esActividadFinalizadaConMaterialPendiente(prestamo) ? "solid" : "outline"}
                          >
                            {esActividadFinalizadaConMaterialPendiente(prestamo) ? "Devolver YA" : "Devolver"}
                          </Button>
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ))
        )}      </Box>      {/* Modal de devolución avanzada */}
      {prestamoSeleccionado && (
        <DevolucionAvanzadaForm
          isOpen={isOpen}
          onClose={onClose}
          prestamo={prestamoSeleccionado}
          onSuccess={handleDevolucionSuccess}
        />
      )}

      {/* Modal de devolución en bulk */}
      {actividadSeleccionada && (
        <DevolucionBulkForm
          isOpen={isBulkOpen}
          onClose={onBulkClose}
          prestamos={actividadSeleccionada.prestamos}
          actividadNombre={actividadSeleccionada.nombre}
          onSuccess={handleDevolucionBulkSuccess}
        />
      )}
    </DashboardLayout>
  );
};

export default MisPrestamosPag;