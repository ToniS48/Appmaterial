import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { 
  Box, Tabs, TabList, Tab, TabPanels, TabPanel, Container, 
  Button, HStack, Center, Spinner, Alert, Spacer, Flex, useToast
} from '@chakra-ui/react';
import { FiArrowLeft, FiArrowRight, FiSave, FiFileText, FiUsers, FiPackage, FiLink, FiCheck, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { ActividadInfoForm } from '../../components/actividades/ActividadInfoForm';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';
import { Actividad } from '../../types/actividad';
import { useZodValidation } from '../../hooks/useZodValidation';
import { useActividadForm } from '../../hooks/useActividadForm';
import { actividadBaseSchema } from '../../schemas/actividadSchema';
import { createOptimizedValidator } from '../../utils/performanceUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useActividadInfoValidation } from '../../hooks/useActividadInfoValidation';
import validationMessages from '../../constants/validationMessages';
import { useActividadOptimizations } from '../../hooks/useActividadOptimizations';
import { setupSchedulerOptimizer, optimizeTabChange } from '../../utils/reactSchedulerOptimizer';
import { listarUsuarios } from '../../services/usuarioService';
import { Usuario } from '../../types/usuario';

export default function ActividadFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Agregar referencia al editor de participantes
  const participantesEditorRef = useRef<{ submitForm: () => boolean }>(null);
  
  // Estado para usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  
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
    // Añadir hook de optimizaciones para prevenir violaciones
  const {
    optimizedSave,
    optimizedTabChange,
    optimizedFormUpdate,
    getMetrics,
    resetMetrics
  } = useActividadOptimizations({ enableLogging: process.env.NODE_ENV === 'development' });
  
  // Hook para notificaciones
  const toast = useToast();
  
  // Optimizar el scheduler de React al cargar el componente
  useLayoutEffect(() => {
    // Configurar el optimizador y guardar la función de limpieza
    const cleanupScheduler = setupSchedulerOptimizer();
    
    return () => {
      // Limpiar optimizaciones cuando se desmonta el componente
      if (cleanupScheduler) cleanupScheduler();
    };
  }, []);  const validation = useActividadInfoValidation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  // Nuevo estado para rastrear las pestañas completadas
  const [completedTabs, setCompletedTabs] = useState<number[]>([]);
  const totalTabs = 4; // Número total de pestañas
  
  // Llamar al hook en el nivel superior
  const { validate } = useZodValidation(actividadBaseSchema);
  
  const methods = useForm<Actividad>({
    defaultValues: formData,
    mode: 'onSubmit', // Cambiar a onSubmit para que no valide automáticamente
    reValidateMode: "onSubmit",
  });

  const { handleSubmit, watch } = methods;

  // 🔧 CORRECCIÓN: Sincronizar cambios de materiales desde react-hook-form hacia useActividadForm
  const watchedMateriales = watch('materiales');
  
  useEffect(() => {
    // Solo sincronizar si hay cambios reales en materiales
    if (watchedMateriales && Array.isArray(watchedMateriales)) {
      console.log("🔄 ActividadFormPage - Sincronizando materiales desde formulario hacia hook:", watchedMateriales);
      updateMaterial(watchedMateriales);
    }
  }, [watchedMateriales, updateMaterial]);

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
        // Añadir esta línea de la segunda versión
        localStorage.removeItem('actividadDraft'); // Limpiar borrador al guardar exitosamente
        
        setSuccessMessage('Actividad guardada correctamente');
        
        // Marcar la última pestaña como completada también
        setCompletedTabs(prev => Array.from(new Set([...prev, totalTabs - 1])));
        
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

  // Modificar la firma de la función onSubmit
  const onSubmit = async (data: Partial<Actividad>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Usar setTimeout para evitar bloquear la UI durante el procesamiento
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            if (activeTabIndex === 0) {
              // Pestaña de información - Validamos antes de avanzar
              const isValid = await validateFirstTabSilent(data);
                if (isValid) {
                optimizedFormUpdate(updateInfo, data);
                setCompletedTabs(prev => Array.from(new Set([...prev, 0])));
                nextTab();
              } else {
                setFirstTabErrors(data);
              }            } else if (activeTabIndex === 1) {
              // Pestaña de participantes - Llamar a la función submitForm del componente participantes
              console.log("ActividadFormPage - Iniciando validación de participantes");
              if (participantesEditorRef.current) {
                console.log("ActividadFormPage - Llamando submitForm");
                const result = participantesEditorRef.current.submitForm();
                console.log("ActividadFormPage - Resultado de submitForm:", result);
                
                // Usar comparación estricta con true
                if (result === true) {
                  console.log("ActividadFormPage - Validación exitosa, avanzando a siguiente pestaña");
                  setCompletedTabs(prev => Array.from(new Set([...prev, 1])));
                  nextTab();
                } else {
                  console.log("ActividadFormPage - Validación falló, no se puede avanzar");
                }
              } else {
                console.error("ActividadFormPage - participantesEditorRef.current es null");
              }
            } else if (activeTabIndex === 2) {              // Actualizar materiales de forma optimizada
              if (data.materiales) {
                optimizedFormUpdate(updateMaterial, data.materiales);
              }
              
              // Marcar esta pestaña como completada
              setCompletedTabs(prev => Array.from(new Set([...prev, 2])));
              
              // Avanzar a la siguiente pestaña
              nextTab();            } else if (activeTabIndex === 3) {
              // Actualizar enlaces de forma optimizada
              optimizedFormUpdate(updateEnlaces, data);
              
              // En la última pestaña, guardar la actividad completa
              await handleFinalSubmit();
            }
          } catch (innerError) {
            console.error("Error en onSubmit:", innerError);
            setError('Error al procesar los datos: ' + 
              (innerError instanceof Error ? innerError.message : 'Error desconocido'));
          } finally {
            resolve();
          }
        }, 0);
      });
    } catch (err) {
      setError('Error al procesar los datos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }  };
  
  // Añadir una función helper para validar la primera pestaña
  const validateFirstTab = (data: any, silencioso: boolean = false) => {
    const nombreValido = validation.validateNombre(data.nombre || '', silencioso) === undefined;
    const lugarValido = validation.validateLugar(data.lugar || '', silencioso) === undefined;
    const tipoValido = validation.validateTipo(data.tipo || [], silencioso) === undefined;
    const subtipoValido = validation.validateSubtipo(data.subtipo || [], silencioso) === undefined;
    
    let fechasValidas = true;
    if (data.fechaInicio && data.fechaFin) {
      // Convertir de Timestamp a Date si es necesario
      const fechaInicio = data.fechaInicio instanceof Date 
        ? data.fechaInicio 
        : data.fechaInicio.toDate();
      
      const fechaFin = data.fechaFin instanceof Date 
        ? data.fechaFin 
        : data.fechaFin.toDate();
      
      validation.validateFechas(fechaInicio, fechaFin, silencioso);
      fechasValidas = !validation.errors.fechaFin;
    } else {
      fechasValidas = Boolean(data.fechaInicio && data.fechaFin);
      // Validar fechas individuales si faltan - mostrar mensaje adecuado
      if (!data.fechaInicio) {
        validation.setError('fechaInicio', 'La fecha de inicio es obligatoria', !silencioso);
      }
      if (!data.fechaFin) {
        validation.setError('fechaFin', 'La fecha de fin es obligatoria', !silencioso);
      }
    }
    
    return nombreValido && lugarValido && tipoValido && subtipoValido && fechasValidas;
  };
  
  // Función para manejar la cancelación
  const handleCancel = () => {
    // Usar methods.formState.isDirty en lugar de Object.keys(formData).length > 0
    if (methods.formState.isDirty) {
      if (window.confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
        localStorage.removeItem('actividadDraft'); // Limpiar borrador al cancelar
        navigate('/activities');
      }
    } else {
      navigate('/activities');
    }
  };

  // Añadir estas nuevas funciones para manejar los callbacks

  // Función para manejar la selección de responsables
  const handleResponsablesChange = (responsableActividadId: string, responsableMaterialId?: string) => {
    // Actualizar el estado usando la función que ya tenemos del hook
    updateParticipantes(
      formData.participanteIds || [],
      { responsableId: responsableActividadId, responsableMaterialId }
    );
  };  // Función personalizada para manejar materiales con asignación automática de responsable
  const handleMaterialUpdate = (materiales: any[]) => {
    try {
      console.log("ActividadFormPage handleMaterialUpdate - Recibidos materiales:", materiales);
      
      // Actualizar los materiales
      updateMaterial(materiales);
      
      // Si hay materiales seleccionados y no hay responsable de material asignado, asignar automáticamente
      if (materiales.length > 0 && !formData.responsableMaterialId) {
        // Buscar un responsable candidato: prioritario el creador, luego el responsable de actividad, finalmente el usuario actual
        const candidatoResponsable = formData.creadorId || 
                                   formData.responsableActividadId || 
                                   currentUser?.uid;
        
        if (candidatoResponsable) {
          console.log("ActividadFormPage - Asignando responsable de material automáticamente:", candidatoResponsable);
          
          // Asignar el responsable de material automáticamente
          handleResponsablesChange(
            formData.responsableActividadId || candidatoResponsable,
            candidatoResponsable
          );
          
          toast({
            title: "Responsable de material asignado",
            description: "Se ha asignado automáticamente un responsable para el material seleccionado.",
            status: "info",
            duration: 4000,
            isClosable: true,
          });
        }
      }
      
      console.log("ActividadFormPage handleMaterialUpdate - Ejecutado exitosamente");
    } catch (error) {
      console.error("ActividadFormPage handleMaterialUpdate - Error:", error);
      throw error; // Re-lanzar el error para que submitForm lo capture
    }
  };
  
  // Wrapper para updateParticipantes que maneja solo los IDs
  const handleParticipantesUpdate = (participanteIds: string[]) => {
    try {
      console.log("ActividadFormPage handleParticipantesUpdate - Recibidos:", participanteIds);
      updateParticipantes(participanteIds);
      console.log("ActividadFormPage handleParticipantesUpdate - Ejecutado exitosamente");
    } catch (error) {
      console.error("ActividadFormPage handleParticipantesUpdate - Error:", error);
      throw error; // Re-lanzar el error para que submitForm lo capture
    }
  };
  // Validación de la primera pestaña optimizada
  const validateFirstTabSilent = async (data: Partial<Actividad>): Promise<boolean> => {
    return new Promise((resolve) => {
      // Planificar la validación para el siguiente frame de animación
      requestAnimationFrame(() => {
        try {
          const nombreValido = validation.validateNombre(data.nombre || '', true) === undefined;
          const lugarValido = validation.validateLugar(data.lugar || '', true) === undefined;
          const tipoValido = validation.validateTipo(data.tipo || [], true) === undefined;
          const subtipoValido = validation.validateSubtipo(data.subtipo || [], true) === undefined;
          
          let fechasValidas = true;
          if (data.fechaInicio && data.fechaFin) {
            // Convertir de Timestamp a Date si es necesario
            const fechaInicio = data.fechaInicio instanceof Date 
              ? data.fechaInicio 
              : data.fechaInicio.toDate();
            
            const fechaFin = data.fechaFin instanceof Date 
              ? data.fechaFin 
              : data.fechaFin.toDate();
            
            validation.validateFechas(fechaInicio, fechaFin, true);
            fechasValidas = !validation.errors.fechaFin;
          } else {
            fechasValidas = Boolean(data.fechaInicio && data.fechaFin);
          }
          
          const isValid = nombreValido && lugarValido && tipoValido && subtipoValido && fechasValidas;
          resolve(isValid);
        } catch (error) {
          console.error('Error during validation:', error);
          resolve(false);
        }
      });
    });
  };

  // Función para establecer errores en la primera pestaña de forma optimizada
  const setFirstTabErrors = (data: Partial<Actividad>): void => {
    // Usar requestAnimationFrame para no bloquear la UI mientras se establecen errores
    requestAnimationFrame(() => {
      const nombreValido = validation.validateNombre(data.nombre || '', true) === undefined;
      const lugarValido = validation.validateLugar(data.lugar || '', true) === undefined;
      const tipoValido = validation.validateTipo(data.tipo || [], true) === undefined;
      const subtipoValido = validation.validateSubtipo(data.subtipo || [], true) === undefined;
      
      if (!nombreValido) validation.validateNombre(data.nombre || '', true);
      if (!lugarValido) validation.validateLugar(data.lugar || '', true);
      if (!tipoValido) validation.validateTipo(data.tipo || [], true);
      if (!subtipoValido) validation.validateSubtipo(data.subtipo || [], true);
      
      if (data.fechaInicio && data.fechaFin) {
        const fechaInicio = data.fechaInicio instanceof Date 
          ? data.fechaInicio 
          : data.fechaInicio.toDate();
        
        const fechaFin = data.fechaFin instanceof Date 
          ? data.fechaFin 
          : data.fechaFin.toDate();
        
        validation.validateFechas(fechaInicio, fechaFin, true);
      } else if (!data.fechaInicio) {
        validation.setError('fechaInicio', 'La fecha de inicio es obligatoria', false);
      } else if (!data.fechaFin) {
        validation.setError('fechaFin', 'La fecha de finalización es obligatoria', false);
      }
      
      // Mostrar toast de error con prevención de duplicados
      const toastId = "validation-tab-error";
      if (!toast.isActive(toastId)) {
        setTimeout(() => {
          toast({
            id: toastId,
            title: "Error de validación",
            description: "Por favor, complete correctamente todos los campos requeridos",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }, 50); // Pequeño retraso para evitar colisiones con otros eventos de UI
      }
    });
  };

  // Añadir validación para el cambio de pestañas (versión optimizada)
  const handleTabChange = async (newIndex: number) => {
    // Crear una versión optimizada de la función de cambio de pestaña
    const optimizedSetTab = optimizeTabChange(setActiveTabIndex);
    
    // Solo validar si avanzamos, no si retrocedemos
    if (newIndex > activeTabIndex) {
      try {
        // Capturar los datos actuales del formulario
        const formData = methods.getValues();
        
        // Validación específica por pestaña usando la versión optimizada
        if (activeTabIndex === 0) {
          // Usar la versión asíncrona optimizada de la validación
          const isValid = await validateFirstTabSilent(formData);
          
          if (isValid) {
            await optimizedSetTab(newIndex);
          } else {
            // Establecer errores sin bloquear la UI
            setFirstTabErrors(formData);
          }
        } else {
          // Para otras pestañas, hacemos el cambio directamente
          await optimizedSetTab(newIndex);
        }
      } catch (error) {
        console.error("Error durante el cambio de pestaña:", error);
        // Fallback en caso de error
        setActiveTabIndex(newIndex);
      }
    } else {
      // Si retrocedemos, permitir sin validación usando la versión optimizada
      await optimizedSetTab(newIndex);
    }
  };
  
  // Implementar autoguardado
  // Usar una referencia para rastrear el último cambio
  const lastChangeTimeRef = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimizar el autoguardado para evitar múltiples temporizadores
  useEffect(() => {
    // Evitar autoguardar si estamos editando una actividad existente
    if (id) return;
    
    // Limpiar cualquier temporizador anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Solo guardar si hay cambios pendientes
    if (methods.formState.isDirty) {
      // Registrar el tiempo del cambio
      lastChangeTimeRef.current = Date.now();
      
      // Programar guardado para después de 2 minutos de inactividad
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const formValues = methods.getValues();
          localStorage.setItem('actividadDraft', JSON.stringify(formValues));
          
          // Reducir logs innecesarios en producción
          if (process.env.NODE_ENV === 'development') {
            console.log('Borrador guardado automáticamente');
          }
        } catch (err) {
          console.error('Error al guardar borrador:', err);
        }
      }, 120000); // Aumentar a 2 minutos para reducir frecuencia
      
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }
  }, [methods.formState.isDirty, id]);

  // Añadir este useEffect para recuperar borradores guardados al cargar
  useEffect(() => {
    // Solo para nuevas actividades (no ediciones)
    if (id) {
      localStorage.removeItem('actividadDraft');
      return;
    }
    
    const draft = localStorage.getItem('actividadDraft');
    if (draft) {
      if (window.confirm('Se encontró un borrador guardado de una actividad. ¿Desea recuperarlo?')) {
        try {
          const draftData = JSON.parse(draft);
          methods.reset(draftData);
        } catch (err) {
          console.error('Error al cargar borrador:', err);
          localStorage.removeItem('actividadDraft');
        }
      } else {
        localStorage.removeItem('actividadDraft');
      }
    }
  }, [id, methods]);
  useEffect(() => {
    // Para actividades nuevas, asignar el usuario actual como creador una sola vez
    if (!id && currentUser && !formData.creadorId) {
      updateInfo({
        creadorId: currentUser.uid,
        responsableActividadId: currentUser.uid
      });
    }
  }, [id, currentUser, formData.creadorId, updateInfo]);

  // Cargar usuarios para MaterialEditor
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setLoadingUsuarios(true);
        const usuariosData = await listarUsuarios();
        setUsuarios(usuariosData);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    cargarUsuarios();
  }, []);

  if (loading) return <DashboardLayout><Center><Spinner /></Center></DashboardLayout>;
  if (initialError) return <DashboardLayout><Alert status="error">{initialError}</Alert></DashboardLayout>;

  return (
    <DashboardLayout title={id ? "Editar Actividad" : "Crear Actividad"}>
      <Container maxW="container.xl" py={8}>
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <Tabs 
              isFitted 
              variant="enclosed" 
              index={activeTabIndex}
              onChange={handleTabChange}
            >
              <TabList>
                <Tab>
                  <Flex align="center">
                    <FiFileText style={{ marginRight: '5px' }} /> 
                    Información
                    {completedTabs.includes(0) && (
                      <FiCheck
                        style={{ marginLeft: '5px', color: 'green' }}
                      />
                    )}
                  </Flex>
                </Tab>
                <Tab>
                  <Flex align="center">
                    <FiUsers style={{ marginRight: '5px' }} /> 
                    Participantes
                    {completedTabs.includes(1) && (
                      <FiCheck
                        style={{ marginLeft: '5px', color: 'green' }}
                      />
                    )}
                  </Flex>
                </Tab>
                <Tab>
                  <Flex align="center">
                    <FiPackage style={{ marginRight: '5px' }} /> 
                    Material
                    {completedTabs.includes(2) && (
                      <FiCheck
                        style={{ marginLeft: '5px', color: 'green' }}
                      />
                    )}
                  </Flex>
                </Tab>
                <Tab>
                  <Flex align="center">
                    <FiLink style={{ marginRight: '5px' }} /> 
                    Enlaces
                    {completedTabs.includes(3) && (
                      <FiCheck
                        style={{ marginLeft: '5px', color: 'green' }}
                      />
                    )}
                  </Flex>
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <ActividadInfoForm onCancel={handleCancel} />
                </TabPanel>                <TabPanel>
                  <ParticipantesEditor 
                    ref={participantesEditorRef}
                    data={{ ...formData, participanteIds: formData.participanteIds || [] } as Actividad}
                    onSave={handleParticipantesUpdate}
                    onResponsablesChange={handleResponsablesChange}
                    mostrarBotones={false}
                    onCancel={handleCancel}
                    actividadId={id}
                  />
                </TabPanel>                <TabPanel>                  <MaterialEditor 
                    data={{ ...formData, materiales: formData.materiales || [] } as Actividad}
                    onSave={handleMaterialUpdate}
                    isInsideForm={true} 
                    control={methods.control}
                    mostrarBotones={false}
                    actividadId={id}
                    responsables={{
                      responsableActividadId: formData.responsableActividadId || '',
                      responsableMaterialId: formData.responsableMaterialId || '',
                      creadorId: formData.creadorId || ''
                    }}
                    usuarios={usuarios}
                  />
                </TabPanel>
                <TabPanel>
                  <EnlacesEditor 
                    data={formData as Actividad}
                    onSave={updateEnlaces} 
                    mostrarBotones={false}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Botones de navegación entre pestañas */}
            <HStack justifyContent="space-between" mt={4}>
              {/* Botón de Cancelar debe estar siempre visible */}
              <Button 
                leftIcon={<FiX />}
                variant="outline" 
                colorScheme="red"
                onClick={handleCancel}
              >
                Cancelar
              </Button>

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
        {successMessage && <Alert status="success" mt={4}>{successMessage}</Alert>}      </Container>
    </DashboardLayout>
  );
}
