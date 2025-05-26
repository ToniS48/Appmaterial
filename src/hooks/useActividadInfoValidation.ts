import { useZodValidation } from './useZodValidation';
import { actividadBaseSchema } from '../schemas/actividadSchema';
import { useToast } from '@chakra-ui/react';
import { useEffect, useCallback, useRef } from 'react';
import validationMessages from '../constants/validationMessages';

/**
 * Hook personalizado para validación de la información básica de actividades
 */
export function useActividadInfoValidation() {
  const toast = useToast();
  const validation = useZodValidation(actividadBaseSchema);
  const { errors, validate, validateField, setError, clearErrors } = validation;
  
  // Agregar ref para rastrear el estado de error anterior
  const prevErrorRef = useRef<boolean>(false);

  // Funciones específicas para validar cada campo importante
  const validateNombre = (nombre: string, silencioso = true) => {
    if (!nombre || nombre.trim() === '') {
      if (silencioso) {
        return false; // No mostrar error si es silencioso
      } else {
        // Si no es silencioso, mostrar error y toast
        setError('nombre', 'El nombre es obligatorio', !silencioso);
        return 'El nombre es obligatorio';
      }
    }
    return validateField('nombre', nombre, { showToast: !silencioso });
  };

  const validateLugar = (lugar: string, silencioso = true) => {
    if (!lugar || lugar.trim() === '') {
      if (silencioso) {
        return false; // No mostrar error si es silencioso
      } else {
        // Si no es silencioso, mostrar error y toast
        setError('lugar', 'El lugar es obligatorio', !silencioso);
        return 'El lugar es obligatorio';
      }
    }
    return validateField('lugar', lugar, { showToast: !silencioso });
  };
  const validateTipo = (tipo: string[], silencioso = true) => {
    // Tipo es opcional en el formulario básico
    if (!tipo || tipo.length === 0) {
      return true; // No hay error si está vacío
    }
    return validateField('tipo', tipo, { showToast: !silencioso });
  };

  const validateSubtipo = (subtipo: string[], silencioso = true) => {
    // Subtipo es opcional en el formulario básico
    if (!subtipo || subtipo.length === 0) {
      return true; // No hay error si está vacío
    }
    return validateField('subtipo', subtipo, { showToast: !silencioso });
  };const validateFechaInicio = (fecha: Date | null | undefined, silencioso = true) => {
    if (!fecha) {
      if (silencioso) {
        return false;
      } else {
        setError('fechaInicio', 'La fecha de inicio es obligatoria', !silencioso);
        return 'La fecha de inicio es obligatoria';
      }
    }
    return validateField('fechaInicio', fecha, { showToast: !silencioso });
  };
  
  const validateFechaFin = (fecha: Date | null | undefined, silencioso = true) => {
    if (!fecha) {
      if (silencioso) {
        return false;
      } else {
        setError('fechaFin', 'La fecha de finalización es obligatoria', !silencioso);
        return 'La fecha de finalización es obligatoria';
      }
    }
    return validateField('fechaFin', fecha, { showToast: !silencioso });
  };
  // Corregir la función validateFechas para evitar bucles infinitos y manejar modo silencioso
  const validateFechas = useCallback((fechaInicio: Date | null | undefined, fechaFin: Date | null | undefined, silencioso = true) => {
    // No validar si alguna fecha falta
    if (!fechaInicio || !fechaFin) {
      return;
    }
    
    // Determinar si hay error de fechas
    const tieneError = fechaInicio > fechaFin;
    const yaExisteError = Boolean(errors.fechaFin);
      // Solo actualizar el estado si hay un cambio en la condición de error
    if (tieneError !== prevErrorRef.current) {
      prevErrorRef.current = tieneError;
      
      if (tieneError) {
        setError('fechaFin', validationMessages.activity.dateRangeInvalid, !silencioso);
      } else {
        clearErrors(['fechaFin']);
      }
    }
  }, [setError, clearErrors, errors.fechaFin]);

  return {
    ...validation,
    validateNombre,
    validateLugar,
    validateTipo,
    validateSubtipo,
    validateFechaInicio,
    validateFechaFin,
    validateFechas,
  };
}