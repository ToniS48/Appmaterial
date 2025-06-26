// filepath: c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial\src\pages\actividades\ActividadPage.clean.tsx
import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Alert, AlertIcon, Spinner, Center, Heading, Text,
  Flex, Badge, Card, CardBody, Grid, GridItem, List, ListItem, 
  HStack, IconButton, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useToast,
  Tabs, TabList, Tab, TabPanels, TabPanel
} from '@chakra-ui/react';
import { FiPackage, FiGlobe, FiArrowLeft, FiSave, FiFileText, FiUsers, FiLink, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import InfoEditor from '../../components/actividades/InfoEditor';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';
import { useActividadForm } from '../../hooks/useActividadForm';
import { useActividadPageUI } from '../../hooks/useActividadPageUI';
import { useActividadPageData } from '../../hooks/useActividadPageData';
import { useActividadPagePermissions } from '../../hooks/useActividadPagePermissions';
import { useActividadPageActions } from '../../hooks/useActividadPageActions';
import { ActividadPageHeader } from '../../components/actividades/ActividadPageHeader';
import { Actividad } from '../../types/actividad';

// Tipos para los materiales en el formulario
interface MaterialFormData {
  materialId: string;
  nombre?: string;
  cantidad?: number | string;
}

// Tipos para los enlaces
interface EnlacesData {
  enlacesWikiloc: { url: string; esEmbed: boolean }[];
  enlacesTopografias: string[];
  enlacesDrive: string[];
  enlacesWeb: string[];
}

/**
 * Página dedicada para mostrar todos los datos referentes a una actividad
 * Refactorizada para usar hooks especializados y componentes UI puros
 */
const ActividadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { userProfile } = useAuth();

  // Hook principal para gestión del formulario
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

  // Cast seguro a Actividad para componentes
  const actividad = formData as Actividad;
  // Hook para datos adicionales (participantes, préstamos, calendario)
  const {
    participantes,
    addedToCalendar,
    setAddedToCalendar
  } = useActividadPageData({
    actividad,
    actividadId: id,
    loading
  });

  // Hook para estados de UI (pestañas, edición, diálogos)
  const {
    activeTabIndex,
    handleTabChange,
    editingInfo,
    editingParticipantes,
    editingMaterial,
    editingEnlaces,
    setEditingInfo,
    setEditingParticipantes,
    setEditingMaterial,
    setEditingEnlaces,
    isConfirmOpen,
    setIsConfirmOpen,
    exitAllEditingModes
  } = useActividadPageUI();
  // Hook para permisos y cálculos
  const {
    esResponsable,
    puedeEditar,
    puedeGestionar,
    totalEnlaces
  } = useActividadPagePermissions({
    currentUserId: userProfile?.uid,
    actividad
  });
  // Hook para acciones (calendario, finalizar, guardar, etc.)
  const {
    handleAddToCalendar,
    handleFinalizarActividad,
    handleSaveChanges,
    handleCancelarActividad,
    formatDate,
    getEstadoColor
  } = useActividadPageActions({
    actividadId: id,
    actividad,
    addedToCalendar,
    setAddedToCalendar,
    saveActividad: async () => {
      const result = await saveActividad();
      return !!result;
    },
    updateInfo,
    exitAllEditingModes
  });

  // Referencias para editores
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Funciones de renderizado para cada pestaña
  function renderInfoTab() {
    return editingInfo ? (
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
                <Heading size="md">Información básica</Heading>                {puedeEditar && (
                  <IconButton
                    aria-label="Editar información"
                    icon={<FiInfo />}
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
                    {actividad.tipo?.map((tipo: string) => (
                      <Badge key={tipo} colorScheme="blue">
                        {tipo}
                      </Badge>
                    ))}
                  </Flex>
                </ListItem>
                
                <ListItem>
                  <Text fontWeight="bold">Subtipos:</Text>
                  <Flex wrap="wrap" gap={2}>
                    {actividad.subtipo?.map((subtipo: string) => (
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
    );
  }

  function renderParticipantesTab() {
    return (
      <Flex direction="column" gap={4}>
        <Flex justify="space-between" align="center">
          <Heading size="md">Participantes ({participantes.length})</Heading>
        </Flex>        {editingParticipantes ? (
          <ParticipantesEditor
            data={actividad}
            onSave={(participanteIds) => {
              updateParticipantes(participanteIds);
              setEditingParticipantes(false);
            }}
            onResponsablesChange={(responsableActividadId, responsableMaterialId) => {
              updateParticipantes(
                actividad.participanteIds || [],
                { responsableId: responsableActividadId, responsableMaterialId } 
              );
            }}
            onCancel={() => setEditingParticipantes(false)}
            actividadId={actividad.id}
          />
        ) : (
          <Card>
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Listado de participantes</Heading>                {puedeEditar && (
                  <Button
                    leftIcon={<FiUsers />}
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
      </Flex>
    );
  }

  function renderMaterialTab() {
    return (
      <Card>
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Material necesario</Heading>
            {puedeEditar && !editingMaterial && actividad.materiales && actividad.materiales.length > 0 && (
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
              onSave={(materiales: MaterialFormData[]) => {
                updateMaterial(materiales);
                setEditingMaterial(false);
              }}
              onCancel={() => setEditingMaterial(false)}
              mostrarBotones={false}
            />
          ) : (
            <>
              <Flex justify="space-between" align="center" mb={4}>
                <Text>Material necesario para esta actividad:</Text>                {puedeEditar && (
                  <Button 
                    size="sm" 
                    leftIcon={<FiPackage />}
                    onClick={() => setEditingMaterial(true)}
                  >
                    Editar material
                  </Button>
                )}
              </Flex>              {actividad.materiales && actividad.materiales.length > 0 ? (
                <List spacing={3}>
                  {actividad.materiales.map((material, index: number) => (
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
    );
  }

  function renderEnlacesTab() {
    return (
      <Flex direction="column" gap={4}>
        <Flex justify="space-between" align="center">
          <Heading size="md">Enlaces ({totalEnlaces})</Heading>
        </Flex>

        {editingEnlaces ? (
          <EnlacesEditor
            data={actividad}
            onSave={(enlaces: EnlacesData) => {
              updateEnlaces(enlaces);
              setEditingEnlaces(false);
            }}
            onCancel={() => setEditingEnlaces(false)}
          />
        ) : (
          <Card>
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Text>Enlaces relacionados con esta actividad:</Text>                {puedeEditar && (
                  <Button 
                    size="sm" 
                    leftIcon={<FiLink />}
                    onClick={() => setEditingEnlaces(true)}
                  >
                    Editar enlaces
                  </Button>
                )}
              </Flex>

              {/* Enlaces Wikiloc */}
              <Heading size="sm" mb={2}>Enlaces Wikiloc</Heading>
              {actividad.enlacesWikiloc?.length ? (
                <List spacing={2} mb={4}>
                  {actividad.enlacesWikiloc.map((enlace: { url: string; esEmbed: boolean }, index: number) => (
                    <ListItem key={index}>
                      <Button
                        as="a"
                        href={enlace.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        leftIcon={<FiGlobe />}
                        variant="link"
                        colorScheme="blue"
                      >
                        {enlace.url}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text fontSize="sm" color="gray.500" mb={4}>No hay enlaces de Wikiloc</Text>
              )}

              {/* Enlaces Topografías */}
              <Heading size="sm" mb={2}>Enlaces Topografías</Heading>
              {actividad.enlacesTopografias?.length ? (
                <List spacing={2} mb={4}>
                  {actividad.enlacesTopografias.map((enlace: string, index: number) => (
                    <ListItem key={index}>
                      <Button
                        as="a"
                        href={enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        leftIcon={<FiGlobe />}
                        variant="link"
                        colorScheme="blue"
                      >
                        {enlace}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text fontSize="sm" color="gray.500" mb={4}>No hay enlaces de topografías</Text>
              )}

              {/* Enlaces Drive */}
              <Heading size="sm" mb={2}>Enlaces Google Drive</Heading>
              {actividad.enlacesDrive?.length ? (
                <List spacing={2} mb={4}>
                  {actividad.enlacesDrive.map((enlace: string, index: number) => (
                    <ListItem key={index}>
                      <Button
                        as="a"
                        href={enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        leftIcon={<FiGlobe />}
                        variant="link"
                        colorScheme="blue"
                      >
                        {enlace}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text fontSize="sm" color="gray.500" mb={4}>No hay enlaces de Google Drive</Text>
              )}

              {/* Enlaces Web */}
              <Heading size="sm" mb={2}>Enlaces Web</Heading>
              {actividad.enlacesWeb?.length ? (
                <List spacing={2}>
                  {actividad.enlacesWeb.map((enlace: string, index: number) => (
                    <ListItem key={index}>
                      <Button
                        as="a"
                        href={enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        leftIcon={<FiGlobe />}
                        variant="link"
                        colorScheme="blue"
                      >
                        {enlace}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text fontSize="sm" color="gray.500">No hay enlaces web</Text>
              )}

              {totalEnlaces === 0 && (
                <Text>No hay enlaces registrados para esta actividad.</Text>
              )}
            </CardBody>
          </Card>
        )}
      </Flex>
    );
  }

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
          <ActividadPageHeader
            actividad={actividad}
            formatDate={formatDate}
            getEstadoColor={getEstadoColor}
            esResponsable={esResponsable}
            onCancelarActividad={() => setIsConfirmOpen(true)}
          />
            {/* Pestañas con información detallada */}          <Tabs index={activeTabIndex} onChange={handleTabChange} variant="enclosed" colorScheme="brand">
            <TabList 
              mb={4}
              overflowX="auto" 
              sx={{
                // Estilos para scroll horizontal en caso necesario
                '::-webkit-scrollbar': {
                  height: '4px',
                },
                '::-webkit-scrollbar-track': {
                  bg: 'gray.100',
                },
                '::-webkit-scrollbar-thumb': {
                  bg: 'gray.300',
                  borderRadius: '4px',
                },
              }}            >
              <Tab>
                <FiFileText style={{ marginRight: '5px' }} />
                Información
              </Tab>
              <Tab>
                <FiUsers style={{ marginRight: '5px' }} />
                Participantes ({participantes.length})
              </Tab>
              <Tab>
                <FiPackage style={{ marginRight: '5px' }} />
                Material ({actividad.materiales?.length || 0})
              </Tab>
              <Tab>
                <FiLink style={{ marginRight: '5px' }} />
                Enlaces ({totalEnlaces})
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                {renderInfoTab()}
              </TabPanel>
              
              <TabPanel>
                {renderParticipantesTab()}
              </TabPanel>
              
              <TabPanel>
                {renderMaterialTab()}
              </TabPanel>
              
              <TabPanel>
                {renderEnlacesTab()}
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          {/* Botones de acción */}
          <Box pt={4} pb={2} borderTop="1px" borderColor="gray.200" width="100%" mt={4}>
            <Flex justify="space-between" align="center">
              <Button
                leftIcon={<FiArrowLeft />}
                onClick={() => {
                  if (editingInfo || editingParticipantes || editingMaterial || editingEnlaces) {
                    setEditingInfo(false);
                    setEditingParticipantes(false);
                    setEditingMaterial(false);
                    setEditingEnlaces(false);
                  } else {
                    navigate('/activities');
                  }
                }}
              >
                {editingInfo || editingParticipantes || editingMaterial || editingEnlaces ? 'Cancelar' : 'Volver'}
              </Button>

              <HStack spacing={2}>
                {actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
                  <>
                    {!addedToCalendar && (
                      <Button
                        onClick={handleAddToCalendar}
                        colorScheme="blue"
                      >
                        Añadir al calendario
                      </Button>
                    )}
                    
                    {esResponsable && actividad.estado === 'en_curso' && (
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
