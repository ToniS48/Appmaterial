import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Spinner, Center, Alert, AlertIcon, Heading, Text, Flex, 
  Badge, Divider, List, ListItem, Tab, Tabs, TabList, TabPanel, 
  TabPanels, Grid, GridItem, Button, Stack, HStack, VStack, Link,
  Card, CardBody, IconButton, Tooltip, useToast, AlertDialog, AlertDialogOverlay, 
  AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Icon
} from '@chakra-ui/react';
import { CalendarIcon, ExternalLinkIcon, DownloadIcon, LinkIcon, CheckIcon } from '@chakra-ui/icons';
import { 
  FiCalendar, FiUsers, FiMapPin, FiFileText, FiLink, FiMessageSquare, FiEdit, FiArrowLeft, FiChevronLeft, FiChevronRight, FiSave, FiX, 
  FiStar, FiUser, FiPackage, FiClock, FiCheckCircle, 
  FiXCircle, FiAlertCircle 
} from 'react-icons/fi';
import IconBadge from '../../components/common/IconBadge';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ActividadDetalle from '../../components/actividades/ActividadDetalle';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import InfoEditor from '../../components/actividades/InfoEditor';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';
import { obtenerActividad, obtenerComentariosActividad, actualizarActividad, cancelarActividad } from '../../services/actividadService';
import { obtenerPrestamosPorActividad } from '../../services/prestamoService';
import { listarUsuariosPorIds } from '../../services/usuarioService';
import { Actividad, EstadoActividad } from '../../types/actividad';
import { Prestamo } from '../../types/prestamo';
import { Usuario } from '../../types/usuario';
import { formatDate, toDate, toTimestamp, normalizarFecha, compareDates, determinarEstadoActividad } from '../../utils/dateUtils';
import { validateActividadEnlaces } from '../../utils/actividadUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';

/**
 * Extrae el nombre del track de una URL de Wikiloc
 */
const extractWikilocTrackName = (url: string): string => {
  try {
    // Validar que es una URL de Wikiloc
    if (!url.includes('wikiloc.com')) {
      return `Track de Wikiloc`;
    }
    
    // Extraer la ruta de la URL
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Dividir la ruta en segmentos
    const segments = path.split('/').filter(s => s);
    
    // El formato típico de Wikiloc es /tipo-actividad/nombre-track/id
    // El nombre del track normalmente está en la posición 1 (0-indexed)
    if (segments.length >= 2) {
      // Convertir guiones a espacios y capitalizar palabras
      const trackNameRaw = segments[1];
      const trackName = trackNameRaw
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return trackName;
    }
    
    return `Track de Wikiloc`;
  } catch (error) {
    console.error('Error al extraer nombre del track:', error);
    return `Track de Wikiloc`;
  }
};

/**
 * Función para determinar estado automático de una actividad
 */
const determinarEstadoAutomatico = (actividad: Actividad): EstadoActividad => {
  // Si ya está cancelada, mantener ese estado
  if (actividad.estado === 'cancelada') {
    return 'cancelada';
  }

  const hoy = new Date();
  const fechaInicio = toDate(actividad.fechaInicio);
  const fechaFin = toDate(actividad.fechaFin);
  
  if (!fechaInicio || !fechaFin) return 'planificada';
  
  const hoyNormalizado = normalizarFecha(hoy);
  const inicioNormalizado = normalizarFecha(fechaInicio);
  const finNormalizado = normalizarFecha(fechaFin);
  
  // Verificar que todas las fechas se hayan normalizado correctamente
  if (!hoyNormalizado || !inicioNormalizado || !finNormalizado) return 'planificada';
  
  // Usar operador de coalescencia nula para manejar posibles valores nulos
  if ((compareDates(hoyNormalizado, finNormalizado) ?? 0) > 0) {
    // Hoy es después de la fecha de fin
    return 'finalizada';
  } else if ((compareDates(hoyNormalizado, inicioNormalizado) ?? 0) >= 0) {
    // Hoy es igual o después de la fecha de inicio
    return 'en_curso';
  } else {
    // Hoy es antes de la fecha de inicio
    return 'planificada';
  }
};

/**
 * Página dedicada para mostrar todos los datos referentes a una actividad
 */
const ActividadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const toast = useToast();
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [participantes, setParticipantes] = useState<Usuario[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<boolean>(false);
  const [editingInfo, setEditingInfo] = useState<boolean>(false);
  const [editingParticipantes, setEditingParticipantes] = useState<boolean>(false);
  const [editingEnlaces, setEditingEnlaces] = useState<boolean>(false);
  const [addedToCalendar, setAddedToCalendar] = useState<boolean>(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [formDataInfo, setFormDataInfo] = useState<Partial<Actividad> | null>(null);
  const [selectedParticipantes, setSelectedParticipantes] = useState<string[] | null>(null);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<Array<{
    materialId: string;
    nombre: string;
    cantidad: number;
  }> | null>(null);
  const [enlacesData, setEnlacesData] = useState<Partial<Actividad> | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Extraer la función fuera del useEffect, después de las definiciones de estados
  const cargarDatos = async () => {
    if (!id) {
      setError('Identificador de actividad no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Cargar actividad
      const actividadData = await obtenerActividad(id);
      setActividad(actividadData);
      
      // Cargar participantes
      if (actividadData.participanteIds?.length) {
        const usuariosData = await listarUsuariosPorIds(actividadData.participanteIds);
        setParticipantes(usuariosData);
      }
      
      // Cargar préstamos relacionados
      const prestamosData = await obtenerPrestamosPorActividad(id);
      setPrestamos(prestamosData);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('No se pudo cargar la información completa de la actividad');
    } finally {
      setLoading(false);
    }
  };

  // El useEffect debe simplemente llamar a esta función
  useEffect(() => {
    cargarDatos();
  }, [id]);

  // Verificar si ya se añadió al calendario (en useEffect)
  useEffect(() => {
    if (id) {
      const addedActivities = localStorage.getItem('calendarActivities');
      if (addedActivities) {
        try {
          const activitiesArray = JSON.parse(addedActivities);
          setAddedToCalendar(activitiesArray.includes(id));
        } catch (e) {
          console.error('Error parsing calendar activities from localStorage', e);
        }
      }
    }
  }, [id]);

  // Función para determinar si el usuario actual es responsable
  const esResponsable = () => {
    if (!userProfile || !actividad) return false;
    
    return (
      actividad.responsableActividadId === userProfile.uid || 
      actividad.creadorId === userProfile.uid ||
      actividad.responsableMaterialId === userProfile.uid
    );
  };

  // Función para determinar color de estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'planificada': return 'yellow';
      case 'en_curso': return 'green';
      case 'finalizada': return 'blue';
      case 'cancelada': return 'red';
      default: return 'gray';
    }
  };
// Añadir esta función después de la función getEstadoColor existente
const getEstadoLabel = (estado: string): string => {
  switch (estado) {
    case 'planificada':
      return 'Planificada';
    case 'en_curso':
      return 'En curso';
    case 'finalizada':
      return 'Finalizada';
    case 'cancelada':
      return 'Cancelada';
    default:
      return estado;
  }
};
  // Añadir esta función auxiliar después de getEstadoColor
  // Sistema común para manejar actualizaciones
  const handleActualizacionActividad = async (
    id: string,
    dataToUpdate: Partial<Actividad>,
    successMessage: string,
    errorMessage: string,
    callback: () => void
  ) => {
    try {
      // Verificar si son enlaces para usar validación específica
      if ('enlacesWikiloc' in dataToUpdate || 'enlacesTopografias' in dataToUpdate || 
          'enlacesDrive' in dataToUpdate || 'enlacesWeb' in dataToUpdate) {
        const enlacesError = validateActividadEnlaces(dataToUpdate);
        if (enlacesError) {
          toast({
            title: "Error en enlaces",
            description: enlacesError,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }
      
      // Si el update incluye fechas y la actividad no está cancelada, actualizar el estado automáticamente
      if (('fechaInicio' in dataToUpdate || 'fechaFin' in dataToUpdate) && actividad?.estado !== 'cancelada') {
        const fechaInicio = 'fechaInicio' in dataToUpdate ? 
          dataToUpdate.fechaInicio : actividad?.fechaInicio;
        const fechaFin = 'fechaFin' in dataToUpdate ? 
          dataToUpdate.fechaFin : actividad?.fechaFin;
        
        if (fechaInicio && fechaFin) {
          dataToUpdate.estado = determinarEstadoActividad(fechaInicio, fechaFin, actividad?.estado);
        }
      }

      // Preprocesar enlaces para asegurar arrays
      if ('enlacesWikiloc' in dataToUpdate && !dataToUpdate.enlacesWikiloc) {
        dataToUpdate.enlacesWikiloc = [];
      }
      if ('enlacesTopografias' in dataToUpdate && !dataToUpdate.enlacesTopografias) {
        dataToUpdate.enlacesTopografias = [];
      }
      if ('enlacesDrive' in dataToUpdate && !dataToUpdate.enlacesDrive) {
        dataToUpdate.enlacesDrive = [];
      }
      if ('enlacesWeb' in dataToUpdate && !dataToUpdate.enlacesWeb) {
        dataToUpdate.enlacesWeb = [];
      }

      // Si se actualizan enlaces, regenerar el array enlaces para compatibilidad
      if ('enlacesWikiloc' in dataToUpdate || 
          'enlacesTopografias' in dataToUpdate || 
          'enlacesDrive' in dataToUpdate || 
          'enlacesWeb' in dataToUpdate) {
        
        // Combinar los datos actuales con los nuevos para enlaces
        const enlacesWikiloc = dataToUpdate.enlacesWikiloc || actividad?.enlacesWikiloc || [];
        const enlacesTopografias = dataToUpdate.enlacesTopografias || actividad?.enlacesTopografias || [];
        const enlacesDrive = dataToUpdate.enlacesDrive || actividad?.enlacesDrive || [];
        const enlacesWeb = dataToUpdate.enlacesWeb || actividad?.enlacesWeb || [];
        
        dataToUpdate.enlaces = [
          ...enlacesWikiloc.map(e => e.url),
          ...enlacesTopografias,
          ...enlacesDrive,
          ...enlacesWeb
        ];
      }
      
      dataToUpdate.fechaActualizacion = Timestamp.fromDate(new Date());
      
      const actividadActualizada = await actualizarActividad(id, dataToUpdate);
      setActividad(actividadActualizada);
      
      toast({
        title: "¡Éxito!",
        description: successMessage,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      callback();
    } catch (error) {
      console.error("Error al actualizar actividad:", error);
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Función para cancelar actividad
  const handleCancelActividad = async () => {
    try {
      setIsCancelling(true);
      if (actividad?.id) {
        await cancelarActividad(actividad.id as string);
      } else {
        throw new Error("La actividad no está disponible para cancelar.");
      }
      
      toast({
        title: "Actividad cancelada",
        description: "La actividad ha sido cancelada correctamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Recargar datos para reflejar el cambio de estado
      await cargarDatos();
      
      // Cerrar el diálogo de confirmación
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Error al cancelar actividad:", error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la actividad. Inténtalo de nuevo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Calcular el total de enlaces
  const totalEnlaces = (
    (actividad?.enlacesWikiloc?.length || 0) + 
    (actividad?.enlacesTopografias?.length || 0) + 
    (actividad?.enlacesDrive?.length || 0) + 
    (actividad?.enlacesWeb?.length || 0)
  );

  // Añadir esta función en el componente ActividadPage
  const handleTabChange = (newTabIndex: number) => {
    // Primero activamos el modo edición para la pestaña de destino
    switch(newTabIndex) {
      case 0: setEditingInfo(true); break;
      case 1: setEditingParticipantes(true); break;
      case 2: setEditingMaterial(true); break;
      case 3: setEditingEnlaces(true); break;
    }
    
    // Luego actualizamos el índice de la pestaña
    setActiveTabIndex(newTabIndex);
  };

  return (
    <DashboardLayout title={actividad?.nombre || "Detalles de actividad"}>
      {loading ? (
        <Center p={10}>
          <Spinner size="xl" color="brand.500" />
        </Center>
      ) : error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : actividad ? (
        <Box maxW="1200px" mx="auto">
          {/* Encabezado con información principal */}
          <Card mb={6} borderLeft="8px solid" borderColor={`${getEstadoColor(actividad.estado)}.500`}>
            <CardBody>
              <Flex direction={{ base: "column", md: "row" }} justify="space-between" wrap="wrap">
                <Box mb={{ base: 4, md: 0 }}>
                  <Heading as="h1" size="lg">
                    {actividad.nombre}
                    {actividad.lugar && (
                      <Text as="span" fontWeight="normal" fontSize="md" ml={1}>
                        ({actividad.lugar})
                      </Text>
                    )}
                  </Heading>
                  
                  <Flex align="center" mt={2}>
                    <FiCalendar style={{ marginRight: '8px' }} />
                    <Text>
                      {formatDate(actividad.fechaInicio)} 
                      {actividad.fechaFin && (
                        <> → {formatDate(actividad.fechaFin)}</>
                      )}
                    </Text>
                  </Flex>
                </Box>
                
                <Box>
                  <Flex wrap="wrap" gap={2}>
                    <IconBadge 
                      icon={
                        actividad.estado === 'planificada' ? FiClock :
                        actividad.estado === 'en_curso' ? FiCheckCircle :
                        actividad.estado === 'finalizada' ? FiCheckCircle :
                        FiXCircle
                      } 
                      label={getEstadoLabel(actividad.estado)} 
                      color={getEstadoColor(actividad.estado)} 
                      size={5} 
                    />
                    
                    {actividad.tipo?.map(tipo => (
                      <IconBadge key={tipo} icon={FiCheckCircle} label={tipo} color="blue" size={5} />
                    ))}
                    
                    {actividad.dificultad && (
                      <IconBadge 
                        icon={
                          actividad.dificultad === 'baja' ? FiCheckCircle :
                          actividad.dificultad === 'media' ? FiClock :
                          FiAlertCircle
                        } 
                        label={`Dificultad: ${actividad.dificultad}`} 
                        color={
                          actividad.dificultad === 'baja' ? 'green' :
                          actividad.dificultad === 'media' ? 'blue' :
                          'orange'
                        } 
                        size={5} 
                      />
                    )}
                  </Flex>
                  
                  {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                    <Button 
                      leftIcon={<Icon as={FiX} />}
                      size="sm" 
                      colorScheme="red" 
                      variant="outline" 
                      mt={3}
                      onClick={() => setIsConfirmOpen(true)}
                    >
                      Cancelar actividad
                    </Button>
                  )}
                </Box>
              </Flex>
            </CardBody>
          </Card>
          
          {/* Información detallada en pestañas */}
          <Tabs 
            variant="enclosed" 
            colorScheme="brand"
            index={activeTabIndex}
            onChange={(index) => setActiveTabIndex(index)}
            sx={{
              '.chakra-tabs__tab[aria-selected=true]': {
                bg: 'brand.500',  // Cambiado de 'brand.600' a 'brand.500' para coincidir con el botón
                color: 'white',
                fontWeight: 'bold',
                borderBottomColor: 'brand.500',  // Cambiado de 'brand.600' a 'brand.500'
                position: 'relative',
                borderTopRadius: '10px',
                _after: {
                  content: '""',
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  bg: 'brand.500',  // Cambiado de 'brand.600' a 'brand.500'
                  borderRadius: '1px'
                },
                transform: 'translateY(-2px)',
                boxShadow: 'sm'
              },
              '.chakra-tabs__tab:hover:not([aria-selected=true])': {
                bg: 'rgba(147, 43, 113, 0.1)',  // Mantener el mismo efecto hover pero con color brand.500
                color: 'brand.500',  // Cambiado de 'brand.600' a 'brand.500'
              },
              '.chakra-tabs__tab-panel': {
                borderTop: '2px solid',
                borderColor: 'brand.500',  // Cambiado de 'brand.600' a 'brand.500'
                pt: 5
              },
              '.chakra-tabs__tab[aria-selected=true] .chakra-badge': {
                bg: 'white',
                color: 'brand.500',  // Cambiado de 'brand.600' a 'brand.500'
                opacity: 1
              }
            }}
          >
            <TabList>
              <Tab><FiFileText style={{marginRight: '8px'}} /> Información</Tab>
              <Tab>
                <Flex align="center">
                  <FiUsers style={{marginRight: '8px'}} /> 
                  Participantes
                  <Badge 
                    ml={2} 
                    colorScheme="brand" 
                    borderRadius="full" 
                    fontSize="xs"
                    opacity={1}  // Badge completamente opaco
                    bg="brand.500"
                    color="white"
                  >
                    {participantes.length}
                  </Badge>
                </Flex>
              </Tab>
              <Tab><FiPackage style={{marginRight: '8px'}} /> Material</Tab>
              <Tab>
                <Flex align="center">
                  <FiLink style={{marginRight: '8px'}} /> 
                  Enlaces
                  {totalEnlaces > 0 && (
                    <Badge 
                      ml={2} 
                      colorScheme="brand" 
                      borderRadius="full" 
                      fontSize="xs"
                      opacity={1}  // Badge completamente opaco
                      bg="brand.500"
                      color="white"
                    >
                      {totalEnlaces}
                    </Badge>
                  )}
                </Flex>
              </Tab>
            </TabList>
            
            <TabPanels>
              {/* Pestaña de Información */}
              <TabPanel>
                {editingInfo ? (
                  <InfoEditor
                    actividad={actividad}
                    onSave={(data) => {
                      setFormDataInfo(data);
                      handleActualizacionActividad(
                        actividad.id as string,
                        data,
                        "Información actualizada correctamente",
                        "Error al actualizar la información",
                        () => setEditingInfo(false)
                      );
                    }}
                    onCancel={() => setEditingInfo(false)}
                    mostrarBotones={false}
                  />
                ) : (
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                    <GridItem>
                      <Card height="100%">
                        <CardBody>
                          <Heading size="md" mb={3}>Información básica</Heading>
                          <List spacing={3}>
                            <ListItem>
                              <Text fontWeight="bold">Tipo:</Text> 
                              <HStack mt={1} wrap="wrap">
                                {actividad.tipo?.map(tipo => (
                                  <Badge key={tipo} colorScheme="blue">{tipo}</Badge>
                                ))}
                              </HStack>
                            </ListItem>
                            <ListItem>
                              <Text fontWeight="bold">Subtipo:</Text>
                              <HStack mt={1} wrap="wrap">
                                {actividad.subtipo?.map(subtipo => (
                                  <Badge key={subtipo} colorScheme="purple">{subtipo}</Badge>
                                ))}
                              </HStack>
                            </ListItem>
                            <ListItem>
                              <Text fontWeight="bold">Estado:</Text> 
                              <Badge colorScheme={getEstadoColor(actividad.estado)}>
                                {actividad.estado}
                              </Badge>
                            </ListItem>
                            {actividad.dificultad && (
                              <ListItem>
                                <Text fontWeight="bold">Dificultad:</Text>
                                <Badge colorScheme={
                                  actividad.dificultad === 'baja' ? 'green' : 
                                  actividad.dificultad === 'media' ? 'blue' : 'orange'
                                }>
                                  {actividad.dificultad}
                                </Badge>
                              </ListItem>
                            )}
                          </List>
                        </CardBody>
                      </Card>
                    </GridItem>
                    
                    {/* Fechas */}
                    <GridItem>
                      <Card height="100%">
                        <CardBody>
                          <Heading size="md" mb={3}>Fechas</Heading>
                          <List spacing={3}>
                            <ListItem>
                              <Text fontWeight="bold">Inicio:</Text>
                              <Text>{formatDate(actividad.fechaInicio)}</Text>
                            </ListItem>
                            <ListItem>
                              <Text fontWeight="bold">Fin:</Text>
                              <Text>{formatDate(actividad.fechaFin)}</Text>
                            </ListItem>
                            <ListItem>
                              <Text fontWeight="bold">Creación:</Text>
                              <Text>{formatDate(actividad.fechaCreacion)}</Text>
                            </ListItem>
                            <ListItem>
                              <Text fontWeight="bold">Última actualización:</Text>
                              <Text>{formatDate(actividad.fechaActualizacion)}</Text>
                            </ListItem>
                          </List>
                        </CardBody>
                      </Card>
                    </GridItem>
                  </Grid>
                )}
              </TabPanel>
              
              {/* Pestaña de Participantes */}
              <TabPanel>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md">Participantes ({participantes.length})</Heading>
                </Flex>

                {editingParticipantes ? (
                  <ParticipantesEditor
                    actividad={actividad}
                    onSave={(participanteIds) => {
                      handleActualizacionActividad(
                        actividad.id as string,
                        { participanteIds },
                        "Participantes actualizados",
                        "Error al actualizar participantes",
                        () => setEditingParticipantes(false)
                      );
                    }}
                    onCancel={() => setEditingParticipantes(false)}
                    mostrarBotones={false}
                  />
                ) : (
                  <Card>
                    <CardBody>
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
                        {participantes.map(participante => (
                          <GridItem key={participante.uid}>
                            <Card borderWidth="1px" borderRadius="md" overflow="hidden">
                              <CardBody>
                                <Flex justify="space-between" align="center">
                                  <Text fontWeight="bold">{participante.nombre} {participante.apellidos}</Text>
                                  <Stack direction="row" spacing={1}>
                                    {participante.uid === actividad.creadorId && (
                                      <Badge colorScheme="purple">Creador</Badge>
                                    )}
                                    {participante.uid === actividad.responsableActividadId && (
                                      <Badge colorScheme="blue">Responsable</Badge>
                                    )}
                                    {participante.uid === actividad.responsableMaterialId && (
                                      <Badge colorScheme="cyan">R. Material</Badge>
                                    )}
                                  </Stack>
                                </Flex>
                              </CardBody>
                            </Card>
                          </GridItem>
                        ))}
                      </Grid>
                      
                      {participantes.length === 0 && (
                        <Text>No hay participantes registrados para esta actividad.</Text>
                      )}
                    </CardBody>
                  </Card>
                )}
              </TabPanel>
              
              {/* Pestaña de Material */}
              <TabPanel>
                <Card>
                  <CardBody>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="md">Material necesario</Heading>
                      {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && 
                       !editingMaterial && actividad.materiales && actividad.materiales.length > 0 && (
                        <Button 
                          colorScheme="brand" 
                          size="sm"
                          leftIcon={<FiPackage />}
                          onClick={() => navigate(`/activities/${actividad.id}/material`)}
                        >
                          Gestionar préstamo
                        </Button>
                      )}
                    </Flex>

                    {editingMaterial ? (
                      <MaterialEditor 
                        actividad={actividad} 
                        onSave={(materiales) => {
                          handleActualizacionActividad(
                            actividad.id as string,
                            { 
                              materiales,
                              necesidadMaterial: materiales.length > 0
                            },
                            "Material actualizado",
                            "Error al actualizar el material",
                            () => setEditingMaterial(false)
                          );
                        }}
                        onCancel={() => setEditingMaterial(false)}
                        mostrarBotones={false}
                      />
                    ) : (
                      <>
                        {actividad.materiales && actividad.materiales.length > 0 ? (
                          <List spacing={3}>
                            {actividad.materiales.map((material, index) => (
                              <ListItem key={index}>
                                <Flex justify="space-between">
                                  <Text>{material.nombre}</Text>
                                  <Badge colorScheme="brand">Cantidad: {material.cantidad}</Badge>
                                </Flex>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Text>No se ha especificado material para esta actividad.</Text>
                        )}
                      </>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
              
              {/* Pestaña de Enlaces */}
              <TabPanel>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md">Enlaces ({totalEnlaces})</Heading>
                </Flex>

                {editingEnlaces ? (
                  <EnlacesEditor
                    actividad={actividad}
                    onSave={(enlaces) => {
                      handleActualizacionActividad(
                        actividad.id as string,
                        enlaces,
                        "Enlaces actualizados",
                        "Error al actualizar enlaces",
                        () => setEditingEnlaces(false)
                      );
                    }}
                    onCancel={() => setEditingEnlaces(false)}
                    mostrarBotones={false}
                  />
                ) : (
                  <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
                    <TabList mb={4}>
                      {actividad.enlacesWikiloc?.length > 0 && (
                        <Tab>
                          Wikiloc
                          {actividad.enlacesWikiloc.length > 0 && (
                            <Badge ml={2} colorScheme="brand" variant="solid">
                              {actividad.enlacesWikiloc.length}
                            </Badge>
                          )}
                        </Tab>
                      )}

                      {actividad.enlacesTopografias?.length > 0 && (
                        <Tab>
                          Topografías
                          <Badge ml={2} colorScheme="brand" variant="solid">
                            {actividad.enlacesTopografias.length}
                          </Badge>
                        </Tab>
                      )}

                      {actividad.enlacesDrive?.length > 0 && (
                        <Tab>
                          Google Drive
                          <Badge ml={2} colorScheme="brand" variant="solid">
                            {actividad.enlacesDrive.length}
                          </Badge>
                        </Tab>
                      )}

                      {actividad.enlacesWeb?.length > 0 && (
                        <Tab>
                          Web
                          <Badge ml={2} colorScheme="brand" variant="solid">
                            {actividad.enlacesWeb.length}
                          </Badge>
                        </Tab>
                      )}
                    </TabList>

                    <TabPanels>
                      {/* Subpestaña de Wikiloc */}
                      {actividad.enlacesWikiloc?.length > 0 && (
                        <TabPanel px={0}>
                          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                            {/* Enlaces embebidos de Wikiloc */}
                            {actividad.enlacesWikiloc.some(e => e.esEmbed) && (
                              <GridItem colSpan={{ base: 1, md: 2 }}>
                                <Card>
                                  <CardBody>
                                    <Heading size="md" mb={3}>Mapas embebidos</Heading>
                                    <List spacing={6}>
                                      {actividad.enlacesWikiloc
                                        .filter(enlace => enlace.esEmbed)
                                        .map((enlace, index) => (
                                          <ListItem key={`embed-${index}`}>
                                            <Box 
                                              dangerouslySetInnerHTML={{ __html: enlace.url }} 
                                              borderWidth="1px" 
                                              borderRadius="md" 
                                              p={2} 
                                              bg="gray.50"
                                              w="100%"
                                              h="500px"
                                              overflow="hidden"
                                              sx={{
                                                "& iframe": {
                                                  width: "100% !important",
                                                  maxWidth: "100% !important",
                                                  height: "100% !important",
                                                  border: "none !important"
                                                },
                                                "& div": {
                                                  width: "100% !important",
                                                  maxWidth: "100% !important"
                                                }
                                              }}
                                            />
                                          </ListItem>
                                        ))}
                                    </List>
                                  </CardBody>
                                </Card>
                              </GridItem>
                            )}

                            {/* Enlaces normales de Wikiloc */}
                            {actividad.enlacesWikiloc.some(e => !e.esEmbed) && (
                              <GridItem colSpan={actividad.enlacesWikiloc.some(e => e.esEmbed) ? 1 : 2}>
                                <Card height="100%">
                                  <CardBody>
                                    <Heading size="md" mb={3}>Enlaces a Wikiloc</Heading>
                                    <List spacing={2}>
                                      {actividad.enlacesWikiloc
                                        .filter(enlace => !enlace.esEmbed)
                                        .map((enlace, index) => (
                                          <ListItem key={`link-${index}`}>
                                            <Flex align="center">
                                              <LinkIcon mr={2} />
                                              <Link href={enlace.url} isExternal color="blue.500">
                                                {extractWikilocTrackName(enlace.url) || `Track de Wikiloc ${index + 1}`}
                                                <ExternalLinkIcon mx="2px" />
                                              </Link>
                                            </Flex>
                                          </ListItem>
                                        ))}
                                    </List>
                                  </CardBody>
                                </Card>
                              </GridItem>
                            )}
                          </Grid>
                        </TabPanel>
                      )}

                      {/* Subpestaña de Topografías */}
                      {actividad.enlacesTopografias?.length > 0 && (
                        <TabPanel px={0}>
                          <Card>
                            <CardBody>
                              <Heading size="md" mb={3}>Topografías</Heading>
                              <List spacing={2}>
                                {actividad.enlacesTopografias.map((enlace, index) => (
                                  <ListItem key={index}>
                                    <Flex align="center">
                                      <FiMapPin style={{marginRight: '8px'}} />
                                      <Link href={enlace} isExternal color="blue.500">
                                        Topografía {index + 1}
                                        <ExternalLinkIcon mx="2px" />
                                      </Link>
                                    </Flex>
                                  </ListItem>
                                ))}
                              </List>
                            </CardBody>
                          </Card>
                        </TabPanel>
                      )}

                      {/* Subpestaña de Google Drive */}
                      {actividad.enlacesDrive?.length > 0 && (
                        <TabPanel px={0}>
                          <Card>
                            <CardBody>
                              <Heading size="md" mb={3}>Documentos en Drive</Heading>
                              <List spacing={2}>
                                {actividad.enlacesDrive.map((enlace, index) => (
                                  <ListItem key={index}>
                                    <Flex align="center">
                                      <FiFileText style={{marginRight: '8px'}} />
                                      <Link href={enlace} isExternal color="blue.500">
                                        Documento en Drive {index + 1}
                                        <ExternalLinkIcon mx="2px" />
                                      </Link>
                                    </Flex>
                                  </ListItem>
                                ))}
                              </List>
                            </CardBody>
                          </Card>
                        </TabPanel>
                      )}

                      {/* Subpestaña de Enlaces Web */}
                      {actividad.enlacesWeb?.length > 0 && (
                        <TabPanel px={0}>
                          <Card>
                            <CardBody>
                              <Heading size="md" mb={3}>Enlaces Web</Heading>
                              <List spacing={2}>
                                {actividad.enlacesWeb.map((enlace, index) => (
                                  <ListItem key={index}>
                                    <Flex align="center">
                                      <LinkIcon mr={2} />
                                      <Link href={enlace} isExternal color="blue.500">
                                        Enlace web {index + 1}
                                        <ExternalLinkIcon mx="2px" />
                                      </Link>
                                    </Flex>
                                  </ListItem>
                                ))}
                              </List>
                            </CardBody>
                          </Card>
                        </TabPanel>
                      )}
                    </TabPanels>
                  </Tabs>
                )}
                
                {/* Mensaje si no hay enlaces */}
                {(!actividad.enlacesWikiloc?.length && 
                  !actividad.enlacesTopografias?.length && 
                  !actividad.enlacesDrive?.length && 
                  !actividad.enlacesWeb?.length) && (
                    <Alert status="info">
                      <AlertIcon />
                      No hay enlaces registrados para esta actividad.
                    </Alert>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          {/* Botones de acción */}
          <Box pt={4} pb={2} borderTop="1px" borderColor="gray.200" width="100%" mt={4}>
            <Flex justify="space-between" maxW="1200px" mx="auto">
              {/* Botón izquierdo: Volver o Cancelar */}
              <Button 
                leftIcon={<FiArrowLeft />}
                onClick={() => {
                  if (editingInfo || editingParticipantes || editingMaterial || editingEnlaces) {
                    // Si estamos editando, cancelar la edición
                    setEditingInfo(false);
                    setEditingParticipantes(false);
                    setEditingMaterial(false);
                    setEditingEnlaces(false);
                  } else {
                    // Si no estamos editando, comportamiento normal de volver
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      navigate('/activities');
                    }
                  }
                }}
                variant="outline"
              >
                {editingInfo || editingParticipantes || editingMaterial || editingEnlaces ? 'Cancelar' : 'Volver'}
              </Button>
              
              {/* Grupo de botones derechos */}
              <HStack spacing={3}>
                {/* Cuando se está editando, mostrar navegación de pestañas si es relevante */}
                {(editingInfo || editingParticipantes || editingMaterial || editingEnlaces) && (
                  <>
                    <Button 
                      leftIcon={<FiChevronLeft />}
                      isDisabled={activeTabIndex === 0}
                      onClick={() => handleTabChange(activeTabIndex - 1)}
                      variant="ghost"
                    >
                      Anterior
                    </Button>
                    <Button 
                      rightIcon={<FiChevronRight />}
                      isDisabled={activeTabIndex >= 3}
                      onClick={() => handleTabChange(activeTabIndex + 1)}
                      variant="ghost"
                    >
                      Siguiente
                    </Button>
                    {/* Botón de Guardar */}
                    <Button 
                      colorScheme="brand"
                      leftIcon={<FiSave />}
                      onClick={() => {
                        // Llamar a la función de guardado apropiada según la pestaña activa
                        switch(activeTabIndex) {
                          case 0: 
                            // Guardar información
                            if (formDataInfo) {
                              handleActualizacionActividad(
                                actividad.id as string,
                                formDataInfo,
                                "Información actualizada correctamente",
                                "Error al actualizar la información",
                                () => setEditingInfo(false)
                              );
                            }
                            break;
                          case 1:
                            // Guardar participantes
                            if (selectedParticipantes) {
                              handleActualizacionActividad(
                                actividad.id as string,
                                { participanteIds: selectedParticipantes },
                                "Participantes actualizados correctamente",
                                "Error al actualizar los participantes",
                                () => setEditingParticipantes(false)
                              );
                            }
                            break;
                          case 2:
                            // Guardar material
                            if (materialesSeleccionados) {
                              handleActualizacionActividad(
                                actividad.id as string,
                                { 
                                  materiales: materialesSeleccionados,
                                  necesidadMaterial: materialesSeleccionados.length > 0 
                                },
                                "Material actualizado correctamente",
                                "Error al actualizar el material",
                                () => setEditingMaterial(false)
                              );
                            }
                            break;
                          case 3:
                            // Guardar enlaces
                            if (enlacesData) {
                              handleActualizacionActividad(
                                actividad.id as string,
                                enlacesData,
                                "Enlaces actualizados correctamente",
                                "Error al actualizar los enlaces",
                                () => setEditingEnlaces(false)
                              );
                            }
                            break;
                        }
                      }}
                    >
                      Guardar cambios
                    </Button>
                  </>
                )}
                
                {/* Botón de edición contextual cuando NO se está editando */}
                {esResponsable() && actividad?.estado !== 'cancelada' && actividad?.estado !== 'finalizada' && 
                 !editingInfo && !editingParticipantes && !editingMaterial && !editingEnlaces && 
                 activeTabIndex <= 3 && activeTabIndex !== 4 && (
                  <Button 
                    leftIcon={<FiEdit />}
                    colorScheme="brand"
                    onClick={() => {
                      // Activar el modo edición según la pestaña activa
                      switch(activeTabIndex) {
                        case 0: setEditingInfo(true); break;
                        case 1: setEditingParticipantes(true); break;
                        case 2: setEditingMaterial(true); break;
                        case 3: setEditingEnlaces(true); break;
                      }
                    }}
                  >
                    {`Editar ${
                      activeTabIndex === 0 ? 'información' : 
                      activeTabIndex === 1 ? 'participantes' : 
                      activeTabIndex === 2 ? 'material' : 'enlaces'
                    }`}
                  </Button>
                )}
              </HStack>
            </Flex>
          </Box>
        </Box>
      ) : (
        <Alert status="warning">
          <AlertIcon />
          No se encontró la actividad solicitada
        </Alert>
      )}

      {/* Diálogo de confirmación para cancelar actividad */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancelar actividad
            </AlertDialogHeader>

            <AlertDialogBody>
              ¿Estás seguro de que deseas cancelar esta actividad? 
              Esta acción no se puede deshacer.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                No, mantener
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCancelActividad} 
                ml={3}
                isLoading={isCancelling}
              >
                Sí, cancelar actividad
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ActividadPage;