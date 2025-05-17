import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Alert, AlertIcon, Spinner, Center, Heading, Text,
  Tabs, TabList, Tab, TabPanels, TabPanel, Flex, Badge, Card, CardBody,
  Grid, GridItem, List, ListItem, HStack, IconButton, Tooltip,
  useToast, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay
} from '@chakra-ui/react';
import { FiEdit, FiX, FiCalendar, FiMapPin, FiPackage, FiPlus, FiUser, FiUsers, FiLink, FiArrowLeft, FiSave, FiClock, FiCheckCircle, FiAlertCircle, FiGlobe, FiFileText } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { obtenerPrestamosPorActividad } from '../../services/prestamoService';
import { finalizarActividad } from '../../services/actividadService';
import { Usuario } from '../../types/usuario';
import { Prestamo } from '../../types/prestamo';
import InfoEditor from '../../components/actividades/InfoEditor';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';
import { useActividadForm } from '../../hooks/useActividadForm';
import { Actividad } from '../../types/actividad';
import { listarUsuarios } from '../../services/usuarioService';

/**
 * Página dedicada para mostrar todos los datos referentes a una actividad
 */
const ActividadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const toast = useToast();
  const {
    formData,
    loading,
    error,
    isSaving,
    updateInfo,
    updateParticipantes,
    updateMaterial,
    updateEnlaces,
    saveActividad
  } = useActividadForm({ actividadId: id, usuarioId: userProfile?.uid });

  // Cast de formData a Actividad donde sea necesario para componentes que requieren tipo completo
  // Esto es seguro ya que useActividadForm garantiza la estructura básica de la actividad
  const actividad = formData as Actividad;

  // Estados locales solo para controlar UI de pestañas/edición
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingParticipantes, setEditingParticipantes] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(false);
  const [editingEnlaces, setEditingEnlaces] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [participantes, setParticipantes] = useState<Usuario[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  
  // Referencias para diálogo y componentes
  const cancelRef = useRef<HTMLButtonElement>(null);
  const materialEditorRef = useRef<{ submitForm: () => void }>(null);
  const participantesEditorRef = useRef<{ submitForm: () => void }>(null);
  const enlacesEditorRef = useRef<{ submitForm: () => void }>(null);

  // Función para cargar datos adicionales que no maneja useActividadForm
  const cargarDatosAdicionales = async () => {
    if (!id) return;

    try {
      // Cargar participantes
      const usuariosData = await listarUsuarios();
      if (actividad?.participanteIds?.length) {
        const participantesData = usuariosData.filter(u => 
          actividad.participanteIds.includes(u.uid)
        );
        setParticipantes(participantesData);
      }
      
      // Cargar préstamos
      const prestamosData = await obtenerPrestamosPorActividad(id);
      setPrestamos(prestamosData);
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
    }
  };

  // Cargar datos adicionales cuando cambia la actividad
  useEffect(() => {
    if (actividad && !loading) {
      cargarDatosAdicionales();
    }
  }, [actividad, loading]);

  // Verificar si ya se añadió al calendario
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
    
    return userProfile.uid === actividad.creadorId || 
           userProfile.uid === actividad.responsableActividadId ||
           userProfile.uid === actividad.responsableMaterialId;
  };

  // Obtener color para el estado de la actividad
  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'planificada': return 'yellow';
      case 'en_curso': return 'green';
      case 'finalizada': return 'blue';
      case 'cancelada': return 'red';
      default: return 'gray';
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Añadir actividad al calendario local
  const handleAddToCalendar = () => {
    if (id) {
      try {
        let activitiesArray = [];
        const saved = localStorage.getItem('calendarActivities');
        
        if (saved) {
          activitiesArray = JSON.parse(saved);
        }
        
        if (!activitiesArray.includes(id)) {
          activitiesArray.push(id);
          localStorage.setItem('calendarActivities', JSON.stringify(activitiesArray));
          setAddedToCalendar(true);
          
          toast({
            title: "Actividad añadida al calendario",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (e) {
        console.error('Error saving to localStorage', e);
      }
    }
  };

  // Cambio de pestaña con posible cambio de modo edición
  const handleTabChange = (newTabIndex: number) => {
    setActiveTabIndex(newTabIndex);
  };

  // Función para finalizar actividad
  const handleFinalizarActividad = async () => {
    if (!id) return;
    
    try {
      await finalizarActividad(id);
      toast({
        title: "Actividad finalizada",
        description: "La actividad ha sido marcada como finalizada",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Recargar datos
      saveActividad();
    } catch (error) {
      console.error('Error al finalizar actividad:', error);
      toast({
        title: "Error",
        description: "No se pudo finalizar la actividad",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Manejador de guardado
  const handleSaveChanges = async () => {
    const result = await saveActividad();
    if (result) {
      // Salir del modo edición activo
      setEditingInfo(false);
      setEditingParticipantes(false);
      setEditingMaterial(false);
      setEditingEnlaces(false);
    }
  };

  // Calcular total de enlaces
  const totalEnlaces = (
    (actividad?.enlacesWikiloc?.length || 0) + 
    (actividad?.enlacesTopografias?.length || 0) + 
    (actividad?.enlacesDrive?.length || 0) + 
    (actividad?.enlacesWeb?.length || 0)
  );

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
                      {formatDate(actividad.fechaInicio)} - {formatDate(actividad.fechaFin)}
                    </Text>
                  </Flex>
                  
                  <Flex align="center" mt={1}>
                    <FiMapPin style={{ marginRight: '8px' }} />
                    <Text>{actividad.lugar}</Text>
                  </Flex>
                  
                  <HStack mt={2} spacing={2}>
                    {actividad.tipo?.map(tipo => (
                      <Badge key={tipo} colorScheme="blue" fontSize="0.8em" borderRadius="full" px={2}>
                        {tipo}
                      </Badge>
                    ))}
                    
                    {actividad.subtipo?.map(subtipo => (
                      <Badge key={subtipo} colorScheme="teal" fontSize="0.8em" borderRadius="full" px={2}>
                        {subtipo}
                      </Badge>
                    ))}
                    
                    {actividad.dificultad && (
                      <Badge 
                        colorScheme={
                          actividad.dificultad === 'baja' ? 'green' :
                          actividad.dificultad === 'media' ? 'blue' :
                          'orange'
                        } 
                        fontSize="0.8em" 
                        borderRadius="full" 
                        px={2}
                      >
                        Dificultad {actividad.dificultad}
                      </Badge>
                    )}
                  </HStack>
                  
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
          
          {/* Pestañas con información detallada */}
          <Tabs index={activeTabIndex} onChange={handleTabChange} colorScheme="brand" variant="enclosed">
            <TabList>
              <Tab><FiFileText style={{ marginRight: '5px' }} /> Info</Tab>
              <Tab><FiUsers style={{ marginRight: '5px' }} /> Participantes ({participantes.length})</Tab>
              <Tab><FiPackage style={{ marginRight: '5px' }} /> Material ({actividad.materiales?.length || 0})</Tab>
              <Tab><FiLink style={{ marginRight: '5px' }} /> Enlaces ({totalEnlaces})</Tab>
            </TabList>
            
            <TabPanels>
              {/* Pestaña de Información */}
              <TabPanel>
                {editingInfo ? (
                  <InfoEditor
                    data={actividad}
                    onSave={(data) => {
                      updateInfo(data);
                      setEditingInfo(false);
                    }}
                    onCancel={() => setEditingInfo(false)}
                    mostrarBotones={false}
                  />
                ) : (
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <GridItem colSpan={1}>
                      <Card>
                        <CardBody>
                          <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="md">Información básica</Heading>
                            {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                              <IconButton
                                aria-label="Editar información"
                                icon={<FiEdit />}
                                size="sm"
                                onClick={() => setEditingInfo(true)}
                              />
                            )}
                          </Flex>
                          <List spacing={3}>
                            <ListItem>
                              <Text fontWeight="bold">Estado:</Text>
                              <Badge 
                                colorScheme={getEstadoColor(actividad.estado)}
                                fontSize="0.9em"
                                px={2}
                                py={0.5}
                                borderRadius="md"
                              >
                                {actividad.estado}
                              </Badge>
                            </ListItem>
                            
                            <ListItem>
                              <Text fontWeight="bold">Descripción:</Text>
                              <Text whiteSpace="pre-wrap">{actividad.descripcion || "No hay descripción disponible."}</Text>
                            </ListItem>
                            
                            <ListItem>
                              <Text fontWeight="bold">Tipos:</Text>
                              <Flex wrap="wrap" gap={2}>
                                {actividad.tipo?.map(tipo => (
                                  <Badge key={tipo} colorScheme="blue">
                                    {tipo}
                                  </Badge>
                                ))}
                              </Flex>
                            </ListItem>
                            
                            <ListItem>
                              <Text fontWeight="bold">Subtipos:</Text>
                              <Flex wrap="wrap" gap={2}>
                                {actividad.subtipo?.map(subtipo => (
                                  <Badge key={subtipo} colorScheme="teal">
                                    {subtipo}
                                  </Badge>
                                ))}
                              </Flex>
                            </ListItem>
                          </List>
                        </CardBody>
                      </Card>
                    </GridItem>
                    
                    <GridItem colSpan={1}>
                      <Card>
                        <CardBody>
                          <Heading size="md" mb={4}>Información adicional</Heading>
                          <List spacing={3}>
                            <ListItem>
                              <Text fontWeight="bold">Lugar:</Text>
                              <Text>{actividad.lugar}</Text>
                            </ListItem>
                            
                            <ListItem>
                              <Text fontWeight="bold">Fechas:</Text>
                              <Text>{formatDate(actividad.fechaInicio)}</Text>
                              <Text>hasta</Text>
                              <Text>{formatDate(actividad.fechaFin)}</Text>
                            </ListItem>
                            
                            <ListItem>
                              <Text fontWeight="bold">Creada:</Text>
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
                    data={actividad}
                    onSave={(participanteIds) => {
                      updateParticipantes(participanteIds);
                      setEditingParticipantes(false);
                    }}
                    onCancel={() => setEditingParticipantes(false)}
                    ref={participantesEditorRef}
                  />
                ) : (
                  <Card>
                    <CardBody>
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md">Listado de participantes</Heading>
                        {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                          <Button
                            leftIcon={<FiEdit />}
                            size="sm"
                            onClick={() => setEditingParticipantes(true)}
                          >
                            Editar participantes
                          </Button>
                        )}
                      </Flex>
                      
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
                        {participantes.map(participante => (
                          <GridItem key={participante.uid}>
                            <Card variant="outline">
                              <CardBody>
                                <Flex justify="space-between">
                                  <Box>
                                    <Heading size="sm">{participante.nombre} {participante.apellidos}</Heading>
                                    <Text fontSize="sm" color="gray.500">{participante.email}</Text>
                                  </Box>
                                </Flex>
                                
                                <HStack direction="row" mt={2} spacing={2}>
                                  {participante.uid === actividad.creadorId && (
                                    <Badge colorScheme="purple">Creador</Badge>
                                  )}
                                  {participante.uid === actividad.responsableActividadId && (
                                    <Badge colorScheme="red">Responsable</Badge>
                                  )}
                                  {participante.uid === actividad.responsableMaterialId && (
                                    <Badge colorScheme="cyan">R. Material</Badge>
                                  )}
                                </HStack>
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
                          onClick={() => navigate(`/activities/${id}/material`)}
                        >
                          Gestionar préstamo
                        </Button>
                      )}
                    </Flex>

                    {editingMaterial ? (
                      <MaterialEditor 
                        data={actividad} 
                        onSave={(materiales) => {
                          updateMaterial(materiales);
                          setEditingMaterial(false);
                        }}
                        onCancel={() => setEditingMaterial(false)}
                        mostrarBotones={false}
                        ref={materialEditorRef}
                      />
                    ) : (
                      <>
                        <Flex justify="space-between" align="center" mb={4}>
                          <Text>Material necesario para esta actividad:</Text>
                          {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                            <Button 
                              size="sm" 
                              leftIcon={<FiEdit />}
                              onClick={() => setEditingMaterial(true)}
                            >
                              Editar material
                            </Button>
                          )}
                        </Flex>

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
                    data={actividad}
                    onSave={(enlaces) => {
                      updateEnlaces(enlaces);
                      setEditingEnlaces(false);
                    }}
                    onCancel={() => setEditingEnlaces(false)}
                    ref={enlacesEditorRef}
                  />
                ) : (
                  <Card>
                    <CardBody>
                      <Flex justify="space-between" align="center" mb={4}>
                        <Text>Enlaces relacionados con esta actividad:</Text>
                        {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                          <Button 
                            size="sm" 
                            leftIcon={<FiEdit />}
                            onClick={() => setEditingEnlaces(true)}
                          >
                            Editar enlaces
                          </Button>
                        )}
                      </Flex>

                      <Heading size="sm" mb={2}>Enlaces Wikiloc</Heading>
                      {actividad.enlacesWikiloc?.length ? (
                        <Box mb={4}>
                          <List spacing={2}>
                            {actividad.enlacesWikiloc.map((enlace, index) => (
                              <ListItem key={index}>
                                <Flex align="center">
                                  <FiGlobe style={{ marginRight: '8px' }} />
                                  <Text>
                                    {enlace.esEmbed ? 'Código embebido' : (
                                      <Button
                                        as="a"
                                        href={enlace.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="link"
                                        colorScheme="blue"
                                        fontSize="sm"
                                      >
                                        {enlace.url}
                                      </Button>
                                    )}
                                  </Text>
                                </Flex>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ) : (
                        <Text mb={4} fontSize="sm" color="gray.500">No hay enlaces de Wikiloc registrados</Text>
                      )}

                      <Heading size="sm" mb={2}>Enlaces de Topografías</Heading>
                      {actividad.enlacesTopografias?.length ? (
                        <Box mb={4}>
                          <List spacing={2}>
                            {actividad.enlacesTopografias.map((enlace, index) => (
                              <ListItem key={index}>
                                <Flex align="center">
                                  <FiGlobe style={{ marginRight: '8px' }} />
                                  <Button
                                    as="a"
                                    href={enlace}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="link"
                                    colorScheme="blue"
                                    fontSize="sm"
                                  >
                                    {enlace}
                                  </Button>
                                </Flex>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ) : (
                        <Text mb={4} fontSize="sm" color="gray.500">No hay enlaces de topografías registrados</Text>
                      )}

                      <Heading size="sm" mb={2}>Enlaces de Google Drive</Heading>
                      {actividad.enlacesDrive?.length ? (
                        <Box mb={4}>
                          <List spacing={2}>
                            {actividad.enlacesDrive.map((enlace, index) => (
                              <ListItem key={index}>
                                <Flex align="center">
                                  <FiGlobe style={{ marginRight: '8px' }} />
                                  <Button
                                    as="a"
                                    href={enlace}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="link"
                                    colorScheme="blue"
                                    fontSize="sm"
                                  >
                                    {enlace}
                                  </Button>
                                </Flex>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ) : (
                        <Text mb={4} fontSize="sm" color="gray.500">No hay enlaces de Google Drive registrados</Text>
                      )}

                      <Heading size="sm" mb={2}>Enlaces Web</Heading>
                      {actividad.enlacesWeb?.length ? (
                        <Box mb={4}>
                          <List spacing={2}>
                            {actividad.enlacesWeb.map((enlace, index) => (
                              <ListItem key={index}>
                                <Flex align="center">
                                  <FiGlobe style={{ marginRight: '8px' }} />
                                  <Button
                                    as="a"
                                    href={enlace}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="link"
                                    colorScheme="blue"
                                    fontSize="sm"
                                  >
                                    {enlace}
                                  </Button>
                                </Flex>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ) : (
                        <Text mb={4} fontSize="sm" color="gray.500">No hay enlaces web registrados</Text>
                      )}

                      {totalEnlaces === 0 && (
                        <Alert status="info" mt={3}>
                          <AlertIcon />
                          No hay enlaces registrados para esta actividad.
                        </Alert>
                      )}
                    </CardBody>
                  </Card>
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
              >
                {editingInfo || editingParticipantes || editingMaterial || editingEnlaces ? 'Cancelar' : 'Volver'}
              </Button>
              
              {/* Botones de la derecha: dependiendo del contexto */}
              <HStack spacing={3}>
                {actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                  <>
                    {!addedToCalendar && (
                      <Button
                        onClick={handleAddToCalendar}
                        variant="outline"
                        colorScheme="blue"
                      >
                        Añadir al calendario
                      </Button>
                    )}
                    
                    {esResponsable() && actividad.estado === 'en_curso' && (
                      <Button
                        onClick={handleFinalizarActividad}
                        colorScheme="green"
                      >
                        Finalizar actividad
                      </Button>
                    )}
                  </>
                )}
                
                {/* Botón de guardar cambios cuando estamos editando */}
                {(editingInfo || editingParticipantes || editingMaterial || editingEnlaces) && (
                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="brand"
                    onClick={handleSaveChanges}
                    isLoading={isSaving}
                  >
                    Guardar {
                      editingInfo ? 'información' : 
                      editingParticipantes ? 'participantes' : 
                      editingMaterial ? 'material' : 'enlaces'
                    }
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
                No, volver
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => {
                  if (id) {
                    updateInfo({ estado: 'cancelada' });
                    setIsConfirmOpen(false);
                    toast({
                      title: "Actividad cancelada",
                      description: "La actividad ha sido cancelada correctamente",
                      status: "warning",
                      duration: 3000
                    });
                  }
                }} 
                ml={3}
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