import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Alert, AlertIcon, Spinner, Center, Heading, Text,
  Flex, Badge, Card, CardBody, Grid, GridItem, List, ListItem, 
  HStack, IconButton, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay
} from '@chakra-ui/react';
import { FiEdit, FiPackage, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import InfoEditor from '../../components/actividades/InfoEditor';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';
import { useActividadForm } from '../../hooks/useActividadForm';
import { useActividadPageData } from '../../hooks/useActividadPageData';
import { useActividadPageUI } from '../../hooks/useActividadPageUI';
import { useActividadPageActions } from '../../hooks/useActividadPageActions';
import { useActividadPagePermissions } from '../../hooks/useActividadPagePermissions';
import { ActividadPageHeader } from '../../components/actividades/ActividadPageHeader';
import { ActividadPageTabs } from '../../components/actividades/ActividadPageTabs';
import { Actividad } from '../../types/actividad';

/**
 * Página dedicada para mostrar todos los datos referentes a una actividad
 * Refactorizada para usar hooks especializados y componentes UI puros
 */
const ActividadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    prestamos,
    addedToCalendar,
    setAddedToCalendar,
    loadingData,
    errorData
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
    totalEnlaces
  } = useActividadPagePermissions({
    actividad,
    currentUserId: userProfile?.uid
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
  const materialEditorRef = useRef<{ submitForm: () => void }>(null);
  const participantesEditorRef = useRef<{ submitForm: () => void }>(null);
  const enlacesEditorRef = useRef<{ submitForm: () => void }>(null);

  // Funciones de renderizado para cada pestaña
  const renderInfoTab = () => {
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
                <Heading size="md">Información básica</Heading>
                {puedeEditar && (
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
    );
  };

  const renderParticipantesTab = () => {
    return (
      <Flex direction="column" gap={4}>
        <Flex justify="space-between" align="center">
          <Heading size="md">Participantes ({participantes.length})</Heading>
        </Flex>

        {editingParticipantes ? (
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
            ref={participantesEditorRef}
          />
        ) : (
          <Card>
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Listado de participantes</Heading>
                {puedeEditar && (
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
      </Flex>
    );
  };

  const renderMaterialTab = () => {
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
                {puedeEditar && (
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
    );
  };

  const renderEnlacesTab = () => {
    return (
      <Flex direction="column" gap={4}>
        <Flex justify="space-between" align="center">
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
                {puedeEditar && (
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
                <List spacing={2}>
                  {actividad.enlacesWikiloc.map((enlace, index) => (
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

              <Heading size="sm" mb={2}>Enlaces Topografías</Heading>
              {actividad.enlacesTopografias?.length ? (
                <List spacing={2}>
                  {actividad.enlacesTopografias.map((enlace, index) => (
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

              <Heading size="sm" mb={2}>Enlaces Google Drive</Heading>
              {actividad.enlacesDrive?.length ? (
                <List spacing={2}>
                  {actividad.enlacesDrive.map((enlace, index) => (
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

              <Heading size="sm" mb={2}>Enlaces Web</Heading>
              {actividad.enlacesWeb?.length ? (
                <List spacing={2}>
                  {actividad.enlacesWeb.map((enlace, index) => (
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
                <Text fontSize="sm" color="gray.500" mb={4}>No hay enlaces web</Text>
              )}
            </CardBody>
          </Card>
        )}
      </Flex>
    );
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
          <ActividadPageHeader
            actividad={actividad}
            formatDate={formatDate}
            getEstadoColor={getEstadoColor}
            esResponsable={esResponsable}
            onCancelarActividad={() => setIsConfirmOpen(true)}
          />
          
          {/* Pestañas con información detallada */}
          <ActividadPageTabs
            activeTabIndex={activeTabIndex}
            onTabChange={handleTabChange}
            participantesCount={participantes.length}
            materialesCount={actividad.materiales?.length || 0}
            enlacesCount={totalEnlaces}
          >
            {renderInfoTab()}
            {renderParticipantesTab()}
            {renderMaterialTab()}
            {renderEnlacesTab()}
          </ActividadPageTabs>
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
                  handleCancelarActividad();
                  setIsConfirmOpen(false);
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
