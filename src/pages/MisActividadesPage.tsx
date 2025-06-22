import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Spinner,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Divider,
  SimpleGrid,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { FiPackage, FiCalendar, FiUser, FiUsers, FiShield, FiRefreshCw, FiEdit, FiXCircle } from 'react-icons/fi';
import { RefreshCw, AlertTriangle, Calendar, Package } from 'lucide-react';
import { AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Actividad } from '../types/actividad';
import { obtenerActividadesClasificadas } from '../services/actividadService';
import { formatLocationForCard } from '../utils/locationUtils';
import { 
  detectarActividadesConRetraso,   notificarActividadesConRetraso,
  finalizarActividadConRetraso,
  ActividadConRetraso 
} from '../services/actividadRetrasoService';
import { ActividadConRetrasoIndicador } from '../components/actividades/ActividadConRetrasoIndicador';
import { formatFecha } from '../utils/dateUtils';
import messages from '../constants/messages';

const MisActividadesPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const toast = useToast();
  
  // Estados separados por tipo de responsabilidad
  const [actividadesRespActividad, setActividadesRespActividad] = useState<Actividad[]>([]);
  const [actividadesRespMaterial, setActividadesRespMaterial] = useState<Actividad[]>([]);
  const [actividadesParticipante, setActividadesParticipante] = useState<Actividad[]>([]);  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
    // Estados para actividades con retraso
  const [actividadesConRetraso, setActividadesConRetraso] = useState<ActividadConRetraso[]>([]);
  const [isLoadingRetraso, setIsLoadingRetraso] = useState(false);
  const [selectedActividadRetraso, setSelectedActividadRetraso] = useState<ActividadConRetraso | null>(null);
  
  const { isOpen: isRetrasoOpen, onOpen: onRetrasoOpen, onClose: onRetrasoClose } = useDisclosure();

  // Cargar actividades del usuario clasificadas
  useEffect(() => {
    const fetchActividades = async () => {
      if (!userProfile?.uid) return;
      
      try {
        setIsLoading(true);
        
        // NUEVO: Actualizar estados de actividades antes de cargar
        try {
          console.log('🔄 Actualizando estados de actividades...');
          const { actualizarEstadosActividades } = await import('../services/prestamoService');
          const resultado = await actualizarEstadosActividades();
          console.log(`✅ Estados actualizados: ${resultado.actualizadas} actividades`);
          if (resultado.errores.length > 0) {
            console.warn('⚠️ Errores en actualización:', resultado.errores);
          }
        } catch (updateError) {
          console.error('⚠️ Error actualizando estados (continuando):', updateError);
        }
        
        // Obtener actividades clasificadas del usuario
        const { actividadesResponsable, actividadesParticipante } = await obtenerActividadesClasificadas(userProfile.uid);
        
        console.log('🔍 MisActividadesPage - Total actividades responsable:', actividadesResponsable.length);
        console.log('🔍 MisActividadesPage - Total actividades participante:', actividadesParticipante.length);
        
        // Clasificar actividades por tipo específico de responsabilidad (mutuamente excluyentes)
        const respActividad = actividadesResponsable.filter(act => 
          act.creadorId === userProfile.uid || 
          act.responsableActividadId === userProfile.uid
        );
        
        const respMaterial = actividadesResponsable.filter(act => 
          act.responsableMaterialId === userProfile.uid && 
          act.creadorId !== userProfile.uid && 
          act.responsableActividadId !== userProfile.uid
        );
        
        setActividadesRespActividad(respActividad);
        setActividadesRespMaterial(respMaterial);
        setActividadesParticipante(actividadesParticipante);
        
        console.log('🔍 MisActividadesPage - Responsable actividad (incluye creadores):', respActividad.length);
        console.log('🔍 MisActividadesPage - Responsable material:', respMaterial.length);
        console.log('🔍 MisActividadesPage - Solo participante:', actividadesParticipante.length);
        
        // Log detallado de cada actividad  
        respActividad.forEach(act => {
          const roles = [];
          if (act.creadorId === userProfile.uid) roles.push('Creador');
          if (act.responsableActividadId === userProfile.uid) roles.push('Resp.Actividad');
          if (act.responsableMaterialId === userProfile.uid) roles.push('Resp.Material');
          console.log(`📋 "${act.nombre}": ${roles.join(', ')}`);
        });
        
      } catch (error) {
        console.error('Error al cargar actividades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActividades();
  }, [userProfile?.uid]);

  // Función para recargar manualmente
  const recargarActividades = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setIsRefreshing(true);
      
      // NUEVO: Actualizar estados de actividades antes de recargar
      try {
        console.log('🔄 Actualizando estados antes de recargar...');
        const { actualizarEstadosActividades } = await import('../services/prestamoService');
        const resultado = await actualizarEstadosActividades();
        console.log(`✅ Estados actualizados: ${resultado.actualizadas} actividades`);
      } catch (updateError) {
        console.error('⚠️ Error actualizando estados (continuando):', updateError);
      }
      
      const { actividadesResponsable, actividadesParticipante } = await obtenerActividadesClasificadas(userProfile.uid);
      
      const respActividad = actividadesResponsable.filter(act => 
        act.creadorId === userProfile.uid || 
        act.responsableActividadId === userProfile.uid
      );
      
      const respMaterial = actividadesResponsable.filter(act => 
        act.responsableMaterialId === userProfile.uid && 
        act.creadorId !== userProfile.uid && 
        act.responsableActividadId !== userProfile.uid
      );
        setActividadesRespActividad(respActividad);
      setActividadesRespMaterial(respMaterial);
      setActividadesParticipante(actividadesParticipante);
      
      // También recargar actividades con retraso
      await cargarActividadesConRetraso();
      
      console.log('🔄 Actividades recargadas manualmente');
      
    } catch (error) {
      console.error('Error al recargar actividades:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-actualización cada 30 segundos para reflejar cambios de estado automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && !isLoading) {
        recargarActividades();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [userProfile?.uid, isRefreshing, isLoading]);
  // Funciones para actividades con retraso
  const cargarActividadesConRetraso = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setIsLoadingRetraso(true);
      console.log('🔍 Iniciando carga de actividades con retraso para usuario:', userProfile.uid);
      
      // Obtener todas las actividades con retraso
      const todasActividadesConRetraso = await detectarActividadesConRetraso();
      console.log('📊 Total actividades con retraso en sistema:', todasActividadesConRetraso.length);
      
      // Log de todas las actividades con retraso para debug
      todasActividadesConRetraso.forEach((act, index) => {
        console.log(`🔴 ${index + 1}. "${act.actividad.nombre}":`, {
          id: act.actividad.id,
          creador: act.actividad.creadorId,
          respActividad: act.actividad.responsableActividadId,
          respMaterial: act.actividad.responsableMaterialId,
          participantes: act.actividad.participanteIds,
          diasRetraso: act.diasRetraso
        });
      });      // Filtrar solo las actividades donde el usuario actual tiene responsabilidad
      const actividadesUsuario = todasActividadesConRetraso.filter(actividadConRetraso => {
        const actividad = actividadConRetraso.actividad;
        const esCreador = actividad.creadorId === userProfile.uid;
        const esRespActividad = actividad.responsableActividadId === userProfile.uid;
        const esRespMaterial = actividad.responsableMaterialId === userProfile.uid;
        const esParticipante = actividad.participanteIds?.includes(userProfile.uid);
        
        const tieneRelacion = esCreador || esRespActividad || esRespMaterial || esParticipante;
        
        if (tieneRelacion) {
          const roles = [];
          if (esCreador) roles.push('Creador');
          if (esRespActividad) roles.push('Resp.Actividad');
          if (esRespMaterial) roles.push('Resp.Material');
          if (esParticipante) roles.push('Participante');
          console.log(`✅ "${actividad.nombre}" - Usuario es: ${roles.join(', ')}`);
        }
        
        return tieneRelacion;
      });
      
      setActividadesConRetraso(actividadesUsuario);
      
      console.log(`🎯 Actividades con retraso del usuario: ${actividadesUsuario.length} de ${todasActividadesConRetraso.length} totales`);
      
    } catch (error) {
      console.error('Error al cargar actividades con retraso:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las actividades con retraso',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingRetraso(false);
    }
  };

  // Enviar notificaciones para actividades con retraso
  const enviarNotificaciones = async () => {
    if (actividadesConRetraso.length === 0) return;
    
    try {
      await notificarActividadesConRetraso(actividadesConRetraso);
      toast({
        title: 'Notificaciones enviadas',
        description: `Se enviaron notificaciones para ${actividadesConRetraso.length} actividades con retraso`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron enviar las notificaciones',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Finalizar actividad con retraso
  const handleFinalizarActividad = async (actividadConRetraso: ActividadConRetraso) => {
    try {
      await finalizarActividadConRetraso(actividadConRetraso.actividad.id!);
      
      toast({
        title: 'Actividad finalizada',
        description: `La actividad "${actividadConRetraso.actividad.nombre}" ha sido marcada como finalizada`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recargar datos
      await cargarActividadesConRetraso();
      await recargarActividades();
      onRetrasoClose();
    } catch (error) {
      console.error('Error al finalizar actividad:', error);
      toast({
        title: 'Error',
        description: 'No se pudo finalizar la actividad',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleVerDetalleRetraso = (actividad: ActividadConRetraso) => {
    setSelectedActividadRetraso(actividad);
    onRetrasoOpen();
  };

  // Función para cancelar una actividad
  const handleCancelarActividad = async (actividad: Actividad) => {
    // Mostrar confirmación antes de cancelar
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres cancelar la actividad "${actividad.nombre}"?\n\n` +
      'Esta acción:\n' +
      '• Marcará la actividad como "Cancelada"\n' +
      '• Devolverá automáticamente todo el material prestado\n' +
      '• No se puede deshacer\n\n' +
      '¿Deseas continuar?'
    );

    if (!confirmar) return;

    try {
      // Importar la función de cancelar actividad
      const { cancelarActividad } = await import('../services/actividadService');
      
      console.log(`🚫 Cancelando actividad: ${actividad.nombre}`);
      await cancelarActividad(actividad.id!);
      
      // Si tenía material, devolverlo automáticamente
      if (actividad.necesidadMaterial && actividad.materiales?.length > 0) {
        try {
          const { devolverTodosLosMaterialesActividad } = await import('../services/prestamoService');
          const resultado = await devolverTodosLosMaterialesActividad(
            actividad.id!, 
            'Material devuelto automáticamente al cancelar la actividad'
          );
          
          console.log(`📦 Material devuelto automáticamente: ${resultado.exito} éxitos, ${resultado.errores.length} errores`);
        } catch (devolucionError) {
          console.warn('⚠️ Error devolviendo material al cancelar actividad:', devolucionError);
          // No bloquear el proceso de cancelación por errores de devolución
        }
      }
      
      toast({
        title: 'Actividad cancelada',
        description: `La actividad "${actividad.nombre}" ha sido cancelada exitosamente`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recargar actividades para reflejar el cambio
      await recargarActividades();
      
    } catch (error) {
      console.error('Error al cancelar actividad:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la actividad. Inténtalo de nuevo.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Cargar actividades con retraso cuando se monte el componente o cambie el usuario
  useEffect(() => {
    if (userProfile?.uid) {
      cargarActividadesConRetraso();
    }
  }, [userProfile?.uid]);

  // Obtener estado con color para mostrar
  const getEstadoDisplay = (estado: string) => {
    switch (estado) {
      case 'planificada':
        return { label: 'Planificada', color: 'yellow' };
      case 'en_curso':
        return { label: 'En curso', color: 'green' };
      case 'finalizada':
        return { label: 'Finalizada', color: 'blue' };
      case 'cancelada':
        return { label: 'Cancelada', color: 'red' };
      default:
        return { label: estado, color: 'gray' };
    }
  };

  // Función para formatear fechas
  const formatDate = (date: any): string => {
    if (!date) return 'Sin fecha';
    
    try {
      const dateObj = date instanceof Date ? date : 
                     date.toDate ? date.toDate() : 
                     new Date(date);
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Verificar si la actividad está vencida (fecha de fin ha pasado)
  const isActividadVencida = (actividad: Actividad): boolean => {
    const ahora = new Date();
    const fechaFin = actividad.fechaFin instanceof Date ? actividad.fechaFin : 
                    actividad.fechaFin?.toDate ? actividad.fechaFin.toDate() : null;
    return fechaFin ? ahora > fechaFin : false;
  };

  // Obtener roles del usuario en una actividad
  const getRolUsuario = (actividad: Actividad) => {
    const roles = [];
    
    if (actividad.creadorId === userProfile?.uid) {
      roles.push({ tipo: 'Creador', color: 'purple' });
    }
    if (actividad.responsableActividadId === userProfile?.uid) {
      roles.push({ tipo: 'Resp. Actividad', color: 'blue' });
    }
    if (actividad.responsableMaterialId === userProfile?.uid) {
      roles.push({ tipo: 'Resp. Material', color: 'orange' });
    }
    
    return roles;
  };

  // Función para renderizar cada tarjeta de actividad con mejor separación visual
  const renderActividadCard = (actividad: Actividad) => {
    const estado = getEstadoDisplay(actividad.estado);
    const rolesUsuario = getRolUsuario(actividad);
    
    return (
      <Card 
        key={actividad.id} 
        mb={6} 
        variant="outline"
        borderLeft="4px solid"
        borderLeftColor={
          actividad.estado === 'cancelada' ? 'red.400' :
          rolesUsuario.length > 0 ? `${rolesUsuario[0].color}.400` : 'gray.200'
        }
        _hover={{ 
          boxShadow: actividad.estado === 'cancelada' ? 'sm' : 'md', 
          transform: actividad.estado === 'cancelada' ? 'none' : 'translateY(-2px)',
          transition: 'all 0.2s'
        }}
        bg={actividad.estado === 'cancelada' ? 'gray.50' : 'white'}
        opacity={actividad.estado === 'cancelada' ? 0.75 : 1}
        _dark={{
          bg: actividad.estado === 'cancelada' ? 'gray.800' : 'gray.700'
        }}
      >
        <CardBody>
          {/* Header con nombre y badges */}
          <Flex justify="space-between" align="start" mb={3}>
            <Heading 
              size="sm"
              textDecoration={actividad.estado === 'cancelada' ? 'line-through' : 'none'}
              color={actividad.estado === 'cancelada' ? 'gray.500' : 'inherit'}
            >
              {actividad.nombre}
            </Heading>
            <Flex mt={1} gap={2} flexWrap="wrap">
              {/* Badge especial para actividades canceladas */}
              {actividad.estado === 'cancelada' && (
                <Badge colorScheme="red" size="sm" variant="solid">
                  🚫 CANCELADA
                </Badge>
              )}
              {rolesUsuario.map((rol, index) => (
                <Badge 
                  key={index} 
                  colorScheme={rol.color} 
                  size="sm"
                  opacity={actividad.estado === 'cancelada' ? 0.7 : 1}
                >
                  {rol.tipo}
                </Badge>
              ))}
              {actividad.estado !== 'cancelada' && (
                <Badge colorScheme={estado.color} size="sm">
                  {estado.label}
                </Badge>
              )}
            </Flex>
          </Flex>
          
          <Divider my={3} />
          
          {/* Información de la actividad */}
          <Flex align="center" mt={2}>
            <FiCalendar style={{ marginRight: '8px' }} />
            <Text fontSize="sm">
              {formatDate(actividad.fechaInicio)}
              {actividad.fechaFin && (
                <> → {formatDate(actividad.fechaFin)}</>
              )}
            </Text>
          </Flex>
          
          <Text fontSize="sm" mt={2} title={actividad.lugar || 'No especificado'}>
            Lugar: {formatLocationForCard(actividad.lugar || 'No especificado')}
          </Text>
            {actividad.descripcion && (
            <Text fontSize="sm" mt={2} noOfLines={2}>{actividad.descripcion}</Text>
          )}
          
          {/* Botones de acción al final de la tarjeta */}
          {actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && rolesUsuario.length > 0 && (
            <Flex justify="flex-end" width="100%" mt={4} gap={2} flexWrap="wrap">
              {/* Botón Editar para actividades activas */}
              <Button 
                size={{ base: "sm", md: "md" }}
                colorScheme="blue"
                leftIcon={<FiEdit />}
                onClick={() => navigate(`/activities/edit/${actividad.id}`)}
                width={{ base: "100%", sm: "auto" }}
              >
                Editar
              </Button>
              
              {/* Botón Cancelar para actividades activas */}
              <Button 
                size={{ base: "sm", md: "md" }}
                colorScheme="red"
                leftIcon={<FiXCircle />}
                onClick={() => handleCancelarActividad(actividad)}
                width={{ base: "100%", sm: "auto" }}
              >
                Cancelar
              </Button>
              
              {/* Botón Devolución de material para actividades vencidas */}
              {isActividadVencida(actividad) && (
                <Button 
                  size={{ base: "sm", md: "md" }}
                  colorScheme="red"
                  leftIcon={<FiPackage />}
                  onClick={() => {
                    // Para actividades vencidas, navegar a la página de devolución
                    navigate('/devolucion-material');
                  }}
                  width={{ base: "100%", sm: "auto" }}
                >
                  Devolución de material
                </Button>
              )}
            </Flex>
          )}
        </CardBody>
      </Card>
    );
  };

  // Función helper para separar actividades por estado y renderizarlas organizadamente
  const renderActividadesSeparadas = (actividades: Actividad[]) => {
    // Separar actividades por estado
    const planificadas = actividades.filter(act => act.estado === 'planificada');
    const enCurso = actividades.filter(act => act.estado === 'en_curso');
    const finalizadas = actividades.filter(act => act.estado === 'finalizada');
    const canceladas = actividades.filter(act => act.estado === 'cancelada');

    // Ordenar cada grupo por fecha (más recientes primero para activas, más antiguas primero para finalizadas)
    const sortByDate = (a: Actividad, b: Actividad, ascending = false) => {
      const dateA = a.fechaInicio instanceof Date ? a.fechaInicio : a.fechaInicio?.toDate?.() || new Date(0);
      const dateB = b.fechaInicio instanceof Date ? b.fechaInicio : b.fechaInicio?.toDate?.() || new Date(0);
      return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    };

    planificadas.sort((a, b) => sortByDate(a, b, false));
    enCurso.sort((a, b) => sortByDate(a, b, false));
    finalizadas.sort((a, b) => sortByDate(a, b, true));
    canceladas.sort((a, b) => sortByDate(a, b, true));

    return (
      <>        {/* Actividades Activas (Planificadas y En Curso) */}
        {(planificadas.length > 0 || enCurso.length > 0) && (
          <Box mb={6}>
            <Flex align="center" mb={3}>
              <Box w="4px" h="20px" bg="green.500" mr={3} borderRadius="2px" />
              <Heading size="md" color="green.600">
                Actividades Activas ({planificadas.length + enCurso.length})
              </Heading>
            </Flex>
            {planificadas.map(actividad => renderActividadCard(actividad))}
            {enCurso.map(actividad => renderActividadCard(actividad))}
          </Box>
        )}

        {/* Separador visual */}
        {(planificadas.length > 0 || enCurso.length > 0) && finalizadas.length > 0 && (
          <Box  my={6} 
                          mb={6}
                          position="relative"
                          overflow="hidden"
                          borderRadius="xl"
                          bgGradient="linear(135deg, brand.500, brand.400, brand.300)"
                          py={3}
                          px={6}
                          boxShadow="xl"
                          border="1px solid"
                          borderColor="rgba(255,255,255,0.2)"
                          _before={{
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgGradient: "linear(to-br, rgba(255,255,255,0.1), transparent)",
                            pointerEvents: "none"
                          }}
                          transition="all 0.3s ease"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "2xl"
                          }}
                        >
                          <Text
                            fontSize="lg"
                            color="white"
                            textAlign="center"
                            fontWeight="bold"
                            textShadow="0 2px 4px rgba(0,0,0,0.4)"
                            letterSpacing="wide"
                            position="relative"
                            zIndex={2}
                          >
                            Actividades Completadas
                          </Text>
                          
                          {/* Enhanced decorative elements */}
                          <Box
                            position="absolute"
                            top="-15px"
                            right="-15px"
                            w="60px"
                            h="60px"
                            bg="rgba(255,255,255,0.08)"
                            borderRadius="full"
                            opacity={0.8}
                            _before={{
                              content: '""',
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              w: "30px",
                              h: "30px",
                              bg: "rgba(255,255,255,0.1)",
                              borderRadius: "full"
                            }}
                          />
                          <Box
                            position="absolute"
                            bottom="-8px"
                            left="30px"
                            w="32px"
                            h="32px"
                            bg="rgba(255,255,255,0.06)"
                            borderRadius="full"
                            opacity={0.6}
                          />
                          <Box
                            position="absolute"
                            top="20px"
                            left="-10px"
                            w="24px"
                            h="24px"
                            bg="rgba(255,255,255,0.05)"
                            borderRadius="full"
                            opacity={0.4}
                          />
                        </Box>
        )}

        {/* Actividades Finalizadas */}
        {finalizadas.length > 0 && (
          <Box mb={6}>
            <Flex align="center" mb={3}>
              <Box w="4px" h="20px" bg="blue.500" mr={3} borderRadius="2px" />
              <Heading size="md" color="blue.600">
                Finalizadas ({finalizadas.length})
              </Heading>
            </Flex>
            {finalizadas.map(actividad => renderActividadCard(actividad))}
          </Box>
        )}

        {/* Actividades Canceladas */}
        {canceladas.length > 0 && (
          <Box mb={6}>
            <Flex align="center" mb={3}>
              <Box w="4px" h="20px" bg="red.500" mr={3} borderRadius="2px" />
              <Heading size="md" color="red.600">
                Canceladas ({canceladas.length})
              </Heading>
            </Flex>
            {canceladas.map(actividad => renderActividadCard(actividad))}
          </Box>
        )}

        {/* Mensaje si no hay actividades */}
        {actividades.length === 0 && (
          <Card>
            <CardBody textAlign="center">
              <Text color="gray.500">No hay actividades en esta categoría</Text>
            </CardBody>
          </Card>        )}
      </>
    );
  };

  return (
    <DashboardLayout title="Mis Actividades">
      {/* Contenedor principal centrado con ancho máximo */}
      <Flex justify="center">
        <Box
          width="100%" 
          maxWidth="1200px" 
          p={{ base: 3, md: 5 }}
        >
          <Heading 
            size="lg" 
            textAlign="left" 
            color={"purple"}
            mb={2}
          >
            Mis Actividades
          </Heading>
          {/* Botones debajo del título, alineados a la derecha en escritorio */}
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={2}
            mb={6}
            width="100%"
            justify={{ base: "flex-start", md: "flex-end" }}
            align="stretch"
          >
            <Button 
              leftIcon={<FiRefreshCw />} 
              colorScheme="gray" 
              variant="outline"
              size="sm"
              onClick={recargarActividades}
              isLoading={isRefreshing}
              loadingText="Recargando..."
              width={{ base: "100%", md: "auto" }}
            >
              Recargar
            </Button>
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="brand" 
              onClick={() => navigate('/activities/create')}
              width={{ base: "100%", md: "auto" }}
            >
              Nueva Actividad
            </Button>
          </Flex>      
          {isLoading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" />
            </Flex>
          ) : actividadesRespActividad.length === 0 && actividadesRespMaterial.length === 0 && actividadesParticipante.length === 0 ? (
            <Card>
              <CardBody textAlign="center">
                <Text>No tienes actividades registradas</Text>
              </CardBody>
            </Card>
          ) : (
            <Tabs 
              variant="soft-rounded" 
              colorScheme="purple" 
              size={{ base: "sm", md: "md" }}
              isLazy
            >              <TabList mb={6} flexWrap="wrap" gap={2}>
                <Tab>Resp. Actividad ({actividadesRespActividad.length})</Tab>
                <Tab>Resp. Material ({actividadesRespMaterial.length})</Tab>
                <Tab>Como Participante ({actividadesParticipante.length})</Tab>
                <Tab color="red.500">Con retraso ({actividadesConRetraso.length})</Tab>
              </TabList>
                <TabPanels>
                <TabPanel p={0}>
                  {renderActividadesSeparadas(actividadesRespActividad)}
                </TabPanel>
                
                <TabPanel p={0}>
                  {renderActividadesSeparadas(actividadesRespMaterial)}
                </TabPanel>
                  <TabPanel p={0}>
                  {renderActividadesSeparadas(actividadesParticipante)}
                </TabPanel>

                {/* Pestaña de Actividades con Retraso */}
                <TabPanel p={0}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text fontSize="lg" fontWeight="semibold" color="red.600">
                      Actividades con Retraso
                    </Text>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<RefreshCw size={16} />}
                        onClick={cargarActividadesConRetraso}
                        isLoading={isLoadingRetraso}
                      >
                        Actualizar
                      </Button>
                      {actividadesConRetraso.length > 0 && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={enviarNotificaciones}
                        >
                          Notificar
                        </Button>
                      )}
                    </HStack>
                  </Flex>

                  {isLoadingRetraso ? (
                    <Flex justify="center" align="center" py={8}>
                      <Spinner size="lg" color="red.500" />
                    </Flex>
                  ) : actividadesConRetraso.length === 0 ? (
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      <AlertTitle>¡Excelente!</AlertTitle>
                      <AlertDescription>
                        No hay actividades con retraso
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Box>
                      {/* Estadísticas */}
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                        <Stat>
                          <StatLabel>Actividades con Retraso</StatLabel>
                          <StatNumber color="red.500">{actividadesConRetraso.length}</StatNumber>
                          <StatHelpText>Requieren atención</StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Días promedio de retraso</StatLabel>
                          <StatNumber color="orange.500">
                            {actividadesConRetraso.length > 0 
                              ? Math.round(actividadesConRetraso.reduce((acc, a) => acc + a.diasRetraso, 0) / actividadesConRetraso.length)
                              : 0
                            }
                          </StatNumber>
                          <StatHelpText>Desde finalización</StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Préstamos activos</StatLabel>
                          <StatNumber color="purple.500">
                            {actividadesConRetraso.reduce((acc, a) => acc + a.prestamosActivos, 0)}
                          </StatNumber>
                          <StatHelpText>Sin devolver</StatHelpText>
                        </Stat>
                      </SimpleGrid>

                      {/* Lista de actividades con retraso */}
                      <Alert status="warning" borderRadius="md" mb={4}>
                        <AlertIcon />
                        <AlertTitle>Atención requerida:</AlertTitle>
                        <AlertDescription>
                          {actividadesConRetraso.length} actividad{actividadesConRetraso.length !== 1 ? 'es' : ''} con retraso detectada{actividadesConRetraso.length !== 1 ? 's' : ''}
                        </AlertDescription>
                      </Alert>

                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {actividadesConRetraso.map((actividadConRetraso, index) => (
                          <Card
                            key={`${actividadConRetraso.actividad.id}-${index}`}
                            borderLeft="4px solid"
                            borderLeftColor="red.400"
                            cursor="pointer"
                            onClick={() => handleVerDetalleRetraso(actividadConRetraso)}
                            _hover={{ 
                              shadow: 'md', 
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s'
                            }}
                          >
                            <CardBody>
                              <VStack align="start" spacing={3}>
                                <HStack w="full" justify="space-between">
                                  <Text fontWeight="bold" color="red.600" noOfLines={1}>
                                    {actividadConRetraso.actividad.nombre}
                                  </Text>
                                  <ActividadConRetrasoIndicador 
                                    actividad={actividadConRetraso.actividad}
                                  />
                                </HStack>
                                
                                <VStack align="start" spacing={1} w="full">
                                  <HStack>
                                    <Calendar size={14} />
                                    <Text fontSize="xs" color="gray.600">
                                      Finalizó: {formatFecha(actividadConRetraso.actividad.fechaFin)}
                                    </Text>
                                  </HStack>
                                  <HStack>
                                    <Package size={14} />
                                    <Text fontSize="xs" color="gray.600">
                                      {actividadConRetraso.prestamosActivos} préstamos activos
                                    </Text>
                                  </HStack>
                                  <HStack>
                                    <AlertTriangle size={14} />
                                    <Text fontSize="xs" color="red.500">
                                      {actividadConRetraso.diasRetraso} días de retraso
                                    </Text>
                                  </HStack>
                                </VStack>

                                {actividadConRetraso.responsables.actividad && (
                                  <Box w="full">
                                    <Text fontSize="xs" color="gray.500" mb={1}>
                                      Responsable:
                                    </Text>
                                    <Badge colorScheme="blue" size="sm">
                                      {actividadConRetraso.responsables.actividad.nombre}
                                    </Badge>
                                  </Box>
                                )}
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}        </Box>
      </Flex>

      {/* Modal de detalle de actividad con retraso */}
      <Modal isOpen={isRetrasoOpen} onClose={onRetrasoClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.600">
            <HStack spacing={2}>
              <AlertTriangle size={24} />
              <Text>
                Actividad con Retraso: {selectedActividadRetraso?.actividad.nombre}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedActividadRetraso && (
              <VStack align="start" spacing={4}>
                {/* Información básica */}
                <Box w="full">
                  <Text fontWeight="bold" mb={2}>Información de la actividad:</Text>
                  <VStack align="start" spacing={2} pl={4}>
                    <HStack>
                      <Calendar size={16} />
                      <Text fontSize="sm">
                        Fecha fin: {formatFecha(selectedActividadRetraso.actividad.fechaFin)}
                      </Text>
                    </HStack>
                    <HStack>
                      <AlertTriangle size={16} />
                      <Text fontSize="sm" color="red.500">
                        Días de retraso: {selectedActividadRetraso.diasRetraso}
                      </Text>
                    </HStack>
                    <HStack>
                      <Package size={16} />
                      <Text fontSize="sm">
                        Préstamos activos: {selectedActividadRetraso.prestamosActivos}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Información de responsables */}
                <Box w="full">
                  <Text fontWeight="bold" mb={2}>Responsables:</Text>
                  <VStack align="start" spacing={2} pl={4}>
                    {selectedActividadRetraso.responsables.actividad && (
                      <HStack w="full" justify="space-between">
                        <Text fontSize="sm">Resp. Actividad:</Text>
                        <Badge colorScheme="blue" size="sm">
                          {selectedActividadRetraso.responsables.actividad.nombre}
                        </Badge>
                      </HStack>
                    )}
                    {selectedActividadRetraso.responsables.material && (
                      <HStack w="full" justify="space-between">
                        <Text fontSize="sm">Resp. Material:</Text>
                        <Badge colorScheme="green" size="sm">
                          {selectedActividadRetraso.responsables.material.nombre}
                        </Badge>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Acciones recomendadas */}
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    Esta actividad ha finalizado hace {selectedActividadRetraso.diasRetraso} días 
                    pero aún está marcada como "en curso"
                    {selectedActividadRetraso.prestamosActivos > 0 && 
                      ` y tiene ${selectedActividadRetraso.prestamosActivos} préstamo(s) activo(s)`
                    }.
                    Se recomienda finalizar la actividad y contactar a los responsables.
                  </AlertDescription>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRetrasoClose}>
              Cerrar
            </Button>
            <Button
              colorScheme="red"
              onClick={() => selectedActividadRetraso && handleFinalizarActividad(selectedActividadRetraso)}
            >
              Marcar como Finalizada
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default MisActividadesPage;
