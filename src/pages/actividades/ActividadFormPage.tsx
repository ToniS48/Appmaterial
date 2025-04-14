import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, 
  Container, 
  Flex, 
  Heading, 
  Spinner, 
  Center, 
  Alert, 
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  useToast,
  Badge,
  Card,
  CardBody,
  HStack
} from '@chakra-ui/react';
import { FiFileText, FiUsers, FiPackage, FiLink, FiArrowLeft, FiChevronLeft, FiChevronRight, FiSave } from 'react-icons/fi';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { obtenerActividad, crearActividad, actualizarActividad } from '../../services/actividadService';
import { useAuth } from '../../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { Actividad, EstadoActividad } from '../../types/actividad';

// Importar los componentes de edición modular
import InfoEditor from '../../components/actividades/InfoEditor';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';

// Importar las nuevas funciones
import { normalizarFecha, toDate, toTimestamp, compareDates } from '../../utils/dateUtils';
import { validateActividad } from '../../utils/actividadUtils';
import { determinarEstadoActividad } from '../../utils/dateUtils';
import { validateActividadEnlaces } from '../../utils/actividadUtils';

const ActividadFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast({
    position: "top",
    duration: 5000,
    isClosable: true,
  });
  const { userProfile } = useAuth();
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<Actividad>>({});

  // Indicadores para saber qué secciones han sido editadas
  const [infoEdited, setInfoEdited] = useState<boolean>(false);
  const [participantesEdited, setParticipantesEdited] = useState<boolean>(false);
  const [materialEdited, setMaterialEdited] = useState<boolean>(false);
  const [enlacesEdited, setEnlacesEdited] = useState<boolean>(false);

  // Añade este estado
  const [isSaving, setIsSaving] = useState(false);

  // Añade esto antes del condicional alrededor de la línea 70
  const [isUserResponsable, setIsUserResponsable] = useState<boolean>(false);

  // Dentro del componente, antes de usar hasResponsableMaterial
  const hasResponsableMaterial = formData?.responsableMaterialId ? true : false;

  // Alternativa con comprobación explícita
  const checkIsUserResponsable = () => {
    if (!userProfile || !formData.responsableMaterialId) {
      return false;
    }
    return formData.responsableMaterialId === userProfile.uid;
  };

  // Modifica el condicional existente
  useEffect(() => {
    setIsUserResponsable(checkIsUserResponsable());
  }, [userProfile, formData.responsableMaterialId]);

  // Cargar actividad si estamos en modo edición
  useEffect(() => {
    const cargarActividad = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const actividadData = await obtenerActividad(id);
        setActividad(actividadData);
        setFormData(actividadData);
      } catch (error) {
        console.error('Error al cargar la actividad:', error);
        setError('No se pudo cargar la actividad para editar');
      } finally {
        setLoading(false);
      }
    };

    cargarActividad();
  }, [id]);

  // Para nuevo registro, inicializar con datos básicos
  useEffect(() => {
    if (!id && userProfile) {
      const mañana = new Date();
      mañana.setDate(mañana.getDate() + 1);
      
      setFormData({
        nombre: '',
        lugar: '',
        descripcion: '',
        fechaInicio: new Date(),
        fechaFin: mañana,
        tipo: [],
        subtipo: [],
        dificultad: 'media',
        responsableActividadId: userProfile.uid,
        participanteIds: [userProfile.uid],
        materiales: [], 
        estado: 'planificada',
        creadorId: userProfile.uid,
        // Inicializar todos los arrays de enlaces vacíos explícitamente
        enlacesWikiloc: [],
        enlacesTopografias: [],
        enlacesDrive: [],
        enlacesWeb: [],
        // Inicializar otros arrays opcionales
        comentarios: [],
        enlaces: []
      });
    }
  }, [id, userProfile]);

  const getCompleteActivity = (data: Partial<Actividad>): Actividad => {
    return {
      id: data.id,
      nombre: data.nombre || '',
      tipo: data.tipo || [],
      subtipo: data.subtipo || [],
      descripcion: data.descripcion || '',
      fechaInicio: data.fechaInicio || new Date(),
      fechaFin: data.fechaFin || new Date(Date.now() + 24 * 60 * 60 * 1000),
      lugar: data.lugar || '',
      responsableActividadId: data.responsableActividadId || (userProfile?.uid || ''),
      participanteIds: data.participanteIds || [],
      necesidadMaterial: data.necesidadMaterial || false,
      materiales: data.materiales || [],
      estado: (data.estado as EstadoActividad) || 'planificada',
      creadorId: data.creadorId || (userProfile?.uid || ''),
      comentarios: data.comentarios || [],
      enlaces: data.enlaces || [],
      enlacesWikiloc: data.enlacesWikiloc || [],
      enlacesTopografias: data.enlacesTopografias || [],
      enlacesDrive: data.enlacesDrive || [],
      enlacesWeb: data.enlacesWeb || [],
      imagenesTopografia: data.imagenesTopografia || [],
      archivosAdjuntos: data.archivosAdjuntos || [],
      fechaCreacion: data.fechaCreacion,
      fechaActualizacion: data.fechaActualizacion
    };
  };

  const handleInfoSave = (infoData: Partial<Actividad>) => {
    setFormData((prev: Partial<Actividad>) => ({
      ...prev,
      ...infoData
    }));
    setInfoEdited(true);
    toast({
      title: "Información guardada",
      description: "Los datos básicos se han guardado. Puedes continuar con la siguiente sección.",
      status: "success",
      duration: 3000
    });
    // Avanzar a la siguiente pestaña
    setTabIndex(1);
  };

  const handleParticipantesSave = (participanteIds: string[]) => {
    setFormData((prev: Partial<Actividad>) => ({
      ...prev,
      participanteIds
    }));
    setParticipantesEdited(true);
    toast({
      title: "Participantes guardados",
      status: "success",
      duration: 3000
    });
    setTabIndex(2);
  };

  const handleMaterialSave = (materiales: Array<{materialId: string; nombre: string; cantidad: number}>) => {
    setFormData((prev: Partial<Actividad>) => ({
      ...prev,
      necesidadMaterial: materiales.length > 0,
      materiales
    }));
    setMaterialEdited(true);
    toast({
      title: "Material guardado",
      status: "success",
      duration: 3000
    });
    setTabIndex(3);
  };

  const handleEnlacesSave = async (enlaces: Partial<Actividad>) => {
    setFormData((prev: Partial<Actividad>) => ({
      ...prev,
      ...enlaces
    }));
    setEnlacesEdited(true);
    
    // Si estamos en la última pestaña, guardar toda la actividad
    try {
      // Validaciones básicas
      if (!formData.nombre || !formData.lugar || !formData.tipo?.length || !formData.subtipo?.length) {
        toast({
          title: "Datos incompletos",
          description: "Por favor completa todos los campos requeridos",
          status: "error",
          duration: 5000
        });
        return;
      }

      // Determinar estado según fechas con las nuevas funciones
      const hoy = normalizarFecha(new Date())!;
      const fechaInicio = normalizarFecha(toDate(formData.fechaInicio))!;
      const fechaFin = normalizarFecha(toDate(formData.fechaFin))!;
      
      let estadoAutomatico = formData.estado as EstadoActividad;
      
      if (formData.estado !== 'cancelada') {
        if ((compareDates(hoy, fechaFin) ?? 0) > 0) {
          estadoAutomatico = 'finalizada';
        } else if ((compareDates(hoy, fechaInicio) ?? 0) >= 0) {
          estadoAutomatico = 'en_curso';
        } else {
          estadoAutomatico = 'planificada';
        }
      }

      // Crear el objeto de actividad completo con los últimos enlaces y usar toTimestamp para guardar
      const actividadCompleta = {
        nombre: formData.nombre || '',
        tipo: formData.tipo || [],
        subtipo: formData.subtipo || [],
        descripcion: formData.descripcion || '',
        lugar: formData.lugar || '',
        responsableActividadId: formData.responsableActividadId || userProfile?.uid || '',
        participanteIds: formData.participanteIds || [],
        necesidadMaterial: formData.materiales ? formData.materiales.length > 0 : false,
        materiales: formData.materiales || [],
        estado: estadoAutomatico,
        comentarios: formData.comentarios || [],
        creadorId: formData.creadorId || userProfile?.uid || '',
        enlaces: formData.enlaces || [],
        ...formData,
        fechaInicio: toTimestamp(formData.fechaInicio) || Timestamp.fromDate(new Date()),
        fechaFin: toTimestamp(formData.fechaFin) || Timestamp.fromDate(new Date()),
        fechaActualizacion: Timestamp.fromDate(new Date()),
        enlacesWikiloc: formData.enlacesWikiloc || [],
        enlacesTopografias: formData.enlacesTopografias || [],
        enlacesDrive: formData.enlacesDrive || [],
        enlacesWeb: formData.enlacesWeb || [],
        imagenesTopografia: formData.imagenesTopografia || [],
        archivosAdjuntos: formData.archivosAdjuntos || []
      };

      let resultado: Actividad;
      
      if (id) {
        // Actualizar actividad existente
        resultado = await actualizarActividad(id, actividadCompleta);
        toast({
          title: "Actividad actualizada",
          status: "success",
          duration: 5000
        });
      } else {
        // Crear nueva actividad
        resultado = await crearActividad(actividadCompleta);
        toast({
          title: "Actividad creada",
          status: "success",
          duration: 5000
        });
      }
      
      navigate(`/activities/${resultado.id}`);
    } catch (error) {
      console.error("Error al guardar la actividad:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la actividad",
        status: "error",
        duration: 5000
      });
    }
  };

  const handleCancel = () => {
    navigate(id ? `/activities/${id}` : '/activities');
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      // Mostrar feedback visual de inicio de proceso
      toast({
        title: "Procesando",
        description: "Guardando datos de la actividad...",
        status: "info",
        duration: 2000
      });

      // Usar la función de validación centralizada
      const validationError = validateActividad(formData);
      if (validationError) {
        toast({
          title: "Datos incompletos",
          description: validationError,
          status: "error",
          duration: 5000
        });
        return;
      }

      // Validación específica para enlaces
      if (enlacesEdited) {
        const enlacesError = validateActividadEnlaces(formData);
        if (enlacesError) {
          toast({
            title: "Error en enlaces",
            description: enlacesError,
            status: "error",
            duration: 5000
          });
          setTabIndex(3); // Ir a la pestaña de enlaces
          return;
        }
      }

      // Determinar estado automático usando la función centralizada
      const estadoAutomatico = determinarEstadoActividad(
        formData.fechaInicio,
        formData.fechaFin,
        formData.estado
      );

      // Comprobar disponibilidad del usuario actual
      const usuarioActual = userProfile?.uid;
      if (!usuarioActual) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo identificar al usuario actual. Por favor, inicia sesión nuevamente.",
          status: "error",
          duration: 5000
        });
        return;
      }

      // Crear el objeto de actividad completo con valores seguros utilizando las funciones de conversión centralizada
      const actividadCompleta = {
        nombre: formData.nombre || '',
        tipo: formData.tipo || [],
        subtipo: formData.subtipo || [],
        descripcion: formData.descripcion || '',
        lugar: formData.lugar || '',
        responsableActividadId: formData.responsableActividadId || usuarioActual,
        participanteIds: formData.participanteIds || [usuarioActual],
        necesidadMaterial: formData.materiales ? formData.materiales.length > 0 : false,
        materiales: formData.materiales || [],
        estado: estadoAutomatico,
        comentarios: formData.comentarios || [],
        creadorId: formData.creadorId || usuarioActual,
        // Usar funciones centralizadas para fechas
        fechaInicio: toTimestamp(formData.fechaInicio) || Timestamp.fromDate(new Date()),
        fechaFin: toTimestamp(formData.fechaFin) || Timestamp.fromDate(new Date()),
        fechaActualizacion: Timestamp.fromDate(new Date()),
        enlacesWikiloc: formData.enlacesWikiloc || [],
        enlacesTopografias: formData.enlacesTopografias || [],
        enlacesDrive: formData.enlacesDrive || [],
        enlacesWeb: formData.enlacesWeb || [],
        imagenesTopografia: formData.imagenesTopografia || [],
        archivosAdjuntos: formData.archivosAdjuntos || [],
        // Incluir un array de enlaces para compatibilidad
        enlaces: [
          ...(formData.enlacesWikiloc?.map(e => e.url) || []),
          ...(formData.enlacesTopografias || []),
          ...(formData.enlacesDrive || []),
          ...(formData.enlacesWeb || [])
        ]
      };

      // Mostrar feedback de guardado
      let resultado: Actividad;
      
      if (id) {
        // Actualizar actividad existente
        resultado = await actualizarActividad(id, actividadCompleta);
        toast({
          title: "Actividad actualizada",
          description: "La actividad se ha actualizado correctamente",
          status: "success",
          duration: 5000
        });
      } else {
        // Crear nueva actividad
        resultado = await crearActividad(actividadCompleta);
        toast({
          title: "Actividad creada",
          description: "La actividad se ha creado correctamente",
          status: "success",
          duration: 5000
        });
      }
      
      // Redirigir a la página de detalle después de un pequeño delay
      // para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        navigate(`/activities/${resultado.id}`);
      }, 1500);
      
    } catch (error) {
      console.error("Error al guardar la actividad:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la actividad. Por favor, inténtalo de nuevo.",
        status: "error",
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title={id ? "Editar Actividad" : "Nueva Actividad"}>
        <Center py={10}>
          <Spinner size="xl" color="brand.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Error">
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={id ? "Editar Actividad" : "Nueva Actividad"}>
      <Container maxW="1200px" py={6}>
        <Card mb={6}>
          <CardBody>
            <Heading size="lg" mb={4}>
              {id ? "Editar Actividad" : "Crear Nueva Actividad"}
            </Heading>
            
            <Tabs index={tabIndex} onChange={setTabIndex} variant="enclosed" colorScheme="brand" isFitted>
              <TabList>
                <Tab>
                  <FiFileText style={{marginRight: '8px'}} /> 
                  Información
                  {infoEdited && <Badge ml={2} colorScheme="green" borderRadius="full">✓</Badge>}
                </Tab>
                <Tab>
                  <FiUsers style={{marginRight: '8px'}} /> 
                  Participantes
                  {participantesEdited && <Badge ml={2} colorScheme="green" borderRadius="full">✓</Badge>}
                </Tab>
                <Tab>
                  <FiPackage style={{marginRight: '8px'}} /> 
                  Material
                  {materialEdited && <Badge ml={2} colorScheme="green" borderRadius="full">✓</Badge>}
                </Tab>
                <Tab>
                  <FiLink style={{marginRight: '8px'}} /> 
                  Enlaces
                  {enlacesEdited && <Badge ml={2} colorScheme="green" borderRadius="full">✓</Badge>}
                </Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <InfoEditor 
                    actividad={getCompleteActivity(formData)}
                    onSave={handleInfoSave} 
                    onCancel={handleCancel}
                    mostrarBotones={false}
                  />
                </TabPanel>
                
                <TabPanel>
                  <ParticipantesEditor 
                    actividad={getCompleteActivity(formData)}
                    onSave={handleParticipantesSave}
                    onCancel={handleCancel}
                    mostrarBotones={false}
                  />
                </TabPanel>
                
                <TabPanel>
                  <MaterialEditor 
                    actividad={getCompleteActivity(formData)}
                    onSave={handleMaterialSave}
                    onCancel={handleCancel}
                    mostrarBotones={false}
                  />
                </TabPanel>
                
                <TabPanel>
                  <EnlacesEditor 
                    actividad={getCompleteActivity(formData)}
                    onSave={handleEnlacesSave}
                    onCancel={handleCancel}
                    esNuevo={!id}
                    mostrarBotones={false}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
        <Box pt={4} pb={2} borderTop="1px" borderColor="gray.200" width="100%" mt={4}>
          <Flex justify="space-between" maxW="1200px" mx="auto">
            <Button 
              leftIcon={<FiArrowLeft />}
              onClick={handleCancel}
              variant="outline"
            >
              Cancelar
            </Button>
            
            <HStack spacing={3}>
              <Button 
                leftIcon={<FiChevronLeft />} 
                onClick={() => setTabIndex(Math.max(0, tabIndex - 1))} 
                isDisabled={tabIndex === 0}
                variant="ghost"
              >
                Anterior
              </Button>
              <Button 
                rightIcon={<FiChevronRight />} 
                onClick={() => setTabIndex(Math.min(3, tabIndex + 1))} 
                isDisabled={tabIndex === 3}
                variant="ghost"
              >
                Siguiente
              </Button>
              <Button 
                leftIcon={<FiSave />} 
                colorScheme="brand" 
                onClick={handleSaveAll}
                isLoading={isSaving}
                loadingText="Guardando..."
              >
                {id ? "Actualizar actividad" : "Crear actividad"}
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Container>
    </DashboardLayout>
  );
};

export default ActividadFormPage;