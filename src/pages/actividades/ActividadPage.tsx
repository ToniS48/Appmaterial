import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Spinner, Center, Alert, AlertIcon, Heading, Text, Flex, 
  Badge, Divider, List, ListItem, Tab, Tabs, TabList, TabPanel, 
  TabPanels, Grid, GridItem, Button, Stack, HStack, VStack, Link,
  Card, CardBody, IconButton, Tooltip, useToast
} from '@chakra-ui/react';
import { CalendarIcon, ExternalLinkIcon, DownloadIcon, LinkIcon } from '@chakra-ui/icons';
import { FiCalendar, FiUsers, FiPackage, FiMapPin, FiFileText, FiLink, FiMessageSquare, FiEdit } from 'react-icons/fi';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ActividadDetalle from '../../components/actividades/ActividadDetalle';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import InfoEditor from '../../components/actividades/InfoEditor';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';
import { obtenerActividad, obtenerComentariosActividad, actualizarActividad } from '../../services/actividadService';
import { obtenerPrestamosPorActividad } from '../../services/prestamoService';
import { listarUsuariosPorIds } from '../../services/usuarioService';
import { Actividad } from '../../types/actividad';
import { Prestamo } from '../../types/prestamo';
import { Usuario } from '../../types/usuario';
import { formatDate } from '../../utils/dateUtils';
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

  // Calcular el total de enlaces
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
                      {formatDate(actividad.fechaInicio)} 
                      {actividad.fechaFin && (
                        <> → {formatDate(actividad.fechaFin)}</>
                      )}
                    </Text>
                  </Flex>
                </Box>
                
                <Box>
                  <Flex wrap="wrap" gap={2}>
                    <Badge colorScheme={getEstadoColor(actividad.estado)} fontSize="md" px={2} py={1}>
                      {actividad.estado}
                    </Badge>
                    
                    {actividad.tipo?.map(tipo => (
                      <Badge key={tipo} colorScheme="blue">{tipo}</Badge>
                    ))}
                    
                    {actividad.dificultad && (
                      <Badge colorScheme={
                        actividad.dificultad === 'baja' ? 'green' : 
                        actividad.dificultad === 'media' ? 'blue' : 'orange'
                      }>
                        Dificultad: {actividad.dificultad}
                      </Badge>
                    )}
                  </Flex>
                  
                  <Button 
                    leftIcon={<CalendarIcon />}
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline" 
                    mt={3}
                    onClick={() => {
                      // Lógica para añadir a Google Calendar
                      // Reusando la función de ActividadDetalle
                    }}
                  >
                    Añadir a Google Calendar
                  </Button>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          
          {/* Información detallada en pestañas */}
          <Tabs variant="enclosed" colorScheme="brand">
            <TabList>
              <Tab><FiFileText style={{marginRight: '8px'}} /> Información</Tab>
              <Tab>
                <Flex align="center">
                  <FiUsers style={{marginRight: '8px'}} /> 
                  Participantes
                  <Badge ml={2} colorScheme="brand" borderRadius="full" fontSize="xs">
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
                    <Badge ml={2} colorScheme="brand" borderRadius="full" fontSize="xs">
                      {totalEnlaces}
                    </Badge>
                  )}
                </Flex>
              </Tab>
              {prestamos.length > 0 && (
                <Tab>
                  <Flex align="center">
                    Préstamos
                    <Badge ml={2} colorScheme="brand" borderRadius="full" fontSize="xs">
                      {prestamos.length}
                    </Badge>
                  </Flex>
                </Tab>
              )}
            </TabList>
            
            <TabPanels>
              {/* Pestaña de Información */}
              <TabPanel>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md">Información</Heading>
                  {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                    <Button 
                      size="sm"
                      colorScheme="brand" 
                      leftIcon={<FiEdit />}
                      onClick={() => setEditingInfo(!editingInfo)}
                    >
                      {editingInfo ? 'Cancelar' : 'Editar información'}
                    </Button>
                  )}
                </Flex>

                {editingInfo ? (
                  <InfoEditor
                    actividad={actividad}
                    onSave={async (data) => {
                      try {
                        await actualizarActividad(actividad.id as string, { 
                          ...data,
                          fechaActualizacion: Timestamp.fromDate(new Date())
                        });
                        toast({
                          title: "Información actualizada",
                          status: "success",
                          duration: 3000,
                        });
                        cargarDatos(); // Recargar datos
                        setEditingInfo(false);
                      } catch (error) {
                        toast({
                          title: "Error al actualizar la información",
                          status: "error",
                          duration: 3000,
                        });
                      }
                    }}
                    onCancel={() => setEditingInfo(false)}
                  />
                ) : (
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                    {/* Descripción */}
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <Card>
                        <CardBody>
                          <Heading size="md" mb={3}>Descripción</Heading>
                          <Text>{actividad.descripcion || "Sin descripción disponible"}</Text>
                        </CardBody>
                      </Card>
                    </GridItem>
                    
                    {/* Detalles */}
                    <GridItem>
                      <Card height="100%">
                        <CardBody>
                          <Heading size="md" mb={3}>Detalles</Heading>
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
                  {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                    <Button 
                      size="sm"
                      colorScheme="brand" 
                      leftIcon={<FiEdit />}
                      onClick={() => setEditingParticipantes(!editingParticipantes)}
                    >
                      {editingParticipantes ? 'Cancelar' : 'Editar participantes'}
                    </Button>
                  )}
                </Flex>

                {editingParticipantes ? (
                  <ParticipantesEditor
                    actividad={actividad}
                    onSave={async (participanteIds) => {
                      try {
                        await actualizarActividad(actividad.id as string, { 
                          participanteIds,
                          fechaActualizacion: Timestamp.fromDate(new Date())
                        });
                        toast({
                          title: "Participantes actualizados",
                          status: "success",
                          duration: 3000,
                        });
                        cargarDatos(); // Recargar datos
                        setEditingParticipantes(false);
                      } catch (error) {
                        toast({
                          title: "Error al actualizar participantes",
                          status: "error",
                          duration: 3000,
                        });
                      }
                    }}
                    onCancel={() => setEditingParticipantes(false)}
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
                      {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                        <Box>
                          <Button 
                            size="sm"
                            colorScheme="brand" 
                            leftIcon={<FiEdit />}
                            mr={2}
                            onClick={() => setEditingMaterial(!editingMaterial)}
                          >
                            {editingMaterial ? 'Cancelar' : 'Editar material'}
                          </Button>
                          
                          {!editingMaterial && actividad.materiales && actividad.materiales.length > 0 && (
                            <Button 
                              colorScheme="brand" 
                              size="sm"
                              leftIcon={<FiPackage />}
                              onClick={() => navigate(`/activities/${actividad.id}/material`)}
                            >
                              Gestionar préstamo
                            </Button>
                          )}
                        </Box>
                      )}
                    </Flex>

                    {editingMaterial ? (
                      <MaterialEditor 
                        actividad={actividad} 
                        onSave={async (materiales) => {
                          try {
                            await actualizarActividad(actividad.id as string, { 
                              materiales,
                              necesidadMaterial: materiales.length > 0,
                              fechaActualizacion: Timestamp.fromDate(new Date())
                            });
                            toast({
                              title: "Material actualizado",
                              status: "success",
                              duration: 3000,
                            });
                            cargarDatos();
                            setEditingMaterial(false);
                          } catch (error) {
                            toast({
                              title: "Error al actualizar el material",
                              status: "error",
                              duration: 3000,
                            });
                          }
                        }}
                        onCancel={() => setEditingMaterial(false)}
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
                  {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                    <Button 
                      size="sm"
                      colorScheme="brand" 
                      leftIcon={<FiEdit />}
                      onClick={() => setEditingEnlaces(!editingEnlaces)}
                    >
                      {editingEnlaces ? 'Cancelar' : 'Editar enlaces'}
                    </Button>
                  )}
                </Flex>

                {editingEnlaces ? (
                  <EnlacesEditor
                    actividad={actividad}
                    onSave={async (enlaces) => {
                      try {
                        await actualizarActividad(actividad.id as string, enlaces);
                        toast({
                          title: "Enlaces actualizados",
                          status: "success",
                          duration: 3000,
                        });
                        cargarDatos(); // Recargar datos
                        setEditingEnlaces(false);
                      } catch (error) {
                        toast({
                          title: "Error al actualizar enlaces",
                          status: "error",
                          duration: 3000,
                        });
                      }
                    }}
                    onCancel={() => setEditingEnlaces(false)}
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
              
              {/* Pestaña de Préstamos (condicional) */}
              {prestamos.length > 0 && (
                <TabPanel>
                  <Card>
                    <CardBody>
                      <Heading size="md" mb={3}>Préstamos relacionados</Heading>
                      <List spacing={3}>
                        {prestamos.map(prestamo => (
                          <ListItem key={prestamo.id}>
                            <Card borderWidth="1px" borderRadius="md" p={3}>
                              <Flex justify="space-between">
                                <Box>
                                  <Text fontWeight="bold">{prestamo.nombreMaterial}</Text>
                                  <Text>Cantidad: {prestamo.cantidadPrestada}</Text>
                                </Box>
                                <Badge colorScheme={
                                  prestamo.estado === 'en_uso' ? 'green' : 
                                  prestamo.estado === 'devuelto' ? 'blue' : 'orange'
                                }>
                                  {prestamo.estado}
                                </Badge>
                              </Flex>
                            </Card>
                          </ListItem>
                        ))}
                      </List>
                    </CardBody>
                  </Card>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
          
          {/* Botones de acción */}
          <Flex justify="space-between" mt={6}>
            <Button 
              onClick={() => navigate('/activities')}
              variant="outline"
            >
              Volver a actividades
            </Button>
            
            {esResponsable() && actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
              <Button 
                colorScheme="blue"
                onClick={() => navigate(`/activities/edit/${actividad.id}`)}
              >
                Editar actividad
              </Button>
            )}
          </Flex>
        </Box>
      ) : (
        <Alert status="warning">
          <AlertIcon />
          No se encontró la actividad solicitada
        </Alert>
      )}
    </DashboardLayout>
  );
};

export default ActividadPage;