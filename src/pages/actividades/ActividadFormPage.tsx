import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Flex, Heading, Spinner, Center, Alert, AlertIcon,
  Tabs, TabList, TabPanels, Tab, TabPanel, Button, HStack, Spacer
} from '@chakra-ui/react';
import { FiFileText, FiUsers, FiPackage, FiLink, FiArrowLeft, FiArrowRight, FiSave } from 'react-icons/fi';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useActividadForm } from '../../hooks/useActividadForm';
import { ActividadInfoForm } from '../../components/actividades/ActividadInfoForm';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';
import { FormProvider, useForm } from 'react-hook-form';
import { Actividad } from '../../types/actividad';

export const ActividadFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    formData, 
    loading, 
    error: initialError, 
    isSaving,
    updateInfo,
    updateParticipantes,
    updateMaterial,
    updateEnlaces,
    saveActividad,
  } = useActividadForm({ actividadId: id });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const totalTabs = 4; // Número total de pestañas
  
  const methods = useForm({
    defaultValues: formData,
    mode: 'onBlur'
  });

  const { handleSubmit } = methods;

  // Función para avanzar a la siguiente pestaña
  const nextTab = () => {
    if (activeTabIndex < totalTabs - 1) {
      setActiveTabIndex(activeTabIndex + 1);
    }
  };
  
  // Función para retroceder a la pestaña anterior
  const prevTab = () => {
    if (activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };
  
  // Solo guardar y navegar en la última pestaña
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await saveActividad();
      if (result) {
        setSuccessMessage('Actividad guardada correctamente');
        
        // Esperar más tiempo para asegurar que la caché se invalide completamente
        // y dar tiempo al usuario para ver el mensaje de éxito
        setTimeout(() => navigate('/activities'), 2000);
      } else {
        setError('No se pudo guardar la actividad. Revise los campos obligatorios.');
      }
    } catch (err) {
      setError('Error al guardar la actividad: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Esta función se ejecuta al enviar el formulario en cada pestaña
  const onSubmit = async (data: Partial<Actividad>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validar según la pestaña activa
      if (activeTabIndex === 0) {
        // Validación de la pestaña de información básica
        if (!data.nombre || !data.lugar || !data.fechaInicio || !data.fechaFin) {
          setError('Todos los campos marcados con * son obligatorios');
          setIsSubmitting(false);
          return;
        }
        
        // Actualizar información básica
        updateInfo(data);
        
        // Avanzar a la siguiente pestaña
        nextTab();
      } else if (activeTabIndex === 1) {
        // Actualizar participantes
        if (data.participanteIds) {
          updateParticipantes(data.participanteIds);
        }
        
        // Avanzar a la siguiente pestaña
        nextTab();
      } else if (activeTabIndex === 2) {
        // Actualizar materiales
        if (data.materiales) {
          updateMaterial(data.materiales);
        }
        
        // Avanzar a la siguiente pestaña
        nextTab();
      } else if (activeTabIndex === 3) {
        // Actualizar enlaces
        updateEnlaces(data);
        
        // En la última pestaña, guardar la actividad completa
        await handleFinalSubmit();
      }
    } catch (err) {
      setError('Error al procesar los datos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <DashboardLayout><Center><Spinner /></Center></DashboardLayout>;
  if (initialError) return <DashboardLayout><Alert status="error">{initialError}</Alert></DashboardLayout>;

  return (
    <DashboardLayout title={id ? "Editar Actividad" : "Crear Actividad"}>
      <Container maxW="container.xl" py={8}>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs 
              isFitted 
              variant="enclosed" 
              index={activeTabIndex}
              onChange={setActiveTabIndex}
            >
              <TabList>
                <Tab><FiFileText /> Información</Tab>
                <Tab><FiUsers /> Participantes</Tab>
                <Tab><FiPackage /> Material</Tab>
                <Tab><FiLink /> Enlaces</Tab>
              </TabList>

              <TabPanels>
                <TabPanel><ActividadInfoForm /></TabPanel>
                <TabPanel>
                  <ParticipantesEditor 
                    data={{ ...formData, participanteIds: formData.participanteIds || [] } as Actividad}
                    onSave={updateParticipantes} 
                    mostrarBotones={false} // Agregar esta propiedad
                  />
                </TabPanel>
                <TabPanel>
                  <MaterialEditor 
                    data={{ ...formData, materiales: formData.materiales || [] } as Actividad}
                    onSave={updateMaterial}
                    isInsideForm={true} 
                    mostrarBotones={false} // Agregar esta propiedad
                  />
                </TabPanel>
                <TabPanel>
                  <EnlacesEditor 
                    data={formData as Actividad}
                    onSave={updateEnlaces} 
                    mostrarBotones={false} // Agregar esta propiedad
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Botones de navegación entre pestañas */}
            <HStack justifyContent="space-between" mt={4}>
              {activeTabIndex > 0 && (
                <Button onClick={prevTab} leftIcon={<FiArrowLeft />}>
                  Anterior
                </Button>
              )}
              
              <Spacer />
              
              {activeTabIndex < totalTabs - 1 ? (
                <Button 
                  colorScheme="brand" 
                  onClick={handleSubmit(onSubmit)} 
                  rightIcon={<FiArrowRight />}
                  isLoading={isSubmitting}
                >
                  Siguiente
                </Button>
              ) : (
                <Button 
                  colorScheme="green" 
                  onClick={handleSubmit(onSubmit)}
                  isLoading={isSubmitting}
                  leftIcon={<FiSave />}
                >
                  Guardar Actividad
                </Button>
              )}
            </HStack>
          </form>
        </FormProvider>
        
        {error && <Alert status="error" mt={4}>{error}</Alert>}
        {successMessage && <Alert status="success" mt={4}>{successMessage}</Alert>}
      </Container>
    </DashboardLayout>
  );
};