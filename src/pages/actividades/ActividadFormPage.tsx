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
  CardBody
} from '@chakra-ui/react';
import { FiFileText, FiUsers, FiPackage, FiLink } from 'react-icons/fi';
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

const ActividadFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
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
      setFormData({
        nombre: '',
        lugar: '',
        descripcion: '',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000),
        tipo: [],
        subtipo: [],
        dificultad: 'media',
        responsableActividadId: userProfile.uid,
        participanteIds: [userProfile.uid],
        materiales: [], // La propiedad "necesidadMaterial" se calculará automáticamente
        estado: 'planificada',
        enlacesWikiloc: [],
        enlacesTopografias: [],
        enlacesDrive: [],
        enlacesWeb: []
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
      if (!formData.nombre || !formData.lugar || formData.tipo?.length === 0 || formData.subtipo?.length === 0) {
        toast({
          title: "Datos incompletos",
          description: "Por favor completa todos los campos requeridos",
          status: "error",
          duration: 5000
        });
        return;
      }

      // Determinar estado según fechas
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const fechaInicio = formData.fechaInicio ? 
        (formData.fechaInicio instanceof Date ? 
          formData.fechaInicio : 
          new Date(formData.fechaInicio.toDate())
        ) : new Date();
      
      const fechaFin = formData.fechaFin ? 
        (formData.fechaFin instanceof Date ? 
          formData.fechaFin : 
          new Date(formData.fechaFin.toDate())
        ) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      let estadoAutomatico = formData.estado;
      
      if (formData.estado !== 'cancelada') {
        if (hoy.getTime() > fechaFin.getTime()) {
          estadoAutomatico = 'finalizada';
        } else if (hoy.getTime() >= fechaInicio.getTime()) {
          estadoAutomatico = 'en_curso';
        } else {
          estadoAutomatico = 'planificada';
        }
      }

      // Crear el objeto de actividad completo con los últimos enlaces
      const actividadCompleta = {
        ...formData,
        ...enlaces,
        estado: estadoAutomatico,
        enlaces: [
          ...((formData.enlacesWikiloc || []).concat(enlaces.enlacesWikiloc || [])).map((e: any) => e.url),
          ...(formData.enlacesTopografias || []).concat(enlaces.enlacesTopografias || []), 
          ...(formData.enlacesDrive || []).concat(enlaces.enlacesDrive || []),
          ...(formData.enlacesWeb || []).concat(enlaces.enlacesWeb || [])
        ],
        fechaActualizacion: Timestamp.fromDate(new Date())
      };

      let resultado;
      
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
        resultado = await crearActividad({
          nombre: actividadCompleta.nombre || '',
          tipo: actividadCompleta.tipo || [],
          subtipo: actividadCompleta.subtipo || [],
          descripcion: actividadCompleta.descripcion || '',
          fechaInicio: actividadCompleta.fechaInicio || new Date(),
          fechaFin: actividadCompleta.fechaFin || new Date(Date.now() + 24 * 60 * 60 * 1000),
          lugar: actividadCompleta.lugar || '',
          responsableActividadId: actividadCompleta.responsableActividadId || userProfile?.uid || '',
          participanteIds: actividadCompleta.participanteIds || [userProfile?.uid || ''],
          necesidadMaterial: actividadCompleta.necesidadMaterial || false,
          materiales: actividadCompleta.materiales || [],
          estado: estadoAutomatico as EstadoActividad,
          creadorId: userProfile?.uid || '',
          comentarios: [],
          imagenesTopografia: [],
          archivosAdjuntos: [],
          enlaces: actividadCompleta.enlaces || [],
          enlacesWikiloc: actividadCompleta.enlacesWikiloc || [],
          enlacesTopografias: actividadCompleta.enlacesTopografias || [],
          enlacesDrive: actividadCompleta.enlacesDrive || [],
          enlacesWeb: actividadCompleta.enlacesWeb || []
        });
        toast({
          title: "Actividad creada",
          status: "success",
          duration: 5000
        });
      }
      
      // Redirigir a la página de detalle
      navigate(id ? `/activities/${id}` : `/activities/${resultado.id}`);
      
    } catch (error) {
      console.error("Error al guardar actividad:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la actividad. Inténtalo de nuevo.",
        status: "error",
        duration: 5000
      });
    }
  };

  const handleCancel = () => {
    navigate(id ? `/activities/${id}` : '/activities');
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
                  />
                </TabPanel>
                
                <TabPanel>
                  <ParticipantesEditor 
                    actividad={getCompleteActivity(formData)}
                    onSave={handleParticipantesSave}
                    onCancel={handleCancel}
                  />
                </TabPanel>
                
                <TabPanel>
                  <MaterialEditor 
                    actividad={getCompleteActivity(formData)}
                    onSave={handleMaterialSave}
                    onCancel={handleCancel}
                  />
                </TabPanel>
                
                <TabPanel>
                  <EnlacesEditor 
                    actividad={getCompleteActivity(formData)}
                    onSave={handleEnlacesSave}
                    onCancel={handleCancel}
                    esNuevo={!id} // true si es una nueva actividad, false si se está editando
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default ActividadFormPage;