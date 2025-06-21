import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  Progress,
  HStack,
  Checkbox
} from '@chakra-ui/react';
import { FiTool, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';
import { listarUsuarios, actualizarUsuario } from '../../services/usuarioService';
import { Usuario } from '../../types/usuario';
import { EstadoAprobacion, EstadoActividad } from '../../types/usuarioHistorial';
import { usuarioHistorialService } from '../../services/domain/UsuarioHistorialService';

interface UsuarioInconsistente {
  usuario: Usuario;
  problemas: string[];
  reparacionesPropuestas: {
    campo: string;
    valorActual: any;
    valorPropuesto: any;
    razon: string;
  }[];
  prioridad: 'alta' | 'media' | 'baja';
}

interface EstadisticasReparacion {
  totalUsuarios: number;
  usuariosConProblemas: number;
  usuariosSinEstadoAprobacion: number;
  usuariosSinEstadoActividad: number;
  usuariosSinFechaCreacion: number;
  usuariosSinFechaRegistro: number;
  usuariosConCampoActivoLegacy: number;
  reparacionesNecesarias: number;
}

const ReparacionUsuariosDesactualizados: React.FC = () => {
  const [analisis, setAnalisis] = useState<{
    usuariosInconsistentes: UsuarioInconsistente[];
    estadisticas: EstadisticasReparacion;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Set<string>>(new Set());
  const [reparacionCompleta, setReparacionCompleta] = useState(false);
  const toast = useToast();

  const analizarInconsistencias = async () => {
    setIsAnalyzing(true);
    try {
      console.log('🔍 Iniciando análisis de inconsistencias en usuarios...');
      
      const usuarios = await listarUsuarios();
      console.log(`📊 Analizando ${usuarios.length} usuarios`);
      
      const usuariosInconsistentes: UsuarioInconsistente[] = [];
      const estadisticas: EstadisticasReparacion = {
        totalUsuarios: usuarios.length,
        usuariosConProblemas: 0,
        usuariosSinEstadoAprobacion: 0,
        usuariosSinEstadoActividad: 0,
        usuariosSinFechaCreacion: 0,
        usuariosSinFechaRegistro: 0,
        usuariosConCampoActivoLegacy: 0,
        reparacionesNecesarias: 0
      };
      
      for (const usuario of usuarios) {
        const problemas: string[] = [];
        const reparacionesPropuestas: UsuarioInconsistente['reparacionesPropuestas'] = [];
        let prioridad: 'alta' | 'media' | 'baja' = 'baja';
        
        // Verificar estado de aprobación
        if (!usuario.estadoAprobacion) {
          estadisticas.usuariosSinEstadoAprobacion++;
          problemas.push('Sin campo estadoAprobacion');
          
          // Proponer valor basado en email verificado o fecha de creación
          const estadoPropuesto = usuario.pendienteVerificacion === false 
            ? EstadoAprobacion.APROBADO 
            : EstadoAprobacion.PENDIENTE;
          
          reparacionesPropuestas.push({
            campo: 'estadoAprobacion',
            valorActual: undefined,
            valorPropuesto: estadoPropuesto,
            razon: usuario.pendienteVerificacion === false 
              ? 'Usuario tiene verificación completada' 
              : 'Usuario pendiente de verificación'
          });
          prioridad = 'alta';
        }
        
        // Verificar estado de actividad
        if (!usuario.estadoActividad) {
          estadisticas.usuariosSinEstadoActividad++;
          problemas.push('Sin campo estadoActividad');
          
          // Calcular estado de actividad basado en participación
          try {
            const estadoCalculado = await usuarioHistorialService.calcularEstadoActividad(usuario.uid);
            reparacionesPropuestas.push({
              campo: 'estadoActividad',
              valorActual: undefined,
              valorPropuesto: estadoCalculado,
              razon: `Calculado basado en participación en actividades`
            });
          } catch (error) {
            reparacionesPropuestas.push({
              campo: 'estadoActividad',
              valorActual: undefined,
              valorPropuesto: EstadoActividad.INACTIVO,
              razon: 'Por defecto (error al calcular actividad)'
            });
          }
          prioridad = 'alta';
        }
        
        // Verificar fecha de creación
        if (!usuario.fechaCreacion) {
          estadisticas.usuariosSinFechaCreacion++;
          problemas.push('Sin campo fechaCreacion');
          
          // Usar fechaRegistro si existe, si no, fecha actual
          const fechaPropuesta = usuario.fechaRegistro || new Date();
          reparacionesPropuestas.push({
            campo: 'fechaCreacion',
            valorActual: undefined,
            valorPropuesto: fechaPropuesta,
            razon: usuario.fechaRegistro 
              ? 'Usar fechaRegistro existente' 
              : 'Fecha actual como fallback'
          });
          prioridad = prioridad === 'baja' ? 'media' : prioridad;
        }
        
        // Verificar fecha de registro
        if (!usuario.fechaRegistro) {
          estadisticas.usuariosSinFechaRegistro++;
          problemas.push('Sin campo fechaRegistro');
          
          const fechaPropuesta = usuario.fechaCreacion || new Date();
          reparacionesPropuestas.push({
            campo: 'fechaRegistro',
            valorActual: undefined,
            valorPropuesto: fechaPropuesta,
            razon: usuario.fechaCreacion 
              ? 'Usar fechaCreacion existente' 
              : 'Fecha actual como fallback'
          });
          prioridad = prioridad === 'baja' ? 'media' : prioridad;
        }
        
        // Verificar campo activo legacy (debe eliminarse)
        const activoLegacy = (usuario as any).activo;
        if (activoLegacy !== undefined) {
          estadisticas.usuariosConCampoActivoLegacy++;
          problemas.push('Tiene campo activo legacy que debe eliminarse');
          
          reparacionesPropuestas.push({
            campo: 'activo',
            valorActual: activoLegacy,
            valorPropuesto: 'ELIMINAR',
            razon: 'Campo legacy obsoleto, usar estadoAprobacion + estadoActividad'
          });
          prioridad = prioridad === 'baja' ? 'media' : prioridad;
        }
        
        // Verificar inconsistencias entre estados
        if (usuario.estadoAprobacion && usuario.estadoActividad) {
          // Si está aprobado pero inactivo desde hace mucho, puede ser normal
          // Si está activo pero no aprobado, es problema
          if (usuario.estadoActividad === EstadoActividad.ACTIVO && 
              usuario.estadoAprobacion !== EstadoAprobacion.APROBADO) {
            problemas.push('Usuario activo pero no aprobado');
            reparacionesPropuestas.push({
              campo: 'estadoAprobacion',
              valorActual: usuario.estadoAprobacion,
              valorPropuesto: EstadoAprobacion.APROBADO,
              razon: 'Usuario activo debe estar aprobado'
            });
            prioridad = 'alta';
          }
        }
        
        // Verificar campo eliminado
        if (usuario.eliminado === undefined) {
          problemas.push('Sin campo eliminado');
          reparacionesPropuestas.push({
            campo: 'eliminado',
            valorActual: undefined,
            valorPropuesto: false,
            razon: 'Campo requerido para control de usuarios eliminados'
          });
        }
        
        // Verificar campo pendienteVerificacion
        if (usuario.pendienteVerificacion === undefined) {
          problemas.push('Sin campo pendienteVerificacion');
          reparacionesPropuestas.push({
            campo: 'pendienteVerificacion',
            valorActual: undefined,
            valorPropuesto: usuario.estadoAprobacion !== EstadoAprobacion.APROBADO,
            razon: 'Derivado del estado de aprobación'
          });
        }
        
        if (problemas.length > 0) {
          estadisticas.usuariosConProblemas++;
          estadisticas.reparacionesNecesarias += reparacionesPropuestas.length;
          
          usuariosInconsistentes.push({
            usuario,
            problemas,
            reparacionesPropuestas,
            prioridad
          });
        }
        
        // Log para primeros usuarios
        if (usuarios.indexOf(usuario) < 3) {
          console.log(`\n📧 ${usuario.email}:`);
          console.log(`   • Problemas: ${problemas.length}`);
          console.log(`   • Reparaciones: ${reparacionesPropuestas.length}`);
          console.log(`   • Prioridad: ${prioridad}`);
        }
      }
      
      // Ordenar por prioridad
      usuariosInconsistentes.sort((a, b) => {
        const prioridadOrden = { alta: 3, media: 2, baja: 1 };
        return prioridadOrden[b.prioridad] - prioridadOrden[a.prioridad];
      });
      
      setAnalisis({ usuariosInconsistentes, estadisticas });
      
      console.log('📋 Análisis completado:', estadisticas);
      
      toast({
        title: 'Análisis completado',
        description: `Se encontraron ${estadisticas.usuariosConProblemas} usuarios con inconsistencias de ${estadisticas.totalUsuarios} total`,
        status: estadisticas.usuariosConProblemas > 0 ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('❌ Error en análisis:', error);
      toast({
        title: 'Error en análisis',
        description: 'No se pudo completar el análisis de inconsistencias',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleUsuarioSeleccionado = (uid: string) => {
    const nuevaSeleccion = new Set(usuariosSeleccionados);
    if (nuevaSeleccion.has(uid)) {
      nuevaSeleccion.delete(uid);
    } else {
      nuevaSeleccion.add(uid);
    }
    setUsuariosSeleccionados(nuevaSeleccion);
  };

  const seleccionarTodos = () => {
    if (!analisis) return;
    const todosLosUids = new Set(analisis.usuariosInconsistentes.map(item => item.usuario.uid));
    setUsuariosSeleccionados(todosLosUids);
  };

  const limpiarSeleccion = () => {
    setUsuariosSeleccionados(new Set());
  };

  const repararUsuariosSeleccionados = async () => {
    if (!analisis || usuariosSeleccionados.size === 0) {
      toast({
        title: 'No hay usuarios seleccionados',
        description: 'Selecciona al menos un usuario para reparar',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsRepairing(true);
    try {
      console.log(`🔧 Iniciando reparación de ${usuariosSeleccionados.size} usuarios...`);
      
      let usuariosReparados = 0;
      let reparacionesAplicadas = 0;
      const errores: string[] = [];
      
      for (const uid of Array.from(usuariosSeleccionados)) {
        try {
          const usuarioInconsistente = analisis.usuariosInconsistentes.find(item => item.usuario.uid === uid);
          if (!usuarioInconsistente) continue;
            const actualizaciones: Partial<Usuario> = {};
          const camposAEliminar: string[] = [];
          
          for (const reparacion of usuarioInconsistente.reparacionesPropuestas) {
            if (reparacion.valorPropuesto === 'ELIMINAR') {
              camposAEliminar.push(reparacion.campo);
              console.log(`🗑️ Eliminando campo ${reparacion.campo} para ${usuarioInconsistente.usuario.email}`);
              continue;
            }
            
            (actualizaciones as any)[reparacion.campo] = reparacion.valorPropuesto;
            reparacionesAplicadas++;
            
            console.log(`🔧 ${usuarioInconsistente.usuario.email}: ${reparacion.campo} = ${reparacion.valorPropuesto}`);
          }
          
          if (Object.keys(actualizaciones).length > 0 || camposAEliminar.length > 0) {
            await actualizarUsuario(uid, actualizaciones, camposAEliminar);
            
            // Registrar evento de reparación
            await usuarioHistorialService.registrarEvento({
              usuarioId: uid,
              nombreUsuario: `${usuarioInconsistente.usuario.nombre} ${usuarioInconsistente.usuario.apellidos}`,
              emailUsuario: usuarioInconsistente.usuario.email,
              tipoEvento: 'actualizacion' as any,
              descripcion: `Registro reparado automáticamente: ${[...Object.keys(actualizaciones), ...camposAEliminar.map(c => `eliminar_${c}`)].join(', ')}`,
              fecha: new Date(),
              responsableId: 'sistema',
              responsableNombre: 'Sistema de Reparación Automática',
              observaciones: `Reparaciones aplicadas: ${usuarioInconsistente.reparacionesPropuestas.length}`
            });
            
            usuariosReparados++;
          }
          
        } catch (error) {
          console.error(`❌ Error reparando usuario ${uid}:`, error);
          errores.push(`Error en usuario ${uid}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
      
      console.log(`✅ Reparación completada: ${usuariosReparados} usuarios, ${reparacionesAplicadas} reparaciones`);
      
      // Señalar finalización para otros componentes
      localStorage.setItem('reparacion_completada', new Date().toISOString());
      localStorage.setItem('recalculo_completado', new Date().toISOString());
      
      setReparacionCompleta(true);
      
      toast({
        title: 'Reparación completada',
        description: `${usuariosReparados} usuarios reparados con ${reparacionesAplicadas} correcciones aplicadas`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      });
      
      if (errores.length > 0) {
        console.warn('⚠️ Errores durante la reparación:', errores);
        toast({
          title: 'Algunos errores durante la reparación',
          description: `${errores.length} errores encontrados. Ver consola para detalles.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Reanalizar después de 2 segundos
      setTimeout(() => {
        analizarInconsistencias();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error en reparación:', error);
      toast({
        title: 'Error en reparación',
        description: 'No se pudo completar la reparación',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'red';
      case 'media': return 'orange';
      case 'baja': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <Card>
      <CardHeader>
        <VStack spacing={2} align="stretch">
          <Text fontSize="lg" fontWeight="bold">
            🔧 Reparación de Usuarios Desactualizados
          </Text>
          <Text fontSize="sm" color="gray.600">
            Detecta y repara inconsistencias en registros de usuarios creados antes de las actualizaciones del sistema
          </Text>
        </VStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6} align="stretch">
          <HStack spacing={4}>
            <Button
              leftIcon={<FiTool />}
              colorScheme="blue"
              onClick={analizarInconsistencias}
              isLoading={isAnalyzing}
              loadingText="Analizando..."
            >
              Analizar Inconsistencias
            </Button>
            
            {analisis && analisis.usuariosInconsistentes.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={seleccionarTodos}
                >
                  Seleccionar Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={limpiarSeleccion}
                >
                  Limpiar Selección
                </Button>
                <Button
                  leftIcon={<FiCheck />}
                  colorScheme="green"
                  onClick={repararUsuariosSeleccionados}
                  isLoading={isRepairing}
                  loadingText="Reparando..."
                  isDisabled={usuariosSeleccionados.size === 0}
                >
                  Reparar Seleccionados ({usuariosSeleccionados.size})
                </Button>
              </>
            )}
          </HStack>

          {analisis && (
            <>
              <Divider />
              
              {/* Estadísticas del análisis */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={3}>📊 Resultados del Análisis</Text>
                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                  <StatGroup>
                    <Stat>
                      <StatLabel>Total de usuarios</StatLabel>
                      <StatNumber>{analisis.estadisticas.totalUsuarios}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Con problemas</StatLabel>
                      <StatNumber color={analisis.estadisticas.usuariosConProblemas > 0 ? "red.500" : "green.500"}>
                        {analisis.estadisticas.usuariosConProblemas}
                      </StatNumber>
                    </Stat>
                  </StatGroup>
                  
                  <StatGroup>
                    <Stat>
                      <StatLabel>Sin estado aprobación</StatLabel>
                      <StatNumber color={analisis.estadisticas.usuariosSinEstadoAprobacion > 0 ? "orange.500" : "green.500"}>
                        {analisis.estadisticas.usuariosSinEstadoAprobacion}
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Sin estado actividad</StatLabel>
                      <StatNumber color={analisis.estadisticas.usuariosSinEstadoActividad > 0 ? "orange.500" : "green.500"}>
                        {analisis.estadisticas.usuariosSinEstadoActividad}
                      </StatNumber>
                    </Stat>
                  </StatGroup>
                  
                  <StatGroup>
                    <Stat>
                      <StatLabel>Con campo activo legacy</StatLabel>
                      <StatNumber color={analisis.estadisticas.usuariosConCampoActivoLegacy > 0 ? "yellow.500" : "green.500"}>
                        {analisis.estadisticas.usuariosConCampoActivoLegacy}
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Reparaciones necesarias</StatLabel>
                      <StatNumber color="blue.500">
                        {analisis.estadisticas.reparacionesNecesarias}
                      </StatNumber>
                    </Stat>
                  </StatGroup>
                </Grid>
              </Box>

              {/* Lista de usuarios con problemas */}
              {analisis.usuariosInconsistentes.length > 0 ? (
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="red.600">
                    ⚠️ Usuarios con Inconsistencias ({analisis.usuariosInconsistentes.length})
                  </Text>
                  
                  <Accordion allowMultiple>
                    {analisis.usuariosInconsistentes.map((item) => (
                      <AccordionItem key={item.usuario.uid}>
                        <AccordionButton>
                          <Checkbox
                            isChecked={usuariosSeleccionados.has(item.usuario.uid)}
                            onChange={() => toggleUsuarioSeleccionado(item.usuario.uid)}
                            mr={3}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Box flex="1" textAlign="left">
                            <HStack>
                              <Text fontWeight="medium">
                                {item.usuario.nombre} {item.usuario.apellidos}
                              </Text>
                              <Badge colorScheme={getPrioridadColor(item.prioridad)}>
                                {item.prioridad}
                              </Badge>
                              <Badge colorScheme="red" variant="outline">
                                {item.problemas.length} problema{item.problemas.length !== 1 ? 's' : ''}
                              </Badge>
                              <Badge colorScheme="blue" variant="outline">
                                {item.reparacionesPropuestas.length} reparación{item.reparacionesPropuestas.length !== 1 ? 'es' : ''}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600" mt={1}>
                              {item.usuario.email}
                            </Text>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <VStack align="stretch" spacing={4}>
                            {/* Problemas detectados */}
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" mb={2}>Problemas detectados:</Text>
                              <VStack align="stretch" spacing={1}>
                                {item.problemas.map((problema, pIndex) => (
                                  <Alert key={pIndex} status="warning" size="sm">
                                    <AlertIcon />
                                    <Text fontSize="sm">{problema}</Text>
                                  </Alert>
                                ))}
                              </VStack>
                            </Box>
                            
                            {/* Reparaciones propuestas */}
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" mb={2}>Reparaciones propuestas:</Text>
                              <Table size="sm" variant="simple">
                                <Thead>
                                  <Tr>
                                    <Th>Campo</Th>
                                    <Th>Valor Actual</Th>
                                    <Th>Valor Propuesto</Th>
                                    <Th>Razón</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {item.reparacionesPropuestas.map((reparacion, rIndex) => (
                                    <Tr key={rIndex}>
                                      <Td>
                                        <Code fontSize="xs">{reparacion.campo}</Code>
                                      </Td>
                                      <Td>
                                        <Code fontSize="xs" colorScheme="red">
                                          {reparacion.valorActual !== undefined 
                                            ? String(reparacion.valorActual) 
                                            : 'undefined'}
                                        </Code>
                                      </Td>
                                      <Td>
                                        <Code fontSize="xs" colorScheme="green">
                                          {String(reparacion.valorPropuesto)}
                                        </Code>
                                      </Td>
                                      <Td>
                                        <Text fontSize="xs">{reparacion.razon}</Text>
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Box>
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Box>
              ) : (
                <Alert status="success">
                  <AlertIcon />
                  ✅ No se encontraron usuarios con inconsistencias
                </Alert>
              )}
            </>
          )}

          {reparacionCompleta && (
            <Alert status="info">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Reparación completada</Text>
                <Text fontSize="sm">
                  Los otros componentes del sistema se actualizarán automáticamente para reflejar los cambios.
                </Text>
              </Box>
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ReparacionUsuariosDesactualizados;
