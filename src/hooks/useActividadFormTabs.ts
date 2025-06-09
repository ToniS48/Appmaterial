import { useState, useRef, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { Actividad } from '../types/actividad';
import { useActividadInfoValidation } from './useActividadInfoValidation';
import { toTimestamp, timestampToDate } from '../utils/dateUtils';

interface UseActividadFormTabsProps {
  totalTabs: number;
  onDataUpdate: (data: Partial<Actividad>) => Promise<void>;
  onFinalSubmit: () => Promise<boolean>;
}

export const useActividadFormTabs = ({ totalTabs, onDataUpdate, onFinalSubmit }: UseActividadFormTabsProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [completedTabs, setCompletedTabs] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();
  const validation = useActividadInfoValidation();
  const participantesEditorRef = useRef<{ submitForm: () => boolean }>(null);

  const nextTab = () => {
    if (activeTabIndex < totalTabs - 1) {
      setActiveTabIndex(activeTabIndex + 1);
    }
  };

  const prevTab = () => {
    if (activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const markTabCompleted = (tabIndex: number) => {
    setCompletedTabs(prev => Array.from(new Set([...prev, tabIndex])));
  };  const validateInfoTab = useCallback((data: any, silencioso = false) => {
    console.log('🔧 [DEBUG] validateInfoTab - Datos recibidos:', {
      data,
      tipo: data?.tipo,
      subtipo: data?.subtipo,
      tipoType: typeof data?.tipo,
      subtipoType: typeof data?.subtipo,
      tipoIsArray: Array.isArray(data?.tipo),
      subtipoIsArray: Array.isArray(data?.subtipo),
      tipoLength: data?.tipo?.length,
      subtipoLength: data?.subtipo?.length
    });

    if (!data) {
      console.log('🔧 [DEBUG] validateInfoTab - No hay datos, retornando false');
      return false;
    }

    // Validar campos requeridos básicos
    const nombreValido = data.nombre && data.nombre.trim().length > 0;
    const lugarValido = data.lugar && data.lugar.trim().length > 0;
    
    console.log('🔧 [DEBUG] validateInfoTab - Validación básica:', {
      nombreValido,
      lugarValido,
      nombre: data.nombre,
      lugar: data.lugar
    });

    // Validar arrays de tipo y subtipo
    const tipoValido = data.tipo && Array.isArray(data.tipo) && data.tipo.length > 0;
    const subtipoValido = data.subtipo && Array.isArray(data.subtipo) && data.subtipo.length > 0;

    console.log('🔧 [DEBUG] validateInfoTab - Validación arrays:', {
      tipoValido,
      subtipoValido,
      tipoData: data.tipo,
      subtipoData: data.subtipo
    });

    const todosValidos = nombreValido && lugarValido && tipoValido && subtipoValido;

    console.log('🔧 [DEBUG] validateInfoTab - Resultado final:', {
      todosValidos,
      breakdown: {
        nombreValido,
        lugarValido,
        tipoValido,
        subtipoValido
      }
    });

    // Verificar que tipo y subtipo tengan al menos un elemento (son requeridos en el formulario completo)
    if (!tipoValido && !silencioso) {
      validation.setError('tipo', 'Debe seleccionar al menos un tipo de actividad', true);
    }
    if (!subtipoValido && !silencioso) {
      validation.setError('subtipo', 'Debe seleccionar al menos un subtipo de actividad', true);
    }
      // Limpiar errores si los campos son válidos
    if (tipoValido && validation.clearErrors) {
      validation.clearErrors('tipo');
    }
    if (subtipoValido && validation.clearErrors) {
      validation.clearErrors('subtipo');
    }      let fechasValidas = true;
    if (data.fechaInicio && data.fechaFin) {
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
      if (!data.fechaInicio) {
        validation.setError('fechaInicio', 'La fecha de inicio es obligatoria', !silencioso);
      }
      if (!data.fechaFin) {
        validation.setError('fechaFin', 'La fecha de fin es obligatoria', !silencioso);
      }
    }
    
    return Boolean(nombreValido && lugarValido && tipoValido && subtipoValido && fechasValidas);
  }, []);

  const showValidationError = () => {
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
      }, 50);
    }
  };
  const handleTabSubmit = async (data: Partial<Actividad>) => {
    console.log('🚀 [DEBUG] handleTabSubmit - INICIO DEL SUBMIT:', {
      activeTabIndex,
      data,
      dataKeys: Object.keys(data || {}),
      tipo: data?.tipo,
      subtipo: data?.subtipo,
      tipoType: typeof data?.tipo,
      subtipoType: typeof data?.subtipo,
      tipoIsArray: Array.isArray(data?.tipo),
      subtipoIsArray: Array.isArray(data?.subtipo),
      timestamp: new Date().toLocaleTimeString()
    });
    
    setIsSubmitting(true);
    
    try {
      if (activeTabIndex === 0) {
        console.log('🔍 [DEBUG] Procesando tab 0 (Info) - Datos antes de validación:', data);
        // Validar información básica
        const isValid = validateInfoTab(data);
        if (isValid) {
          await onDataUpdate(data);
          markTabCompleted(0);
          nextTab();
        } else {
          validateInfoTab(data, false); // Mostrar errores
          showValidationError();
        }
      } else if (activeTabIndex === 1) {
        // Validar participantes
        if (participantesEditorRef.current) {
          const result = participantesEditorRef.current.submitForm();
          if (result === true) {
            markTabCompleted(1);
            nextTab();
          }
        }
      } else if (activeTabIndex === 2) {
        // Materiales
        if (data.materiales) {
          await onDataUpdate({ materiales: data.materiales });
        }
        markTabCompleted(2);
        nextTab();
      } else if (activeTabIndex === 3) {
        // Enlaces y guardado final
        await onDataUpdate(data);
        await onFinalSubmit();
      }
    } catch (error) {
      console.error("Error en handleTabSubmit:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (newIndex: number) => {
    // Permitir navegación libre entre pestañas
    setActiveTabIndex(newIndex);
  };

  return {
    activeTabIndex,
    completedTabs,
        isSubmitting,
    participantesEditorRef,
    nextTab,
    prevTab,
    handleTabSubmit,
    handleTabChange,
    setActiveTabIndex
  };
};
