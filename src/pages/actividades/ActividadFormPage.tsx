import React, { useState, useEffect, useRef } from 'react';
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
import { verificarConexionFirebase } from '../../utils/firebaseUtils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ActividadFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast({
    position: "top",
    duration: 5000,
    isClosable: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Añades este estado
  const [isSaving, setIsSaving] = useState(false);

  // Añades esto antes del condicional alrededor de la línea 70
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
  }, [userProfile, formData.responsableMaterialId, checkIsUserResponsable]); // Añadir la dependencia

  // Verificar la conexión a Firebase al cargar el componente
  useEffect(() => {
    const verificarConexion = async () => {
      const conectado = await verificarConexionFirebase();
      if (!conectado) {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con la base de datos. Verifica tu conexión a internet.",
          status: "error",
          duration: 5000,
          isClosable: true
        });
      }
    };
    
    verificarConexion();
  }, [toast]);

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
      
      // Configurar valores iniciales explícitos para todos los campos requeridos
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
      
      // Marcar todas las secciones como no editadas al comenzar
      setInfoEdited(false);
      setParticipantesEdited(false);
      setMaterialEdited(false);
      setEnlacesEdited(false);
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

  // Función auxiliar para guardar datos en localStorage
  const saveToLocalStorage = (data: Partial<Actividad>) => {
    try {
      console.log("Guardando en localStorage:", data);
      localStorage.setItem('actividad_temp_data', JSON.stringify(data));
    } catch (e) {
      console.error("Error guardando datos en localStorage:", e);
    }
  };

  // Asegurar que las fechas se convierten correctamente
  const handleInfoSave = (infoData: Partial<Actividad>) => {
    console.log("handleInfoSave - Datos recibidos:", infoData);
    
    // Verificar que tipo y subtipo estén presentes
    if (!infoData.tipo?.length) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un tipo de actividad",
        status: "error",
        duration: 3000
      });
      return;
    }
    
    if (!infoData.subtipo?.length) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un subtipo de actividad",
        status: "error",
        duration: 3000
      });
      return;
    }
    
    // Convertir fechas a objetos Date si vienen como Timestamp
    const fechaInicio = infoData.fechaInicio instanceof Timestamp ? 
      infoData.fechaInicio.toDate() : infoData.fechaInicio;
    
    const fechaFin = infoData.fechaFin instanceof Timestamp ? 
      infoData.fechaFin.toDate() : infoData.fechaFin;
    
    // Actualizar estado
    setFormData(prevFormData => {
      const updatedData = {
        ...prevFormData,
        ...infoData,
        nombre: infoData.nombre?.trim() || '',
        lugar: infoData.lugar?.trim() || '',
        tipo: infoData.tipo || [],
        subtipo: infoData.subtipo || [],
        fechaInicio: fechaInicio,
        fechaFin: fechaFin
      };
      
      // Guardar en localStorage
      saveToLocalStorage(updatedData);
      
      return updatedData;
    });
    
    // Resto del código...
    // Marcar como editado y avanzar
    setInfoEdited(true);
    toast({
      title: "Información guardada",
      status: "success",
      duration: 3000
    });
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

  // Modificar la función handleMaterialSave para que actualice correctamente el estado
  const handleMaterialSave = (materiales: any[]) => {
    console.log("handleMaterialSave - Recibidos materiales:", materiales);
    
    // Actualizar el estado con los nuevos materiales
    setFormData((prev: Partial<Actividad>) => {
      const updatedData = {
        ...prev,
        materiales: materiales,
        // Actualizar también la bandera de necesidad de material
        necesidadMaterial: materiales.length > 0
      };
      console.log("FormData actualizado con materiales:", updatedData);
      
      // Guardar en localStorage para persistencia
      saveToLocalStorage(updatedData);
      
      return updatedData;
    });
    
    setMaterialEdited(true);
    toast({
      title: "Material guardado",
      status: "success",
      duration: 3000
    });
    
    // Avanzar a la siguiente pestaña si estamos en el flujo secuencial
    if (tabIndex === 2) {
      setTabIndex(3);
    }
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

      // Determinar estado según fechas de forma segura
      const hoy = normalizarFecha(new Date());
      const fechaInicio = normalizarFecha(toDate(formData.fechaInicio));
      const fechaFin = normalizarFecha(toDate(formData.fechaFin));

      // AÑADIR ESTA LÍNEA: Declara la variable con un valor predeterminado
      let estadoAutomatico: EstadoActividad = 'planificada';

      // Solo cambiar estado si todas las fechas son válidas
      if (hoy && fechaInicio && fechaFin && formData.estado !== 'cancelada') {
        const compFin = compareDates(hoy, fechaFin);
        const compInicio = compareDates(hoy, fechaInicio);
        
        if (compFin !== null && compFin > 0) {
          estadoAutomatico = 'finalizada';
        } else if (compInicio !== null && compInicio >= 0) {
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
        fechaInicio: toTimestamp(formData.fechaInicio) || Timestamp.fromDate(new Date()),
        fechaFin: toTimestamp(formData.fechaFin) || Timestamp.fromDate(new Date()),
        fechaActualizacion: Timestamp.fromDate(new Date()),
        enlacesWikiloc: formData.enlacesWikiloc || [],
        enlacesTopografias: formData.enlacesTopografias || [],
        enlacesDrive: formData.enlacesDrive || [],
        enlacesWeb: formData.enlacesWeb || [],
        imagenesTopografia: formData.imagenesTopografia || [],
        archivosAdjuntos: formData.archivosAdjuntos || [],
        enlaces: [
          ...(formData.enlacesWikiloc?.map(e => e.url) || []),
          ...(formData.enlacesTopografias || []),
          ...(formData.enlacesDrive || []),
          ...(formData.enlacesWeb || [])
        ]
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

  // Añadir estas referencias para acceder a los componentes
  const infoEditorRef = useRef<any>(null);
  const participantesEditorRef = useRef<any>(null);
  const materialEditorRef = useRef<any>(null);
  const enlacesEditorRef = useRef<any>(null);

  // Modificar la función handleTabButtons para utilizar las refs
  const handleTabButtons = (action: 'prev' | 'next' | 'save') => {
    switch(action) {
      case 'prev':
        setTabIndex(Math.max(0, tabIndex - 1));
        break;
        
      case 'next':
        // Solo avanzar si la pestaña actual tiene datos válidos
        if (tabIndex === 0 && !infoEdited) {
          // Usar la referencia para invocar el método del componente
          if (infoEditorRef.current?.submitForm) {
            infoEditorRef.current.submitForm();
          } else {
            // Fallback a la manipulación DOM si la ref no está disponible
            const formElement = document.querySelector('form');
            if (formElement) formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
          return; // No avanzar hasta que los datos estén guardados
        }
        setTabIndex(Math.min(3, tabIndex + 1));
        break;
        
      case 'save':
        // Guardar según la pestaña activa usando refs
        switch(tabIndex) {
          case 0: // Info
            if (infoEditorRef.current?.submitForm) {
              infoEditorRef.current.submitForm();
            } else {
              // Fallback si no tenemos acceso al método
              const formElement = document.querySelector('form');
              if (formElement) formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
            break;
            
          case 1: // Participantes
            if (participantesEditorRef.current?.submitForm) {
              participantesEditorRef.current.submitForm();
            } else {
              // Si el componente no expone el método, usar el handler directo
              if (formData.participanteIds) {
                handleParticipantesSave(formData.participanteIds);
              }
            }
            break;
            
          case 2: // Material
            if (materialEditorRef.current?.submitForm) {
              materialEditorRef.current.submitForm();
            } else {
              // Si el componente no expone el método, usar el handler directo
              if (formData.materiales) {
                handleMaterialSave(formData.materiales);
              }
            }
            break;
            
          case 3: // Enlaces
            if (enlacesEditorRef.current?.submitForm) {
              enlacesEditorRef.current.submitForm();
            } else {
              // Para la última pestaña, guardar todo
              handleSaveAll();
            }
            break;
        }
        break;
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      console.log("handleSaveAll - Iniciando guardado completo");
      
      // Establecer el estado automático basado en las fechas
      let estadoAutomatico: EstadoActividad = 'planificada';
      estadoAutomatico = determinarEstadoActividad(
        formData.fechaInicio,
        formData.fechaFin,
        formData.estado
      );
      
      // Validar que todos los campos requeridos existan
      const validationError = validateActividad(formData);
      if (validationError) {
        toast({
          title: "Datos incompletos",
          description: validationError,
          status: "error",
          duration: 5000
        });
        setTabIndex(0); // Volver a la pestaña de información
        setIsSaving(false);
        return;
      }
      
      // Crear objeto actividad completo
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
        fechaInicio: toTimestamp(formData.fechaInicio) || Timestamp.fromDate(new Date()),
        fechaFin: toTimestamp(formData.fechaFin) || Timestamp.fromDate(new Date()),
        fechaActualizacion: Timestamp.fromDate(new Date()),
        enlacesWikiloc: formData.enlacesWikiloc || [],
        enlacesTopografias: formData.enlacesTopografias || [],
        enlacesDrive: formData.enlacesDrive || [],
        enlacesWeb: formData.enlacesWeb || [],
        imagenesTopografia: formData.imagenesTopografia || [],
        archivosAdjuntos: formData.archivosAdjuntos || [],
        enlaces: [
          ...(formData.enlacesWikiloc?.map(e => e.url) || []),
          ...(formData.enlacesTopografias || []),
          ...(formData.enlacesDrive || []),
          ...(formData.enlacesWeb || [])
        ]
      };
      
      console.log("handleSaveAll - Objeto a guardar:", actividadCompleta);
      
      // Crear o actualizar según corresponda
      let resultado: Actividad;
      if (id) {
        console.log("handleSaveAll - Actualizando actividad existente:", id);
        resultado = await actualizarActividad(id, actividadCompleta);
        toast({
          title: "Actividad actualizada",
          status: "success",
          duration: 5000
        });
      } else {
        console.log("handleSaveAll - Creando nueva actividad");
        resultado = await crearActividad(actividadCompleta);
        toast({
          title: "Actividad creada",
          status: "success",
          duration: 5000
        });
      }
      
      console.log("handleSaveAll - Guardado exitoso:", resultado);
      
      // Limpiar localStorage tras guardar correctamente
      localStorage.removeItem('actividad_temp_data');
      
      // Navegamos a la vista de detalle
      navigate(`/activities/${resultado.id}`);
    } catch (error) {
      console.error("Error al guardar la actividad:", error);
      toast({
        title: "Error",
        description: "Se produjo un error al guardar la actividad. Por favor, inténtelo de nuevo.",
        status: "error",
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Añade este useEffect para ver los cambios en formData
  useEffect(() => {
    console.log("Estado actual de formData:", formData);
  }, [formData]);

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
                    ref={infoEditorRef}
                    actividad={getCompleteActivity(formData)}
                    onSave={handleInfoSave} 
                    onCancel={handleCancel}
                    mostrarBotones={false} // Desactivar botones propios
                  />
                  {!infoEdited && (
                    <Alert status="warning" mt={4}>
                      <AlertIcon />
                      Completa la información básica antes de continuar
                    </Alert>
                  )}
                </TabPanel>
                
                <TabPanel>
                  <ParticipantesEditor 
                    ref={participantesEditorRef}
                    actividad={getCompleteActivity(formData)}
                    onSave={handleParticipantesSave}
                    onCancel={handleCancel}
                    mostrarBotones={false} // Desactivar botones propios
                  />
                </TabPanel>
                
                <TabPanel>
                  <MaterialEditor 
                    ref={materialEditorRef}
                    actividad={getCompleteActivity(formData)}
                    onSave={handleMaterialSave}
                    onCancel={handleCancel}
                    mostrarBotones={false} // Desactivar botones propios
                  />
                </TabPanel>
                
                <TabPanel>
                  <EnlacesEditor 
                    ref={enlacesEditorRef}
                    actividad={getCompleteActivity(formData)}
                    onSave={handleEnlacesSave}
                    onCancel={handleCancel}
                    esNuevo={!id}
                    mostrarBotones={false} // Desactivar botones propios
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
                onClick={() => handleTabButtons('prev')} 
                isDisabled={tabIndex === 0}
                variant="ghost"
              >
                Anterior
              </Button>
              <Button 
                rightIcon={<FiChevronRight />} 
                onClick={() => handleTabButtons('next')} 
                isDisabled={tabIndex === 3}
                variant="ghost"
              >
                Siguiente
              </Button>
              <Button 
                leftIcon={<FiSave />} 
                colorScheme="brand" 
                onClick={() => tabIndex === 3 ? handleSaveAll() : handleTabButtons('save')}
                isLoading={isSaving}
                loadingText="Guardando..."
              >
                {tabIndex === 3 ? (id ? "Actualizar actividad" : "Crear actividad") : "Guardar y continuar"}
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Container>
    </DashboardLayout>
  );
};

export default ActividadFormPage;