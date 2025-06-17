import React, { useState, useEffect, useMemo } from 'react';
import messages from '../../constants/messages';
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Spinner,
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Link,
  Divider
} from '@chakra-ui/react';
import { AddIcon, CalendarIcon } from '@chakra-ui/icons';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { listarActividades, obtenerActividadesProximas, obtenerActividadesClasificadas, unirseActividad } from '../../services/actividadService';
import { Actividad } from '../../types/actividad';
import ActividadDetalle from '../../components/actividades/ActividadDetalle';
import ActividadCard from '../../components/actividades/ActividadCard';
import { useAuth } from '../../contexts/AuthContext';

const ActividadesPage: React.FC = () => {
  // Estados
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [proximasActividades, setProximasActividades] = useState<Actividad[]>([]);
  const [actividadesResponsable, setActividadesResponsable] = useState<Actividad[]>([]);
  const [actividadesParticipante, setActividadesParticipante] = useState<Actividad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  
  // Hooks
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { userProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Cargar actividades
  const cargarActividades = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setIsLoading(true);
      
      // Cargar todas las actividades
      const todasActividades = await listarActividades();
      setActividades(todasActividades);      // Cargar próximas actividades
      const actividadesProximas = await obtenerActividadesProximas(5);
      setProximasActividades(actividadesProximas);
      
      // Cargar actividades clasificadas
      const { actividadesResponsable, actividadesParticipante } = await obtenerActividadesClasificadas(userProfile?.uid || '');
      
      console.log('🔍 ActividadesPage - Actividades responsable cargadas:', actividadesResponsable.length);
      console.log('🔍 ActividadesPage - Actividades participante cargadas:', actividadesParticipante.length);
      console.log('🔍 ActividadesPage - Usuario actual:', userProfile?.uid);
      
      setActividadesResponsable(actividadesResponsable);
      setActividadesParticipante(actividadesParticipante);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Nueva función que ignora caché explícitamente
  const cargarActividadesForzado = async () => {
    try {
      setIsLoading(true);
      // Pasar true para indicar que debe ignorar caché
      const todasActividades = await listarActividades(undefined, true);
      setActividades(todasActividades);
        // También actualizar las demás listas
      const actividadesProximas = await obtenerActividadesProximas(5, { ignoreCache: true });
      setProximasActividades(actividadesProximas);
      
      // Cargar actividades clasificadas
      const { actividadesResponsable, actividadesParticipante } = await obtenerActividadesClasificadas(userProfile?.uid || '');
      
      setActividadesResponsable(actividadesResponsable);
      setActividadesParticipante(actividadesParticipante);
    } catch (error) {
      console.error("Error al cargar actividades:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
    useEffect(() => {
    const needsRefresh = sessionStorage.getItem('actividades_cache_invalidated') === 'true';
    if (needsRefresh) {
      // Eliminar el flag
      sessionStorage.removeItem('actividades_cache_invalidated');
      // Forzar carga ignorando caché
      cargarActividadesForzado();
    } else {
      // Forzar carga inicial sin caché para actividades próximas
      cargarActividadesForzado();
    }
  }, [userProfile?.uid]);
  // Función para unirse a una actividad
  const handleUnirseActividad = async (actividadId: string) => {
    if (!userProfile?.uid) return;
    
    try {
      await unirseActividad(actividadId, userProfile.uid);
      toast({
        title: "¡Te has unido!",
        description: "Te has unido correctamente a la actividad",
        status: "success",
        duration: 3000,
        isClosable: true,
      });      
      // Recargar actividades para reflejar cambios
      await cargarActividades();
    } catch (error) {
      console.error('Error al unirse a la actividad:', error);
      toast({
        title: "Error",
        description: "No se pudo unir a la actividad",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Función para cancelar una actividad (solo para responsables)
  const handleCancelarActividad = async (actividad: Actividad) => {
    // Verificar que el usuario sea responsable
    const esResponsable = 
      actividad.creadorId === userProfile?.uid || 
      actividad.responsableActividadId === userProfile?.uid || 
      actividad.responsableMaterialId === userProfile?.uid;

    if (!esResponsable) {
      toast({
        title: "Sin permisos",
        description: "Solo los responsables pueden cancelar actividades",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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
      const { cancelarActividad } = await import('../../services/actividadService');
      
      console.log(`🚫 Cancelando actividad: ${actividad.nombre}`);
      await cancelarActividad(actividad.id!);
      
      // Si tenía material, devolverlo automáticamente
      if (actividad.necesidadMaterial && actividad.materiales?.length > 0) {
        try {
          const { devolverTodosLosMaterialesActividad } = await import('../../services/prestamoService');
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
      await cargarActividades();
      
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
    // Separar actividades actuales de antiguas para la pestaña "Todas"
  const actividadesSeparadas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear a medianoche para comparación de fechas
    
    const actuales: Actividad[] = [];
    const antiguas: Actividad[] = [];
    
    actividades.forEach(actividad => {
      const fechaActividad = actividad.fechaInicio instanceof Date 
        ? actividad.fechaInicio 
        : actividad.fechaInicio.toDate();
      
      fechaActividad.setHours(0, 0, 0, 0); // Resetear a medianoche para comparación
      
      // Una actividad va a "Actividades Realizadas" si:
      // 1. Su estado es 'finalizada' O 'cancelada', O
      // 2. Su fecha de inicio es anterior a hoy Y no está en estado 'planificada' o 'en_curso'
      const esRealizada = actividad.estado === 'finalizada' || actividad.estado === 'cancelada';
      const esPasadaYNoActiva = fechaActividad < hoy && !['planificada', 'en_curso'].includes(actividad.estado);
      
      if (esRealizada || esPasadaYNoActiva) {
        antiguas.push(actividad);
      } else {
        actuales.push(actividad);
      }
    });
    
    return { actuales, antiguas };
  }, [actividades]);

  // Formatear fecha
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  // Renderizar tarjeta de actividad
  const renderActividadCard = (actividad: Actividad) => {
    // Determinar si el usuario actual es responsable de la actividad
    const esResponsable = 
      actividad.creadorId === userProfile?.uid || 
      actividad.responsableActividadId === userProfile?.uid || 
      actividad.responsableMaterialId === userProfile?.uid;
      // Determinar si el usuario es participante pero no responsable
    const esParticipante = !esResponsable;    return (
      <ActividadCard 
        key={actividad.id}
        actividad={actividad}
        onVerDetalles={() => handleVerDetalle(actividad)}
        onEditar={esResponsable ? () => navigate(`/activities/edit/${actividad.id}`) : undefined}
        onCancelar={esResponsable ? () => handleCancelarActividad(actividad) : undefined}
        onUnirse={() => handleUnirseActividad(actividad.id as string)}
        variant="complete"
        mostrarBotones={true}
      />
    );
  };

  const handleVerDetalle = (actividad: Actividad) => {
    setSelectedActividad(actividad);
    onDetailOpen();
  };

  return (
    <DashboardLayout title="Actividades">
      <Box>
        <Flex 
          direction={{ base: "column", md: "row" }} 
          justify="space-between" 
          align={{ base: "start", md: "center" }}
          mb={6}
          gap={3}
        >
          <HStack 
            spacing={4} 
            direction={{ base: "column", md: "row" }}
            width={{ base: "100%", md: "auto" }}
          >
            <Button 
              leftIcon={<CalendarIcon />} 
              colorScheme="brand" 
              variant="outline"
              as={RouterLink}
              to="/activities/calendario"
              width={{ base: "100%", md: "auto" }}
            >
              Ver Calendario
            </Button>
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="brand" 
              onClick={() => navigate('/activities/create')}
              width={{ base: "100%", md: "auto" }}
            >
              Nueva Actividad
            </Button>
          </HStack>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <Tabs 
            variant="enclosed" 
            colorScheme="brand" 
            onChange={(index) => setTabIndex(index)}
            isLazy
          >            <TabList>
              <Tab>Todas</Tab>
              <Tab>Próximas</Tab>
              <Tab>Como Responsable</Tab>
              <Tab>Como Participante</Tab>
            </TabList>
            
            <TabPanels>              {/* Pestaña de Todas las Actividades - Con separación de actividades antiguas */}
              <TabPanel px={0}>
                {actividades.length > 0 ? (
                  <Box>
                    {/* Actividades actuales */}
                    {actividadesSeparadas.actuales.length > 0 && (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={6}>
                        {actividadesSeparadas.actuales.map(actividad => renderActividadCard(actividad))}
                      </SimpleGrid>
                    )}                    {/* Separador y actividades antiguas */}
                    {actividadesSeparadas.antiguas.length > 0 && (
                      <>
                        <Divider my={6} />
                        <Box mb={8}>
                          <Text 
                            fontSize="lg" 
                            color="gray.600" 
                            textAlign="center"
                            fontWeight="semibold"
                            mb={3}
                            pb={2}
                          >
                            Actividades Realizadas
                          </Text>
                          <Divider />
                        </Box>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                          {actividadesSeparadas.antiguas.map(actividad => renderActividadCard(actividad))}
                        </SimpleGrid>
                      </>
                    )}
                  </Box>
                ) : (
                  <Card>
                    <CardBody textAlign="center">
                      <Text>{messages.dashboard.sinActividadesDisponibles}</Text>
                      <Button 
                        mt={4} 
                        leftIcon={<AddIcon />} 
                        colorScheme="brand" 
                        size="sm"
                        onClick={() => navigate('/activities/create')}
                      >
                        {messages.dashboard.crearPrimeraActividad}
                      </Button>
                    </CardBody>
                  </Card>
                )}
              </TabPanel>

              {/* Las demás pestañas quedan igual, ya tenían el diseño correcto */}
              <TabPanel px={0}>
                {proximasActividades.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {proximasActividades.map(actividad => renderActividadCard(actividad))}
                  </SimpleGrid>
                ) : (
                  <Card>
                    <CardBody textAlign="center">
                      <Text>{messages.dashboard.sinActividadesProximas}</Text>
                    </CardBody>
                  </Card>
                )}
              </TabPanel>

              <TabPanel px={0}>
                {actividadesResponsable.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {actividadesResponsable.map(actividad => renderActividadCard(actividad))}
                  </SimpleGrid>
                ) : (
                  <Card>
                    <CardBody textAlign="center">
                      <Text>{messages.dashboard.sinActividadesResponsable}</Text>
                    </CardBody>
                  </Card>
                )}
              </TabPanel>              <TabPanel px={0}>
                {actividadesParticipante.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {actividadesParticipante.map(actividad => renderActividadCard(actividad))}
                  </SimpleGrid>
                ) : (
                  <Card>
                    <CardBody textAlign="center">
                      <Text>{messages.dashboard.sinActividadesParticipante}</Text>
                    </CardBody>
                  </Card>
                )}              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Box>

      {/* Modal para ver detalle de actividad */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedActividad ? (
              <>
                {selectedActividad.nombre}
                {selectedActividad.lugar && (
                  <Text as="span" fontWeight="normal" fontSize="md" ml={1}>
                    ({selectedActividad.lugar})
                  </Text>
                )}
                <Text fontSize="sm" color="gray.600" fontWeight="normal" mt={1}>
                  {formatDate(selectedActividad.fechaInicio)} 
                  {selectedActividad.fechaFin && (
                    <> → {formatDate(selectedActividad.fechaFin)}</>
                  )}
                </Text>
              </>
            ) : "Detalle de actividad"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedActividad && (
              <ActividadDetalle 
                actividad={selectedActividad}
                onClose={onDetailClose}
                onActividadUpdated={() => {
                  cargarActividades();
                  onDetailClose();
                }}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default ActividadesPage;