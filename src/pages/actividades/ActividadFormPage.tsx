import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { 
  Box, Tabs, TabList, Tab, TabPanels, TabPanel, Container, 
  Button, HStack, Center, Spinner, Alert, Spacer, Flex, useToast,
  useBreakpointValue, Text, Tooltip
} from '@chakra-ui/react';
import { FiArrowLeft, FiArrowRight, FiSave, FiFileText, FiUsers, FiPackage, FiLink, FiCheck, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
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
import { serializeTimestampsForStorage, deserializeTimestampsFromStorage, toTimestamp, timestampToDate } from '../../utils/dateUtils';

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
    saveActividad,  } = useActividadForm({ actividadId: id });
  
  // Añadir hook de optimizaciones para prevenir violaciones
  const {
    optimizedSave,
    optimizedTabChange,
    optimizedFormUpdate,
    getMetrics,
    resetMetrics  } = useActividadOptimizations({ enableLogging: process.env.NODE_ENV === 'development' });
  
  // Hook para notificaciones
  const toast = useToast();
  
  // Hooks para diseño responsivo
  const showTabText = useBreakpointValue({ base: false, sm: false, md: true });
  const tabSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const tabFontSize = useBreakpointValue({ base: 'xs', sm: 'sm', md: 'md' });
  
  // Hook de validación
  const validation = useActividadInfoValidation();
  
  // Estados del componente
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [completedTabs, setCompletedTabs] = useState<number[]>([]);
  const totalTabs = 4; // Número total de pestañas  // Optimizar el scheduler de React al cargar el componente (simplificado)
  useLayoutEffect(() => {
    // Configurar el optimizador de forma simplificada
    const cleanupScheduler = setupSchedulerOptimizer();
    
    return () => {
      // Limpiar optimizaciones cuando se desmonta el componente
      if (cleanupScheduler) cleanupScheduler();
    };
  }, []);
  
  // Función para renderizar el contenido de una pestaña de forma responsiva
  const renderTabContent = (icon: React.ReactElement, text: string, isCompleted: boolean) => {
    const content = (
      <Flex align="center" justify="center" gap={showTabText ? 2 : 0}>
        {React.cloneElement(icon, { 
          size: showTabText ? '16' : '18',
          style: { flexShrink: 0 }
        })}
        {showTabText && (
          <Text fontSize={tabFontSize} whiteSpace="nowrap">
            {text}
          </Text>
        )}
        {isCompleted && (
          <FiCheck
            size={showTabText ? '14' : '16'}
            style={{ color: 'green', flexShrink: 0 }}
          />
        )}
      </Flex>
    );

    // En pantallas pequeñas, envolver en Tooltip para mostrar el texto
    if (!showTabText) {
      return (
        <Tooltip label={text} placement="bottom" hasArrow>
          {content}
        </Tooltip>
      );
    }    return content;
  };
  // Llamar al hook en el nivel superior
  const { validate } = useZodValidation(actividadBaseSchema);
  
  // 🔧 CORRECCIÓN CRÍTICA: Usar useMemo para estabilizar defaultValues y evitar re-creaciones
  const stableDefaultValues = useMemo(() => {
    // Solo usar valores iniciales estables, no formData que cambia constantemente
    return {
      nombre: '',
      lugar: '',
      descripcion: '',
      tipo: [],
      subtipo: [],
      participanteIds: [],
      materiales: [],
      enlaces: [],
      enlacesWikiloc: [],
      enlacesTopografias: [],
      enlacesDrive: [],
      enlacesWeb: [],
      comentarios: []
    };
  }, []);
  
  const methods = useForm<Actividad>({
    defaultValues: stableDefaultValues,
    mode: 'onSubmit',
    reValidateMode: "onSubmit",
  });

  const { handleSubmit, watch } = methods;  // 🔧 CORRECCIÓN: Sincronización controlada para evitar bucles
  const watchedMateriales = watch('materiales');
  
  // Usar ref para rastrear la última sincronización y evitar bucles
  const lastSyncedMateriales = useRef<any[]>([]);
  
  useEffect(() => {
    // Solo sincronizar si hay cambios reales y evitar bucles
    if (watchedMateriales && Array.isArray(watchedMateriales)) {
      // Comparar si realmente hay cambios
      const materialesStringified = JSON.stringify(watchedMateriales);
      const lastStringified = JSON.stringify(lastSyncedMateriales.current);
      
      if (materialesStringified !== lastStringified) {
        console.log("🔄 ActividadFormPage - Sincronizando materiales (cambio detectado):", watchedMateriales);
        
        // Actualizar ref inmediatamente para evitar bucles
        lastSyncedMateriales.current = watchedMateriales;
        
        // Usar setTimeout para evitar conflictos
        const timeoutId = setTimeout(() => {
          updateMaterial(watchedMateriales);
        }, 50);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [watchedMateriales, updateMaterial]);

  // Función helper para convertir fechas de Timestamp a Date
  const convertTimestampToDate = (timestamp: any): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return timestamp;
  };
  // 🔧 CORRECCIÓN: Usar ref para evitar bucles infinitos en reset de formulario
  const hasDataBeenLoaded = useRef(false);
  
  // 🔧 CORRECCIÓN CRÍTICA: Sincronizar datos cargados con React Hook Form para actividades existentes
  useEffect(() => {
    // Solo sincronizar una vez cuando se cargan los datos
    if (id && !loading && formData && Object.keys(formData).length > 1 && !hasDataBeenLoaded.current) {
      console.log('🔄 ActividadFormPage - Cargando datos en React Hook Form (primera vez):', formData);
      
      // Convertir Timestamps de Firebase a objetos Date para React Hook Form
      const formDataForReset = {
        ...formData,
        fechaInicio: convertTimestampToDate(formData.fechaInicio),
        fechaFin: convertTimestampToDate(formData.fechaFin),
        fechaCreacion: convertTimestampToDate(formData.fechaCreacion),
        fechaActualizacion: convertTimestampToDate(formData.fechaActualizacion)
      };
      
      // Resetear el formulario con los datos cargados de la actividad
      methods.reset(formDataForReset);
      
      // Marcar que hemos cargado los datos para evitar bucles infinitos
      hasDataBeenLoaded.current = true;
      setHasRecoveredDraft(true);
    }
  }, [id, loading, formData, methods]);

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
            if (activeTabIndex === 0) {              // Pestaña de información - Validamos antes de avanzar
              const isValid = await validateFirstTabSilent(data);
                if (isValid) {
                optimizedFormUpdate(updateInfo, data);
                setCompletedTabs(prev => Array.from(new Set([...prev, 0])));
                nextTab();} else {
                setFirstTabErrors(data);
              }
            } else if (activeTabIndex === 1) {
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
              }            } else if (activeTabIndex === 2) {
              // Obtener materiales directamente del formulario React Hook Form
              const materialesActuales = methods.getValues('materiales') || [];
              console.log("ActividadFormPage - Materiales del formulario:", materialesActuales);
              
              // Actualizar materiales de forma optimizada
              optimizedFormUpdate(updateMaterial, materialesActuales);
              
              // Marcar esta pestaña como completada
              setCompletedTabs(prev => Array.from(new Set([...prev, 2])));              
              // Avanzar a la siguiente pestaña
              nextTab();
            } else if (activeTabIndex === 3) {
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
    } finally {      setIsSubmitting(false);
    }
  };

  // Añadir una función helper para validar la primera pestaña
  const validateFirstTab = (data: any, silencioso: boolean = false) => {
    const nombreResult = validation.validateNombre(data.nombre || '', silencioso);
    const lugarResult = validation.validateLugar(data.lugar || '', silencioso);
    const tipoResult = validation.validateTipo(data.tipo || [], silencioso);
    const subtipoResult = validation.validateSubtipo(data.subtipo || [], silencioso);
    
    // CORRECCIÓN: Un campo es válido cuando NO hay error (undefined o falsy)
    const nombreValido = !nombreResult;
    const lugarValido = !lugarResult; 
    const tipoValido = !tipoResult;
    const subtipoValido = !subtipoResult;
      let fechasValidas = true;    if (data.fechaInicio && data.fechaFin) {
      // NUEVA ESTRATEGIA: Convertir a Timestamp primero, luego a Date solo para validación
      const timestampInicio = toTimestamp(data.fechaInicio);
      const timestampFin = toTimestamp(data.fechaFin);
        if (timestampInicio && timestampFin) {
        const fechaInicio = timestampToDate(timestampInicio);
        const fechaFin = timestampToDate(timestampFin);
        if (fechaInicio && fechaFin) {
          validation.validateFechas(fechaInicio, fechaFin, silencioso);
          fechasValidas = !validation.errors.fechaFin;
        }
      } else {
        fechasValidas = false;
        if (!timestampInicio) {
          validation.setError('fechaInicio', 'Fecha de inicio inválida', !silencioso);
        }
        if (!timestampFin) {
          validation.setError('fechaFin', 'Fecha de fin inválida', !silencioso);
        }
      }
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
  };// Función personalizada para manejar materiales con asignación automática de responsable
  const handleMaterialUpdate = (materiales: any[]) => {
    try {
      console.log("ActividadFormPage handleMaterialUpdate - Recibidos materiales:", materiales);
      
      // Actualizar los materiales en useActividadForm
      updateMaterial(materiales);
      
      // También actualizar en React Hook Form para mantener sincronización
      methods.setValue('materiales', materiales, { shouldDirty: true });
      
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
  };  // Validación de la primera pestaña optimizada
  const validateFirstTabSilent = async (data: Partial<Actividad>): Promise<boolean> => {
    return new Promise((resolve) => {
      // Planificar la validación para el siguiente frame de animación
      requestAnimationFrame(() => {
        try {
          const nombreResult = validation.validateNombre(data.nombre || '', true);
          const lugarResult = validation.validateLugar(data.lugar || '', true);
          const tipoResult = validation.validateTipo(data.tipo || [], true);
          const subtipoResult = validation.validateSubtipo(data.subtipo || [], true);
          
          // CORRECCIÓN: Un campo es válido cuando NO hay error
          const nombreValido = !nombreResult;
          const lugarValido = !lugarResult;
          const tipoValido = !tipoResult;
          const subtipoValido = !subtipoResult;          
          let fechasValidas = true;
          if (data.fechaInicio && data.fechaFin) {
            // NUEVA ESTRATEGIA: Convertir a Timestamp primero, luego a Date solo para validación
            const timestampInicio = toTimestamp(data.fechaInicio);
            const timestampFin = toTimestamp(data.fechaFin);
            
            if (timestampInicio && timestampFin) {
              const fechaInicio = timestampToDate(timestampInicio);
              const fechaFin = timestampToDate(timestampFin);
              if (fechaInicio && fechaFin) {
                validation.validateFechas(fechaInicio, fechaFin, true);
                fechasValidas = !validation.errors.fechaFin;
              }
            } else {
              fechasValidas = false;
            }
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
  };  // Función para establecer errores en la primera pestaña de forma optimizada
  const setFirstTabErrors = (data: Partial<Actividad>): void => {
    // Usar requestAnimationFrame para no bloquear la UI mientras se establecen errores
    requestAnimationFrame(() => {
      console.log('🔍 setFirstTabErrors - Datos recibidos:', data);
      
      // Llamar validaciones en modo COMPLETAMENTE silencioso (sin setError calls)
      const nombreResult = validation.validateNombre(data.nombre || '', true);
      const lugarResult = validation.validateLugar(data.lugar || '', true);
      const tipoResult = validation.validateTipo(data.tipo || [], true);
      const subtipoResult = validation.validateSubtipo(data.subtipo || [], true);
      
      console.log('🔍 setFirstTabErrors - Resultados de validación:', {
        nombreResult,
        lugarResult,
        tipoResult,
        subtipoResult
      });
      
      // CORRECCIÓN: Un campo es válido cuando NO hay error
      const nombreValido = !nombreResult;
      const lugarValido = !lugarResult;
      const tipoValido = !tipoResult;
      const subtipoValido = !subtipoResult;
      
      console.log('🔍 setFirstTabErrors - Estados de validez:', {
        nombreValido,
        lugarValido,
        tipoValido,
        subtipoValido
      });      // Si ya ejecutamos la validación con silencioso=false, no necesitamos ejecutarla de nuevo
      // Los errores ya se han establecido en la primera llamada
      
      let fechasValidas = true;
      if (data.fechaInicio && data.fechaFin) {
        // NUEVA ESTRATEGIA: Convertir a Timestamp primero, luego a Date solo para validación
        const timestampInicio = toTimestamp(data.fechaInicio);
        const timestampFin = toTimestamp(data.fechaFin);
        
        if (timestampInicio && timestampFin) {
          const fechaInicio = timestampToDate(timestampInicio);
          const fechaFin = timestampToDate(timestampFin);
          if (fechaInicio && fechaFin) {
            validation.validateFechas(fechaInicio, fechaFin, false);
            fechasValidas = !validation.errors.fechaFin;
          }
        } else {
          fechasValidas = false;
          if (!timestampInicio) {
            validation.setError('fechaInicio', 'Fecha de inicio inválida', false);
          }
          if (!timestampFin) {
            validation.setError('fechaFin', 'Fecha de fin inválida', false);
          }
        }
      } else {
        fechasValidas = false;
        if (!data.fechaInicio) {
          validation.setError('fechaInicio', 'La fecha de inicio es obligatoria', false);
        }
        if (!data.fechaFin) {
          validation.setError('fechaFin', 'La fecha de fin es obligatoria', false);
        }
      }
      
      console.log('🔍 setFirstTabErrors - Estado de fechas:', {
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        fechasValidas
      });        // Mostrar toast de error con prevención de duplicados y errores específicos
      const camposFaltantes: string[] = [];
      if (!nombreValido) camposFaltantes.push('Nombre');
      if (!lugarValido) camposFaltantes.push('Lugar');
      if (!tipoValido) camposFaltantes.push('Tipo de actividad');
      if (!subtipoValido) camposFaltantes.push('Subtipo de actividad');
      if (!data.fechaInicio) camposFaltantes.push('Fecha de inicio');
      if (!data.fechaFin) camposFaltantes.push('Fecha de fin');
      
      console.log('🔍 setFirstTabErrors - Campos faltantes:', camposFaltantes);
      
      const toastId = "validation-tab-error";
      if (!toast.isActive(toastId) && camposFaltantes.length > 0) {
        console.log('📢 setFirstTabErrors - Mostrando toast con mensaje específico');
        setTimeout(() => {
          toast({
            id: toastId,
            title: "Campos requeridos faltantes",
            description: `Por favor, complete: ${camposFaltantes.join(', ')}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }, 50); // Pequeño retraso para evitar colisiones con otros eventos de UI
      } else if (camposFaltantes.length === 0) {
        console.log('✅ setFirstTabErrors - Todos los campos están completos');
      } else {
        console.log('⚠️ setFirstTabErrors - Toast ya activo, no mostrando duplicado');
      }
    });
  };  // Añadir validación para el cambio de pestañas (usando hook optimizado)
  const handleTabChange = async (newIndex: number) => {
    // Solo validar si avanzamos, no si retrocedemos
    if (newIndex > activeTabIndex) {
      try {
        // Capturar los datos actuales del formulario
        const formData = methods.getValues();
        
        // Validación específica por pestaña
        if (activeTabIndex === 0) {
          // Usar la versión asíncrona optimizada de la validación
          const isValid = await validateFirstTabSilent(formData);
          
          if (isValid) {
            // Usar la función optimizada del hook
            optimizedTabChange(setActiveTabIndex, newIndex);
          } else {
            // Establecer errores sin bloquear la UI
            setFirstTabErrors(formData);
          }
        } else {
          // Para otras pestañas, hacemos el cambio directamente
          optimizedTabChange(setActiveTabIndex, newIndex);
        }
      } catch (error) {
        console.error("Error durante el cambio de pestaña:", error);
        // Fallback en caso de error
        setActiveTabIndex(newIndex);
      }
    } else {
      // Si retrocedemos, permitir sin validación
      optimizedTabChange(setActiveTabIndex, newIndex);
    }
  };
    // Estado para manejar autoguardado y recuperación de borrador
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(false);
  const lastChangeTimeRef = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Recuperar borrador una sola vez al montar el componente
  useEffect(() => {
    // Solo para nuevas actividades (no ediciones)
    if (id) {
      localStorage.removeItem('actividadDraft');
      setHasRecoveredDraft(true);
      return;
    }
    
    const draft = localStorage.getItem('actividadDraft');
    if (draft && !hasRecoveredDraft) {      if (window.confirm('Se encontró un borrador guardado de una actividad. ¿Desea recuperarlo?')) {        try {
          const parsedData = JSON.parse(draft);
          // NUEVA ESTRATEGIA: Deserializar timestamps correctamente desde localStorage
          const draftData = deserializeTimestampsFromStorage(parsedData);
          console.log('🔄 Recuperando borrador con timestamps deserializados:', draftData);
          
          // Resetear el formulario con los datos del borrador
          methods.reset(draftData);
          
          // CORRECCIÓN: Sincronizar validación después de cargar el borrador
          setTimeout(() => {
            // Ejecutar validación para sincronizar el estado después de cargar el borrador
            const data = methods.getValues();
            console.log('🔄 Sincronizando validación después de cargar borrador:', data);
            
            // Usar la nueva función revalidateAllFields para sincronizar todo
            validation.revalidateAllFields(data, false);
            
            console.log('✅ Validación sincronizada después de cargar borrador');
          }, 100); // Pequeño delay para permitir que el formulario se actualice completamente
          
        } catch (err) {
          console.error('Error al cargar borrador:', err);
          localStorage.removeItem('actividadDraft');
        }
      } else {
        localStorage.removeItem('actividadDraft');
      }
    }
    setHasRecoveredDraft(true);
  }, [id]); // Solo depende de id para ejecutarse una vez
  
  // Autoguardado separado
  useEffect(() => {
    // Evitar autoguardar si estamos editando una actividad existente o no hemos recuperado borrador
    if (id || !hasRecoveredDraft) return;
    
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
          const formValues = methods.getValues();          // NUEVA ESTRATEGIA: Serializar timestamps correctamente para localStorage
          const serializedData = serializeTimestampsForStorage(formValues);
          localStorage.setItem('actividadDraft', JSON.stringify(serializedData));
          
          // Reducir logs innecesarios en producción
          if (process.env.NODE_ENV === 'development') {
            console.log('Borrador guardado automáticamente');
          }
        } catch (err) {
          console.error('Error al guardar borrador:', err);
        }
      }, 120000); // 2 minutos para reducir frecuencia
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [methods.formState.isDirty, id, hasRecoveredDraft]);
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
      <Container 
        maxW="container.xl" 
        py={8} 
        px={{ base: 4, md: 8 }}
        w="full"
      >
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >            <Tabs 
              variant="enclosed" 
              index={activeTabIndex}
              onChange={handleTabChange}
              size={tabSize}
              isFitted={!showTabText} // Solo usar isFitted en pantallas pequeñas
            >
              <TabList 
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
                }}
              >
                <Tab minW={showTabText ? 'auto' : '60px'} px={showTabText ? 4 : 2}>
                  {renderTabContent(<FiFileText />, 'Información', completedTabs.includes(0))}
                </Tab>
                <Tab minW={showTabText ? 'auto' : '60px'} px={showTabText ? 4 : 2}>
                  {renderTabContent(<FiUsers />, 'Participantes', completedTabs.includes(1))}
                </Tab>
                <Tab minW={showTabText ? 'auto' : '60px'} px={showTabText ? 4 : 2}>
                  {renderTabContent(<FiPackage />, 'Material', completedTabs.includes(2))}
                </Tab>
                <Tab minW={showTabText ? 'auto' : '60px'} px={showTabText ? 4 : 2}>
                  {renderTabContent(<FiLink />, 'Enlaces', completedTabs.includes(3))}
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
            </Tabs>            {/* Botones de navegación entre pestañas */}
            <Box mt={4}>
              {/* En pantallas pequeñas, usar layout vertical para botones */}
              <Flex 
                direction={{ base: 'column', md: 'row' }} 
                gap={{ base: 2, md: 0 }}
                justifyContent="space-between"
                align={{ base: 'stretch', md: 'center' }}
              >
                {/* Botón de Cancelar debe estar siempre visible */}
                <Button 
                  leftIcon={<FiX />}
                  variant="outline" 
                  colorScheme="red"
                  onClick={handleCancel}
                  size={{ base: 'sm', md: 'md' }}
                  order={{ base: 3, md: 1 }}
                >
                  Cancelar
                </Button>

                {/* Botones de navegación en pantallas grandes */}
                <Flex 
                  gap={2} 
                  order={{ base: 1, md: 2 }}
                  flex="1"
                  justify={{ base: 'space-between', md: 'flex-end' }}
                  display={{ base: activeTabIndex > 0 || activeTabIndex < totalTabs - 1 ? 'flex' : 'none', md: 'flex' }}
                >
                  {activeTabIndex > 0 && (
                    <Button 
                      onClick={prevTab} 
                      leftIcon={<FiArrowLeft />}
                      size={{ base: 'sm', md: 'md' }}
                      flex={{ base: 1, md: 'none' }}
                    >
                      {showTabText ? 'Anterior' : ''}
                    </Button>
                  )}
                  
                  {/* Spacer solo en pantallas grandes */}
                  <Box flex="1" display={{ base: 'none', md: 'block' }} />
                  
                  {activeTabIndex < totalTabs - 1 ? (
                    <Button 
                      colorScheme="brand" 
                      onClick={handleSubmit(onSubmit)} 
                      rightIcon={<FiArrowRight />}
                      isLoading={isSubmitting}
                      size={{ base: 'sm', md: 'md' }}
                      flex={{ base: 1, md: 'none' }}
                    >
                      {showTabText ? 'Siguiente' : 'Sig.'}
                    </Button>
                  ) : (
                    <Button 
                      colorScheme="green" 
                      onClick={handleSubmit(onSubmit)}
                      isLoading={isSubmitting}
                      leftIcon={<FiSave />}
                      size={{ base: 'sm', md: 'md' }}
                      flex={{ base: 1, md: 'none' }}
                      order={{ base: 2, md: 1 }}
                    >
                      {showTabText ? 'Guardar Actividad' : 'Guardar'}
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Box>
          </form>
        </FormProvider>
        
        {error && <Alert status="error" mt={4}>{error}</Alert>}
        {successMessage && <Alert status="success" mt={4}>{successMessage}</Alert>}      </Container>
    </DashboardLayout>
  );
}
