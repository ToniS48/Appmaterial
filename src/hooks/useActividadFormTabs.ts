import { useState, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { Actividad } from '../types/actividad';
import { useActividadInfoValidation } from './useActividadInfoValidation';

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
  };

  const validateInfoTab = (data: Partial<Actividad>, silent = true): boolean => {
    const nombreValido = validation.validateNombre(data.nombre || '', silent) === undefined;
    const lugarValido = validation.validateLugar(data.lugar || '', silent) === undefined;
    const tipoValido = validation.validateTipo(data.tipo || [], silent) === undefined;
    const subtipoValido = validation.validateSubtipo(data.subtipo || [], silent) === undefined;
    
    let fechasValidas = true;
    if (data.fechaInicio && data.fechaFin) {
      const fechaInicio = data.fechaInicio instanceof Date 
        ? data.fechaInicio 
        : data.fechaInicio.toDate();
      
      const fechaFin = data.fechaFin instanceof Date 
        ? data.fechaFin 
        : data.fechaFin.toDate();
      
      validation.validateFechas(fechaInicio, fechaFin, silent);
      fechasValidas = !validation.errors.fechaFin;
    } else {
      fechasValidas = Boolean(data.fechaInicio && data.fechaFin);
      if (!data.fechaInicio) {
        validation.setError('fechaInicio', 'La fecha de inicio es obligatoria', !silent);
      }
      if (!data.fechaFin) {
        validation.setError('fechaFin', 'La fecha de fin es obligatoria', !silent);
      }
    }
    
    return nombreValido && lugarValido && tipoValido && subtipoValido && fechasValidas;
  };

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
    setIsSubmitting(true);
    
    try {
      if (activeTabIndex === 0) {
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
