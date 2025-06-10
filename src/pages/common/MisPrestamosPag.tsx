import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, 
  Button, Badge, useToast, AlertDialog,
  AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure, Flex,
  ButtonGroup, IconButton, Tooltip
} from '@chakra-ui/react';
import { FiCheckSquare, FiClock, FiUsers } from 'react-icons/fi';
import { listarPrestamosPorResponsabilidad, registrarDevolucion, marcarComoPorDevolver, marcarActividadComoPorDevolver } from '../../services/prestamoService';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Prestamo } from '../../types/prestamo';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';

const MisPrestamosPag: React.FC = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const { userProfile } = useAuth();
  const toast = useToast();
    // Cargar préstamos del usuario actual (incluyendo responsabilidades)
  useEffect(() => {
    const cargarMisPrestamos = async () => {
      if (!userProfile) return;
      
      try {
        setIsLoading(true);
        console.log('🔍 MisPrestamosPag - Cargando préstamos para usuario:', userProfile.uid);
        
        // Usar la nueva función que incluye préstamos por responsabilidad
        const misPrestamosActivos = await listarPrestamosPorResponsabilidad(userProfile.uid);
        
        console.log('✅ MisPrestamosPag - Préstamos cargados:', misPrestamosActivos.length);
        setPrestamos(misPrestamosActivos);
        
        // Mostrar toast informativo solo si hay préstamos
        if (misPrestamosActivos.length > 0) {
          toast({
            title: 'Préstamos cargados',
            description: `Se encontraron ${misPrestamosActivos.length} préstamo(s) activo(s)`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
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
    
    cargarMisPrestamos();  }, [userProfile, toast]);

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

  // Manejar marcar préstamo individual como "por devolver"
  const handleMarcarPorDevolver = async (prestamo: Prestamo) => {
    try {
      await marcarComoPorDevolver(prestamo.id as string, 'Marcado manualmente por el usuario');
      
      toast({
        title: 'Material marcado para devolución',
        description: `${prestamo.nombreMaterial} ha sido marcado como "por devolver"`,
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
      
      // Actualizar el estado del préstamo en la lista local
      setPrestamos(prestamos.map(p => 
        p.id === prestamo.id 
          ? { ...p, estado: 'por_devolver' as any }
          : p
      ));
      
    } catch (error) {
      console.error('Error al marcar préstamo como por devolver:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar el material para devolución. Intenta de nuevo.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Manejar marcar toda la actividad como "por devolver"
  const handleMarcarActividadPorDevolver = async (actividadId: string, nombreActividad: string) => {
    try {
      const prestamosActividad = prestamos.filter(p => p.actividadId === actividadId && p.estado === 'en_uso');
      
      if (prestamosActividad.length === 0) {
        toast({
          title: 'Sin préstamos activos',
          description: 'No hay materiales activos en esta actividad para marcar.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const count = await marcarActividadComoPorDevolver(actividadId, `Actividad "${nombreActividad}" marcada como finalizada`);
      
      toast({
        title: 'Actividad marcada para devolución',
        description: `${count} material(es) de "${nombreActividad}" marcados como "por devolver"`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Actualizar los estados en la lista local
      setPrestamos(prestamos.map(p => 
        p.actividadId === actividadId && p.estado === 'en_uso'
          ? { ...p, estado: 'por_devolver' as any }
          : p
      ));
      
    } catch (error) {
      console.error('Error al marcar actividad como por devolver:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar la actividad para devolución. Intenta de nuevo.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Manejar la solicitud de devolución
  const handleSolicitarDevolucion = (prestamo: Prestamo) => {
    setPrestamoSeleccionado(prestamo);
    onOpen();
  };

  // Confirmar devolución
  const confirmarDevolucion = async () => {
    if (!prestamoSeleccionado) return;
    
    try {
      await registrarDevolucion(prestamoSeleccionado.id as string);
      
      toast({
        title: messages.prestamos.devolucionRegistrada,
        description: `Has registrado la devolución de ${prestamoSeleccionado.nombreMaterial}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Actualizar lista de préstamos
      setPrestamos(prestamos.filter(p => p.id !== prestamoSeleccionado.id));
      onClose();
    } catch (error) {
      console.error('Error al registrar devolución:', error);
      toast({
        title: messages.prestamos.errorDevolucion,
        description: messages.prestamos.errorDevolucionDesc,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
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
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">
            Mis Préstamos Activos ({prestamos.length})
          </Heading>
          
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
                          )}
                          
                          {/* Botón para marcar toda la actividad como "por devolver" */}
                          {materialesActivos.length > 0 && grupo.actividad !== 'Préstamos individuales' && (
                            <Tooltip label={`Marcar todos los ${materialesActivos.length} materiales de esta actividad como "por devolver"`}>
                              <IconButton
                                size="sm"
                                colorScheme="orange"
                                variant="outline"
                                icon={<FiUsers />}
                                onClick={() => handleMarcarActividadPorDevolver(grupo.prestamos[0]?.actividadId!, grupo.actividad)}
                                aria-label="Marcar actividad como por devolver"
                              />
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
                          
                          {/* Botón secundario: Marcar como "por devolver" (solo si está en uso) */}
                          {prestamo.estado === 'en_uso' && (
                            <Tooltip label="Marcar como 'por devolver' - útil cuando la actividad ha terminado pero aún no has devuelto el material">
                              <IconButton
                                colorScheme="orange"
                                variant="outline"
                                icon={<FiClock />}
                                onClick={() => handleMarcarPorDevolver(prestamo)}
                                aria-label="Marcar como por devolver"
                              />
                            </Tooltip>
                          )}
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ))
        )}
      </Box>

      {/* Diálogo de confirmación */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar devolución
            </AlertDialogHeader>            <AlertDialogBody>
              {prestamoSeleccionado && esActividadFinalizadaConMaterialPendiente(prestamoSeleccionado) ? (
                <Box>
                  <Box color="red.600" fontWeight="bold" mb={2}>
                    ⚠️ DEVOLUCIÓN URGENTE REQUERIDA
                  </Box>
                  <Box mb={2}>
                    La actividad <strong>{prestamoSeleccionado.nombreActividad}</strong> ya ha finalizado hace{' '}
                    <strong>{calcularDiasRetraso(prestamoSeleccionado)} día(s)</strong>.
                  </Box>
                  <Box>
                    ¿Confirmas la devolución del material <strong>{prestamoSeleccionado.nombreMaterial}</strong>? 
                    Esta acción notificará a los responsables para que revisen el material.
                  </Box>
                </Box>
              ) : (
                <>
                  ¿Estás seguro de que quieres registrar la devolución de este material? 
                  Esta acción notificará a los responsables para que revisen el material.
                </>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="green" onClick={confirmarDevolucion} ml={3}>
                Confirmar devolución
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default MisPrestamosPag;